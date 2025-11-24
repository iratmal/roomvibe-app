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
    const effectiveRole = req.user.role === 'admin' && req.user.impersonating
      ? req.user.impersonating
      : req.user.role;

    if (effectiveRole !== 'artist') {
      return res.status(403).json({ error: 'Only artists can access artworks' });
    }

    const result = await query(
      `SELECT id, artist_id, title, image_url, width, height, price, buy_url, created_at, updated_at
       FROM artworks 
       WHERE artist_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ artworks: result.rows });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

router.post('/artworks', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const effectiveRole = req.user.role === 'admin' && req.user.impersonating
      ? req.user.impersonating
      : req.user.role;

    if (effectiveRole !== 'artist') {
      return res.status(403).json({ error: 'Only artists can create artworks' });
    }

    const { title, width, height, price, buyUrl } = req.body;

    if (!title || !width || !height || !buyUrl) {
      return res.status(400).json({ error: 'Missing required fields: title, width, height, buyUrl' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageUrl = `/uploads/artworks/${req.file.filename}`;

    const result = await query(
      `INSERT INTO artworks (artist_id, title, image_url, width, height, price, buy_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING id, artist_id, title, image_url, width, height, price, buy_url, created_at, updated_at`,
      [req.user.id, title, imageUrl, parseFloat(width), parseFloat(height), price ? parseFloat(price) : null, buyUrl]
    );

    res.status(201).json({ artwork: result.rows[0], message: 'Artwork created successfully' });
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

router.put('/artworks/:id', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const effectiveRole = req.user.role === 'admin' && req.user.impersonating
      ? req.user.impersonating
      : req.user.role;

    if (effectiveRole !== 'artist') {
      return res.status(403).json({ error: 'Only artists can update artworks' });
    }

    const artworkId = parseInt(req.params.id);
    const { title, width, height, price, buyUrl } = req.body;

    const existingArtwork = await query(
      'SELECT * FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, req.user.id]
    );

    if (existingArtwork.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or you do not have permission to edit it' });
    }

    let imageUrl = existingArtwork.rows[0].image_url;
    if (req.file) {
      imageUrl = `/uploads/artworks/${req.file.filename}`;
    }

    const result = await query(
      `UPDATE artworks 
       SET title = $1, image_url = $2, width = $3, height = $4, price = $5, buy_url = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND artist_id = $8
       RETURNING id, artist_id, title, image_url, width, height, price, buy_url, created_at, updated_at`,
      [title, imageUrl, parseFloat(width), parseFloat(height), price ? parseFloat(price) : null, buyUrl, artworkId, req.user.id]
    );

    res.json({ artwork: result.rows[0], message: 'Artwork updated successfully' });
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

router.delete('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    const effectiveRole = req.user.role === 'admin' && req.user.impersonating
      ? req.user.impersonating
      : req.user.role;

    if (effectiveRole !== 'artist') {
      return res.status(403).json({ error: 'Only artists can delete artworks' });
    }

    const artworkId = parseInt(req.params.id);

    const result = await query(
      'DELETE FROM artworks WHERE id = $1 AND artist_id = $2 RETURNING id',
      [artworkId, req.user.id]
    );

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
