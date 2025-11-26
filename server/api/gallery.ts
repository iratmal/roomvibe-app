import express from 'express';
import multer from 'multer';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp) are allowed!'));
    }
  }
});

router.get('/collections', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can access collections' });
    }

    console.log('Fetching collections for user:', { userId: req.user.id, role: req.user.role });

    let queryText;
    let queryParams;

    if (req.user.role === 'admin') {
      queryText = `
        SELECT c.*, u.email as gallery_email,
        (SELECT COUNT(*) FROM gallery_artworks WHERE collection_id = c.id) as artwork_count
        FROM gallery_collections c
        LEFT JOIN users u ON c.gallery_id = u.id
        ORDER BY c.created_at DESC`;
      queryParams = [];
    } else {
      queryText = `
        SELECT c.*,
        (SELECT COUNT(*) FROM gallery_artworks WHERE collection_id = c.id) as artwork_count
        FROM gallery_collections c
        WHERE c.gallery_id = $1
        ORDER BY c.created_at DESC`;
      queryParams = [req.user.id];
    }

    const result = await query(queryText, queryParams);
    console.log(`Found ${result.rows.length} collections`);
    res.json({ collections: result.rows });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections', details: error.message });
  }
});

router.post('/collections', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can create collections' });
    }

    const { title, subtitle, description, status } = req.body;

    console.log('Creating collection with data:', { title, subtitle, description, status });

    if (!title) {
      return res.status(400).json({ error: 'Collection title is required' });
    }

    const validStatuses = ['draft', 'published'];
    const collectionStatus = status && validStatuses.includes(status) ? status : 'draft';

    const result = await query(
      `INSERT INTO gallery_collections (gallery_id, title, subtitle, description, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, title, subtitle || null, description || null, collectionStatus]
    );

    console.log('Collection created successfully:', result.rows[0].id);
    res.status(201).json({ collection: result.rows[0], message: 'Collection created successfully' });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection', details: error.message });
  }
});

router.put('/collections/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can update collections' });
    }

    const collectionId = req.params.id;
    const { title, subtitle, description, status } = req.body;

    console.log('Updating collection:', collectionId, 'with data:', { title, subtitle, description, status });

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own collections' });
    }

    const validStatuses = ['draft', 'published'];
    const collectionStatus = status && validStatuses.includes(status) ? status : checkResult.rows[0].status;

    const result = await query(
      `UPDATE gallery_collections 
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle),
           description = COALESCE($3, description),
           status = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title || null, subtitle || null, description || null, collectionStatus, collectionId]
    );

    console.log('Collection updated successfully:', collectionId);
    res.json({ collection: result.rows[0], message: 'Collection updated successfully' });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection', details: error.message });
  }
});

router.delete('/collections/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can delete collections' });
    }

    const collectionId = req.params.id;
    console.log('Attempting to delete collection:', collectionId);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own collections' });
    }

    await query('DELETE FROM gallery_collections WHERE id = $1', [collectionId]);

    console.log('Collection deleted successfully:', collectionId);
    res.json({ message: 'Collection and all artworks deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection', details: error.message });
  }
});

router.get('/collections/:id/artworks', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can access artworks' });
    }

    const collectionId = req.params.id;
    console.log('Fetching artworks for collection:', collectionId);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view artworks from your own collections' });
    }

    const result = await query(
      `SELECT * FROM gallery_artworks
       WHERE collection_id = $1
       ORDER BY created_at DESC`,
      [collectionId]
    );

    console.log(`Found ${result.rows.length} artworks`);
    res.json({ artworks: result.rows });
  } catch (error: any) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks', details: error.message });
  }
});

router.post('/collections/:id/artworks', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can add artworks' });
    }

    const collectionId = req.params.id;
    console.log('Adding artwork to collection:', collectionId);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only add artworks to your own collections' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Artwork image is required' });
    }

    const { title, artistName, widthValue, heightValue, dimensionUnit, priceAmount, priceCurrency, buyUrl } = req.body;

    if (!title || !artistName || !widthValue || !heightValue) {
      return res.status(400).json({ error: 'Title, artist name, width, and height are required' });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const imageUrl = `/api/gallery-artwork-image/PLACEHOLDER`;
    
    const validUnits = ['cm', 'in'];
    const unit = dimensionUnit && validUnits.includes(dimensionUnit) ? dimensionUnit : 'cm';
    const validCurrencies = ['EUR', 'USD', 'GBP'];
    const currency = priceCurrency && validCurrencies.includes(priceCurrency) ? priceCurrency : 'EUR';

    const result = await query(
      `INSERT INTO gallery_artworks 
       (collection_id, title, artist_name, image_url, image_data, width_value, height_value, 
        dimension_unit, price_amount, price_currency, buy_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        collectionId,
        title,
        artistName,
        imageUrl,
        base64Image,
        parseFloat(widthValue),
        parseFloat(heightValue),
        unit,
        priceAmount ? parseFloat(priceAmount) : null,
        currency,
        buyUrl || null
      ]
    );

    const artworkId = result.rows[0].id;
    await query(
      `UPDATE gallery_artworks SET image_url = $1 WHERE id = $2`,
      [`/api/gallery-artwork-image/${artworkId}`, artworkId]
    );
    result.rows[0].image_url = `/api/gallery-artwork-image/${artworkId}`;

    console.log('Artwork added successfully:', artworkId);
    res.status(201).json({ artwork: result.rows[0], message: 'Artwork added successfully' });
  } catch (error: any) {
    console.error('Error adding artwork:', error);
    res.status(500).json({ error: 'Failed to add artwork', details: error.message });
  }
});

router.get('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can access artworks' });
    }

    const artworkId = req.params.id;
    console.log('Fetching artwork:', artworkId);

    const result = await query(
      `SELECT a.*, c.gallery_id 
       FROM gallery_artworks a
       JOIN gallery_collections c ON a.collection_id = c.id
       WHERE a.id = $1`,
      [artworkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (req.user.role !== 'admin' && result.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view artworks from your own collections' });
    }

    console.log('Artwork fetched successfully:', artworkId);
    res.json({ artwork: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({ error: 'Failed to fetch artwork', details: error.message });
  }
});

router.put('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can update artworks' });
    }

    const artworkId = req.params.id;
    const { title, artistName, widthValue, heightValue, dimensionUnit, priceAmount, priceCurrency, buyUrl } = req.body;

    console.log('Updating artwork:', artworkId, 'with data:', { title, artistName, widthValue, heightValue });

    const checkResult = await query(
      `SELECT a.*, c.gallery_id 
       FROM gallery_artworks a
       JOIN gallery_collections c ON a.collection_id = c.id
       WHERE a.id = $1`,
      [artworkId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update artworks from your own collections' });
    }

    if (!title || !artistName || !widthValue || !heightValue) {
      return res.status(400).json({ error: 'Title, artist name, width, and height are required' });
    }

    const validUnits = ['cm', 'in'];
    const unit = dimensionUnit && validUnits.includes(dimensionUnit) ? dimensionUnit : 'cm';
    const validCurrencies = ['EUR', 'USD', 'GBP'];
    const currency = priceCurrency && validCurrencies.includes(priceCurrency) ? priceCurrency : 'EUR';

    const result = await query(
      `UPDATE gallery_artworks 
       SET title = $1,
           artist_name = $2,
           width_value = $3,
           height_value = $4,
           dimension_unit = $5,
           price_amount = $6,
           price_currency = $7,
           buy_url = $8
       WHERE id = $9
       RETURNING *`,
      [
        title,
        artistName,
        parseFloat(widthValue),
        parseFloat(heightValue),
        unit,
        priceAmount ? parseFloat(priceAmount) : null,
        currency,
        buyUrl || null,
        artworkId
      ]
    );

    console.log('Artwork updated successfully:', artworkId);
    res.json({ artwork: result.rows[0], message: 'Artwork updated successfully' });
  } catch (error: any) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork', details: error.message });
  }
});

router.delete('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'gallery' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only galleries and admins can delete artworks' });
    }

    const artworkId = req.params.id;
    console.log('Attempting to delete artwork:', artworkId);

    const checkResult = await query(
      `SELECT a.*, c.gallery_id 
       FROM gallery_artworks a
       JOIN gallery_collections c ON a.collection_id = c.id
       WHERE a.id = $1`,
      [artworkId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete artworks from your own collections' });
    }

    await query('DELETE FROM gallery_artworks WHERE id = $1', [artworkId]);

    console.log('Artwork deleted successfully:', artworkId);
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork', details: error.message });
  }
});

export default router;
