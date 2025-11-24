import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/artworks/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'artwork-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.get('/artworks', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only artists and admins can access artworks' });
    }

    let queryText;
    let queryParams;

    if (req.user.role === 'admin') {
      queryText = `SELECT a.id, a.artist_id, a.title, a.image_url, a.width, a.height, a.price_amount, a.price_currency, a.buy_url, a.created_at, a.updated_at, u.email as artist_email
                   FROM artworks a
                   LEFT JOIN users u ON a.artist_id = u.id
                   ORDER BY a.created_at DESC`;
      queryParams = [];
    } else {
      queryText = `SELECT id, artist_id, title, image_url, width, height, price_amount, price_currency, buy_url, created_at, updated_at
                   FROM artworks 
                   WHERE artist_id = $1 
                   ORDER BY created_at DESC`;
      queryParams = [req.user.id];
    }

    const result = await query(queryText, queryParams);
    res.json({ artworks: result.rows });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

router.post('/artworks', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only artists and admins can create artworks' });
    }

    const { title, width, height, priceAmount, priceCurrency, buyUrl, artistId } = req.body;

    if (!title || !width || !height || !buyUrl) {
      return res.status(400).json({ error: 'Missing required fields: title, width, height, buyUrl' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageUrl = `/uploads/artworks/${req.file.filename}`;
    
    const targetArtistId = req.user.role === 'admin' && artistId ? parseInt(artistId) : req.user.id;
    const currency = priceCurrency || 'EUR';

    const result = await query(
      `INSERT INTO artworks (artist_id, title, image_url, width, height, price_amount, price_currency, buy_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id, artist_id, title, image_url, width, height, price_amount, price_currency, buy_url, created_at, updated_at`,
      [targetArtistId, title, imageUrl, parseFloat(width), parseFloat(height), priceAmount ? parseFloat(priceAmount) : null, currency, buyUrl]
    );

    res.status(201).json({ artwork: result.rows[0], message: 'Artwork created successfully' });
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

router.put('/artworks/:id', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only artists and admins can update artworks' });
    }

    const artworkId = parseInt(req.params.id);
    const { title, width, height, priceAmount, priceCurrency, buyUrl } = req.body;

    let existingArtwork;
    if (req.user.role === 'admin') {
      existingArtwork = await query('SELECT * FROM artworks WHERE id = $1', [artworkId]);
    } else {
      existingArtwork = await query('SELECT * FROM artworks WHERE id = $1 AND artist_id = $2', [artworkId, req.user.id]);
    }

    if (existingArtwork.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or you do not have permission to edit it' });
    }

    let imageUrl = existingArtwork.rows[0].image_url;
    if (req.file) {
      imageUrl = `/uploads/artworks/${req.file.filename}`;
    }

    const currency = priceCurrency || existingArtwork.rows[0].price_currency || 'EUR';

    const result = await query(
      `UPDATE artworks 
       SET title = $1, image_url = $2, width = $3, height = $4, price_amount = $5, price_currency = $6, buy_url = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, artist_id, title, image_url, width, height, price_amount, price_currency, buy_url, created_at, updated_at`,
      [title, imageUrl, parseFloat(width), parseFloat(height), priceAmount ? parseFloat(priceAmount) : null, currency, buyUrl, artworkId]
    );

    res.json({ artwork: result.rows[0], message: 'Artwork updated successfully' });
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

router.delete('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only artists and admins can delete artworks' });
    }

    const artworkId = parseInt(req.params.id);

    let result;
    if (req.user.role === 'admin') {
      result = await query('DELETE FROM artworks WHERE id = $1 RETURNING id', [artworkId]);
    } else {
      result = await query('DELETE FROM artworks WHERE id = $1 AND artist_id = $2 RETURNING id', [artworkId, req.user.id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or you do not have permission to delete it' });
    }

    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

export default router;
