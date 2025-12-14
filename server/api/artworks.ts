import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkArtworkLimit, getEffectivePlan, requireMinimumPlan } from '../middleware/subscription.js';
import { generateTagsFromImage } from '../services/imageTagging.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
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
    // Safeguard: ensure user is authenticated with valid ID
    if (!req.user || !req.user.id) {
      console.warn('[GET /artworks] Missing user ID in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    // Allow all authenticated users to view their own artworks (for usage tracking)
    // Even free users need to see their artworks to understand their upload limit
    console.log('Fetching artworks for user:', { userId: req.user.id, effectivePlan });

    let queryText;
    let queryParams;

    if (effectivePlan === 'admin') {
      queryText = `SELECT a.id, a.artist_id, a.title, a.image_url, a.width, a.height, a.dimension_unit, a.price_amount, a.price_currency, a.buy_url, a.tags, a.orientation, a.style_tags, a.dominant_colors, a.medium, a.availability, a.created_at, a.updated_at, u.email as artist_email
                   FROM artworks a
                   LEFT JOIN users u ON a.artist_id = u.id
                   ORDER BY a.created_at DESC`;
      queryParams = [];
    } else {
      queryText = `SELECT id, artist_id, title, image_url, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, created_at, updated_at
                   FROM artworks 
                   WHERE artist_id = $1 
                   ORDER BY created_at DESC`;
      queryParams = [req.user.id];
    }

    const result = await query(queryText, queryParams);
    const artworks = result.rows || [];
    console.log(`Found ${artworks.length} artworks`);
    res.json({ artworks });
  } catch (error: any) {
    console.error('Error fetching artworks:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Failed to fetch artworks', details: error.message });
  }
});

// Role-agnostic endpoint to get current user's artworks (for Studio)
// Works for any account type: User, Artist, Designer, Gallery
router.get('/mine', authenticateToken, async (req: any, res) => {
  try {
    // Safeguard: ensure user is authenticated with valid ID
    if (!req.user || !req.user.id) {
      console.warn('[/mine] Missing user ID in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('[/mine] Fetching artworks for logged-in user:', req.user.id);
    
    const result = await query(
      `SELECT id, title, image_url, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, created_at
       FROM artworks 
       WHERE artist_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    // Transform to Studio-friendly format - gracefully handle empty results
    const rows = result.rows || [];
    const artworks = rows.map((row: any) => ({
      id: `db-${row.id}`,
      title: row.title,
      overlayImageUrl: row.image_url,
      widthCm: parseFloat(row.width),
      heightCm: parseFloat(row.height),
      dimensionUnit: row.dimension_unit || 'cm',
      priceAmount: row.price_amount,
      priceCurrency: row.price_currency || 'EUR',
      buyUrl: row.buy_url,
      tags: row.tags || [],
      orientation: row.orientation || null,
      styleTags: row.style_tags || [],
      dominantColors: row.dominant_colors || [],
      medium: row.medium || null,
      availability: row.availability || 'available'
    }));
    
    console.log(`[/mine] Found ${artworks.length} artworks for user ${req.user.id}`);
    res.json({ artworks });
  } catch (error: any) {
    console.error('[/mine] Error fetching user artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

router.post('/artworks', authenticateToken, checkArtworkLimit, upload.single('image'), async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    // Allow all authenticated users to upload artworks (limit enforced by checkArtworkLimit middleware)
    // Free users can upload 1 artwork, paid users have higher limits

    const { title, width, height, dimensionUnit, priceAmount, priceCurrency, buyUrl, artistId, orientation, styleTags, dominantColors, medium, availability } = req.body;

    console.log('[Upload] Creating artwork with data:', { title, width, height, dimensionUnit, priceAmount, priceCurrency, buyUrl, hasFile: !!req.file, orientation, medium, availability });

    if (!title || !width || !height || !buyUrl) {
      console.error('Missing required fields:', { title: !!title, width: !!width, height: !!height, buyUrl: !!buyUrl });
      return res.status(400).json({ error: 'Missing required fields: title, width, height, buyUrl' });
    }

    if (!req.file) {
      console.error('No image file uploaded');
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    console.log('[Upload] Image converted to base64, size:', imageData.length);
    
    const targetArtistId = effectivePlan === 'admin' && artistId ? parseInt(artistId) : req.user.id;
    const currency = priceCurrency || 'EUR';
    const unit = dimensionUnit || 'cm';

    // Generate AI tags from image (non-blocking, with fallback to empty array)
    console.log('[Upload] Generating AI tags for artwork...');
    const tags = await generateTagsFromImage(req.file.buffer.toString('base64'), req.file.mimetype);
    console.log('[Upload] Generated tags:', tags);

    // Parse connect metadata
    const styleTagsJson = styleTags ? (typeof styleTags === 'string' ? styleTags : JSON.stringify(styleTags)) : '[]';
    const dominantColorsJson = dominantColors ? (typeof dominantColors === 'string' ? dominantColors : JSON.stringify(dominantColors)) : '[]';
    const artworkOrientation = orientation || null;
    const artworkMedium = medium || null;
    const artworkAvailability = availability || 'available';

    console.log('Inserting artwork into database...');
    const result = await query(
      `INSERT INTO artworks (artist_id, title, image_url, image_data, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
       RETURNING id, artist_id, title, image_url, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, created_at, updated_at`,
      [targetArtistId, title, `/api/artwork-image/${Date.now()}`, imageData, parseFloat(width), parseFloat(height), unit, priceAmount ? parseFloat(priceAmount) : null, currency, buyUrl, tags, artworkOrientation, styleTagsJson, dominantColorsJson, artworkMedium, artworkAvailability]
    );

    const artworkId = result.rows[0].id;
    await query(`UPDATE artworks SET image_url = $1 WHERE id = $2`, [`/api/artwork-image/${artworkId}`, artworkId]);
    result.rows[0].image_url = `/api/artwork-image/${artworkId}`;

    console.log('Artwork created successfully:', artworkId);
    res.status(201).json({ artwork: result.rows[0], message: 'Artwork created successfully' });
  } catch (error: any) {
    console.error('Error creating artwork:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to create artwork', details: error.message });
  }
});

router.put('/artworks/:id', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['artist', 'designer', 'gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Only artists and admins can update artworks' });
    }

    const artworkId = parseInt(req.params.id);
    const { title, width, height, dimensionUnit, priceAmount, priceCurrency, buyUrl, orientation, styleTags, dominantColors, medium, availability } = req.body;

    let existingArtwork;
    if (effectivePlan === 'admin') {
      existingArtwork = await query('SELECT * FROM artworks WHERE id = $1', [artworkId]);
    } else {
      existingArtwork = await query('SELECT * FROM artworks WHERE id = $1 AND artist_id = $2', [artworkId, req.user.id]);
    }

    if (existingArtwork.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or you do not have permission to edit it' });
    }

    let imageUrl = existingArtwork.rows[0].image_url;
    let imageData = existingArtwork.rows[0].image_data;
    
    if (req.file) {
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      imageUrl = `/api/artwork-image/${artworkId}`;
      console.log('[Update] New image converted to base64, size:', imageData.length);
    }

    const currency = priceCurrency || existingArtwork.rows[0].price_currency || 'EUR';
    const unit = dimensionUnit || existingArtwork.rows[0].dimension_unit || 'cm';

    // Parse connect metadata for update
    const styleTagsJson = styleTags !== undefined 
      ? (typeof styleTags === 'string' ? styleTags : JSON.stringify(styleTags || [])) 
      : JSON.stringify(existingArtwork.rows[0].style_tags || []);
    const dominantColorsJson = dominantColors !== undefined 
      ? (typeof dominantColors === 'string' ? dominantColors : JSON.stringify(dominantColors || [])) 
      : JSON.stringify(existingArtwork.rows[0].dominant_colors || []);
    const artworkOrientation = orientation !== undefined ? orientation : existingArtwork.rows[0].orientation;
    const artworkMedium = medium !== undefined ? medium : existingArtwork.rows[0].medium;
    const artworkAvailability = availability !== undefined ? availability : (existingArtwork.rows[0].availability || 'available');

    const result = await query(
      `UPDATE artworks 
       SET title = $1, image_url = $2, image_data = $3, width = $4, height = $5, dimension_unit = $6, price_amount = $7, price_currency = $8, buy_url = $9, orientation = $10, style_tags = $11, dominant_colors = $12, medium = $13, availability = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING id, artist_id, title, image_url, width, height, dimension_unit, price_amount, price_currency, buy_url, orientation, style_tags, dominant_colors, medium, availability, created_at, updated_at`,
      [title, imageUrl, imageData, parseFloat(width), parseFloat(height), unit, priceAmount ? parseFloat(priceAmount) : null, currency, buyUrl, artworkOrientation, styleTagsJson, dominantColorsJson, artworkMedium, artworkAvailability, artworkId]
    );

    res.json({ artwork: result.rows[0], message: 'Artwork updated successfully' });
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

router.delete('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['artist', 'designer', 'gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Only artists and admins can delete artworks' });
    }

    const artworkId = parseInt(req.params.id);

    let result;
    if (effectivePlan === 'admin') {
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
