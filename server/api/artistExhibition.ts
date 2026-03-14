import express from 'express';
import multer from 'multer';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getEffectivePlan, requireMinimumPlan } from '../middleware/subscription.js';
import { PLAN_LIMITS } from '../config/planLimits.js';
import { ObjectStorageService } from '../objectStorage.js';

// Gallery preset IDs available on the base Artist plan (Classic Gallery only)
const ARTIST_ALLOWED_PRESET_IDS = ['white-cube-v1'];
// These presets require Artist Pro
const PRO_ONLY_PRESET_IDS = ['modern-gallery-v2', 'industrial-loft', 'daylight-atrium', 'hybrid-studio'];

const storageService = new ObjectStorageService();

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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

// Get all exhibitions for artist (for Artist Pro multiple exhibitions)
router.get('/exhibitions', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT id, title, subtitle, gallery_type, status, cover_image_url, created_at, updated_at,
       (SELECT COUNT(*) FROM artist_exhibition_artworks WHERE exhibition_id = artist_exhibitions.id) as artwork_count
       FROM artist_exhibitions 
       WHERE artist_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const exhibitions = result.rows.map(exhibition => ({
      id: exhibition.id,
      title: exhibition.title,
      subtitle: exhibition.subtitle,
      galleryType: exhibition.gallery_type,
      status: exhibition.status,
      coverImageUrl: exhibition.cover_image_url,
      artworkCount: parseInt(exhibition.artwork_count) || 0,
      createdAt: exhibition.created_at,
      updatedAt: exhibition.updated_at
    }));

    res.json({ exhibitions });
  } catch (error: any) {
    console.error('Error fetching artist exhibitions:', error);
    res.status(500).json({ error: 'Failed to fetch exhibitions', details: error.message });
  }
});

// Get exhibition memberships for a specific artwork (Artist Pro feature)
router.get('/artwork/:artworkId/exhibitions', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const artworkId = parseInt(req.params.artworkId);

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    // Get all exhibitions for this artist with membership status for the specified artwork
    const result = await query(
      `SELECT 
        ae.id, 
        ae.title, 
        ae.status,
        CASE WHEN aea.id IS NOT NULL THEN true ELSE false END as is_member
       FROM artist_exhibitions ae
       LEFT JOIN artist_exhibition_artworks aea 
         ON ae.id = aea.exhibition_id AND aea.source_artwork_id = $2
       WHERE ae.artist_id = $1
       ORDER BY ae.created_at DESC`,
      [userId, artworkId]
    );

    const exhibitions = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      status: row.status,
      isMember: row.is_member
    }));

    res.json({ exhibitions });
  } catch (error: any) {
    console.error('Error fetching artwork exhibitions:', error);
    res.status(500).json({ error: 'Failed to fetch artwork exhibitions', details: error.message });
  }
});

// Legacy single exhibition endpoint (for backward compatibility)
router.get('/exhibition', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT id, title, subtitle, gallery_type, status, cover_image_url, created_at, updated_at,
       (SELECT COUNT(*) FROM artist_exhibition_artworks WHERE exhibition_id = artist_exhibitions.id) as artwork_count
       FROM artist_exhibitions 
       WHERE artist_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ exhibition: null });
    }

    const exhibition = result.rows[0];
    res.json({
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        subtitle: exhibition.subtitle,
        galleryType: exhibition.gallery_type,
        status: exhibition.status,
        coverImageUrl: exhibition.cover_image_url,
        artworkCount: parseInt(exhibition.artwork_count) || 0,
        createdAt: exhibition.created_at,
        updatedAt: exhibition.updated_at
      }
    });
  } catch (error: any) {
    console.error('Error fetching artist exhibition:', error);
    res.status(500).json({ error: 'Failed to fetch exhibition', details: error.message });
  }
});

router.post('/exhibition', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { title, subtitle, galleryType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Exhibition title is required' });
    }

    // Get user's effective plan to check exhibition limits
    const effectivePlan = getEffectivePlan(req.user);
    const exhibitionLimit = PLAN_LIMITS[effectivePlan]?.exhibitions ?? 0;
    const isUnlimitedPlan = exhibitionLimit === -1;
    
    // Check existing exhibitions count
    const existingResult = await query(
      'SELECT COUNT(*) as count FROM artist_exhibitions WHERE artist_id = $1',
      [userId]
    );
    const currentCount = parseInt(existingResult.rows[0].count) || 0;

    // Enforce exhibition limit based on plan (0 = none allowed, -1 = unlimited, N = exact limit)
    if (exhibitionLimit === 0) {
      return res.status(403).json({
        error: 'Exhibition limit reached',
        message: 'Your plan does not include exhibition access. Upgrade to Artist or Artist Pro.',
        limit: 0,
        currentCount
      });
    }
    if (!isUnlimitedPlan && currentCount >= exhibitionLimit) {
      return res.status(400).json({ 
        error: 'Exhibition limit reached',
        message: `You have reached your limit of ${exhibitionLimit} exhibition${exhibitionLimit !== 1 ? 's' : ''}. Upgrade to Artist Pro for unlimited exhibitions.`,
        limit: exhibitionLimit,
        currentCount
      });
    }

    const validGalleryType = galleryType || 'classic';

    const result = await query(
      `INSERT INTO artist_exhibitions (artist_id, title, subtitle, gallery_type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, title.trim(), subtitle?.trim() || null, validGalleryType]
    );

    const exhibition = result.rows[0];
    console.log('Artist exhibition created:', { id: exhibition.id, artistId: userId, title: exhibition.title, plan: effectivePlan });

    res.status(201).json({
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        subtitle: exhibition.subtitle,
        galleryType: exhibition.gallery_type,
        status: exhibition.status,
        artworkCount: 0,
        createdAt: exhibition.created_at,
        updatedAt: exhibition.updated_at
      },
      message: 'Exhibition created successfully'
    });
  } catch (error: any) {
    console.error('Error creating artist exhibition:', error);
    res.status(500).json({ error: 'Failed to create exhibition', details: error.message });
  }
});

router.put('/exhibition/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);
    const { title, subtitle, status } = req.body;

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const validStatuses = ['draft', 'published'];
    const newStatus = status && validStatuses.includes(status) ? status : checkResult.rows[0].status;

    const result = await query(
      `UPDATE artist_exhibitions 
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle),
           status = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND artist_id = $5
       RETURNING *`,
      [title?.trim() || null, subtitle?.trim() || null, newStatus, exhibitionId, userId]
    );

    const exhibition = result.rows[0];
    res.json({
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        subtitle: exhibition.subtitle,
        galleryType: exhibition.gallery_type,
        status: exhibition.status,
        createdAt: exhibition.created_at,
        updatedAt: exhibition.updated_at
      },
      message: 'Exhibition updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating artist exhibition:', error);
    res.status(500).json({ error: 'Failed to update exhibition', details: error.message });
  }
});

router.delete('/exhibition/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    await query('DELETE FROM artist_exhibitions WHERE id = $1', [exhibitionId]);

    console.log('Artist exhibition deleted:', { id: exhibitionId, artistId: userId });
    res.json({ message: 'Exhibition deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting artist exhibition:', error);
    res.status(500).json({ error: 'Failed to delete exhibition', details: error.message });
  }
});

router.get('/exhibition/:id/artworks', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    // JOIN with artworks table to get fresh clean_image_id, story, and current dimensions
    const result = await query(
      `SELECT 
         aea.id, aea.exhibition_id, aea.source_artwork_id, aea.title, aea.artist_name,
         aea.width_value, aea.height_value, aea.dimension_unit, aea.slot_id, aea.created_at,
         a.clean_image_id, a.updated_at as artwork_updated_at,
         a.image_url as artwork_image_url, a.storage_key,
         a.width as artwork_width, a.height as artwork_height,
         a.story, a.price_amount, a.price_currency, a.buy_url
       FROM artist_exhibition_artworks aea
       LEFT JOIN artworks a ON a.id = aea.source_artwork_id
       WHERE aea.exhibition_id = $1 
       ORDER BY aea.created_at DESC`,
      [exhibitionId]
    );

    res.json({
      artworks: result.rows.map(row => {
        const cacheBust = row.artwork_updated_at ? new Date(row.artwork_updated_at).getTime() : Date.now();
        const sourceId = row.source_artwork_id;

        // Derive clean_image_url from the artwork's designated exhibition image (clean_image_id)
        let cleanImageUrl: string;
        if (row.clean_image_id !== null && row.clean_image_id !== undefined) {
          cleanImageUrl = row.clean_image_id === 0
            ? `/api/artwork-image/${sourceId}?t=${cacheBust}`
            : `/api/artwork-gallery-image/${row.clean_image_id}?t=${cacheBust}`;
        } else {
          // No designation: fall back to the artwork's cover/main image (never a mockup)
          cleanImageUrl = `/api/artwork-image/${sourceId}?t=${cacheBust}`;
        }

        // Derive image_url: always use the live artwork cover image (not the stale stored copy)
        const imageUrl = `/api/artwork-image/${sourceId}?t=${cacheBust}`;

        // Dimensions: prefer current artwork dimensions, fall back to stored values
        const width = parseFloat(row.artwork_width) || parseFloat(row.width_value) || 100;
        const height = parseFloat(row.artwork_height) || parseFloat(row.height_value) || 70;

        return {
          // Slot matching fields (snake_case to match Gallery360Editor expectations)
          id: row.id,
          artwork_id: sourceId,
          source_artwork_id: sourceId,
          title: row.title,
          artist_name: row.artist_name,
          image_url: imageUrl,
          clean_image_url: cleanImageUrl,
          width_cm: width,
          height_cm: height,
          width_value: width,
          height_value: height,
          dimension_unit: row.dimension_unit,
          slot_id: row.slot_id,
          story: row.story || null,
          price_amount: row.price_amount ? parseFloat(row.price_amount) : null,
          price_currency: row.price_currency || 'EUR',
          buy_url: row.buy_url || null,
          // Legacy camelCase
          exhibitionId: row.exhibition_id,
          sourceArtworkId: sourceId,
          imageUrl: imageUrl,
          cleanImageUrl: cleanImageUrl,
          widthValue: width,
          heightValue: height,
          dimensionUnit: row.dimension_unit,
          priceAmount: row.price_amount ? parseFloat(row.price_amount) : null,
          priceCurrency: row.price_currency || 'EUR',
          buyUrl: row.buy_url || null,
          createdAt: row.created_at
        };
      })
    });
  } catch (error: any) {
    console.error('Error fetching exhibition artworks:', error);
    res.status(500).json({ error: 'Failed to fetch exhibition artworks', details: error.message });
  }
});

router.post('/exhibition/:id/artworks', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);
    const { title, widthValue, heightValue, dimensionUnit } = req.body;

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Artwork title is required' });
    }

    if (!widthValue || !heightValue) {
      return res.status(400).json({ error: 'Artwork dimensions are required' });
    }

    let imageData: string | null = null;
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      imageData = `data:${req.file.mimetype};base64,${base64}`;
    }

    const result = await query(
      `INSERT INTO artist_exhibition_artworks 
       (exhibition_id, title, width_value, height_value, dimension_unit, image_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [exhibitionId, title.trim(), parseFloat(widthValue), parseFloat(heightValue), dimensionUnit || 'cm', imageData]
    );

    const artwork = result.rows[0];
    console.log('Exhibition artwork added:', { id: artwork.id, exhibitionId });

    res.status(201).json({
      artwork: {
        id: artwork.id,
        exhibitionId: artwork.exhibition_id,
        title: artwork.title,
        widthValue: parseFloat(artwork.width_value),
        heightValue: parseFloat(artwork.height_value),
        dimensionUnit: artwork.dimension_unit,
        createdAt: artwork.created_at
      },
      message: 'Artwork added to exhibition'
    });
  } catch (error: any) {
    console.error('Error adding exhibition artwork:', error);
    res.status(500).json({ error: 'Failed to add artwork', details: error.message });
  }
});

router.post('/exhibition/:id/artworks/link/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);
    const artworkId = parseInt(req.params.artworkId);

    if (isNaN(exhibitionId) || isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid exhibition or artwork ID' });
    }

    const checkExhibition = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkExhibition.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const checkArtwork = await query(
      'SELECT * FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, userId]
    );

    if (checkArtwork.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const existingLink = await query(
      'SELECT id FROM artist_exhibition_artworks WHERE exhibition_id = $1 AND source_artwork_id = $2',
      [exhibitionId, artworkId]
    );

    if (existingLink.rows.length > 0) {
      return res.status(400).json({ error: 'Artwork is already in this exhibition' });
    }

    const artwork = checkArtwork.rows[0];
    
    const imageUrl = artwork.storage_key 
      ? `/api/artwork-image/${artwork.id}` 
      : artwork.image_url;

    const result = await query(
      `INSERT INTO artist_exhibition_artworks 
       (exhibition_id, source_artwork_id, title, image_url, width_value, height_value, dimension_unit, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [exhibitionId, artworkId, artwork.title, imageUrl, artwork.width, artwork.height, artwork.dimension_unit || 'cm']
    );

    console.log('Artwork linked to exhibition:', { exhibitionId, artworkId, linkId: result.rows[0].id });

    res.status(201).json({
      link: {
        id: result.rows[0].id,
        exhibitionId,
        sourceArtworkId: artworkId,
        title: artwork.title
      },
      message: 'Artwork added to exhibition'
    });
  } catch (error: any) {
    console.error('Error linking artwork to exhibition:', error);
    res.status(500).json({ error: 'Failed to add artwork to exhibition', details: error.message });
  }
});

router.delete('/exhibition/:id/artworks/unlink/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);
    const artworkId = parseInt(req.params.artworkId);

    if (isNaN(exhibitionId) || isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid exhibition or artwork ID' });
    }

    const checkExhibition = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkExhibition.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      'DELETE FROM artist_exhibition_artworks WHERE exhibition_id = $1 AND source_artwork_id = $2 RETURNING id',
      [exhibitionId, artworkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found in exhibition' });
    }

    console.log('Artwork unlinked from exhibition:', { exhibitionId, artworkId });
    res.json({ message: 'Artwork removed from exhibition' });
  } catch (error: any) {
    console.error('Error unlinking artwork from exhibition:', error);
    res.status(500).json({ error: 'Failed to remove artwork from exhibition', details: error.message });
  }
});

router.post('/exhibition/:id/publish', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      `UPDATE artist_exhibitions 
       SET status = 'published', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND artist_id = $2
       RETURNING *`,
      [exhibitionId, userId]
    );

    const exhibition = result.rows[0];
    console.log('Exhibition published:', { id: exhibitionId, artistId: userId });

    res.json({
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        subtitle: exhibition.subtitle,
        galleryType: exhibition.gallery_type,
        status: exhibition.status,
        coverImageUrl: exhibition.cover_image_url,
        createdAt: exhibition.created_at,
        updatedAt: exhibition.updated_at
      },
      message: 'Exhibition published successfully'
    });
  } catch (error: any) {
    console.error('Error publishing exhibition:', error);
    res.status(500).json({ error: 'Failed to publish exhibition', details: error.message });
  }
});

router.post('/exhibition/:id/unpublish', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      `UPDATE artist_exhibitions 
       SET status = 'draft', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND artist_id = $2
       RETURNING *`,
      [exhibitionId, userId]
    );

    const exhibition = result.rows[0];
    console.log('Exhibition unpublished:', { id: exhibitionId, artistId: userId });

    res.json({
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        subtitle: exhibition.subtitle,
        galleryType: exhibition.gallery_type,
        status: exhibition.status,
        coverImageUrl: exhibition.cover_image_url,
        createdAt: exhibition.created_at,
        updatedAt: exhibition.updated_at
      },
      message: 'Exhibition unpublished successfully'
    });
  } catch (error: any) {
    console.error('Error unpublishing exhibition:', error);
    res.status(500).json({ error: 'Failed to unpublish exhibition', details: error.message });
  }
});

router.post('/exhibition/:id/cover-image', authenticateToken, (req: any, res: any, next: any) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: 'Image too large. Please upload an image under 5 MB. For best results, use JPG/WebP and keep width around 2000-3000 px.' 
        });
      }
      if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'File upload failed', details: err.message });
    }
    next();
  });
}, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.id);

    console.log('Cover image upload request:', { exhibitionId, userId, hasFile: !!req.file });

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const checkResult = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const oldCoverUrl = checkResult.rows[0].cover_image_url;

    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `exhibition-cover-${exhibitionId}-${Date.now()}.${fileExtension}`;

    console.log('Uploading cover image:', filename);

    const objectPath = await storageService.uploadBuffer(req.file.buffer, filename, req.file.mimetype);
    console.log('Cover image uploaded successfully:', objectPath);

    await query(
      `UPDATE artist_exhibitions 
       SET cover_image_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND artist_id = $3`,
      [objectPath, exhibitionId, userId]
    );

    if (oldCoverUrl && oldCoverUrl.startsWith('/objects/')) {
      try {
        const oldKey = oldCoverUrl.replace('/objects/', '');
        await storageService.deleteObject(oldKey);
        console.log('Old cover image deleted:', oldKey);
      } catch (deleteErr) {
        console.warn('Failed to delete old cover image:', deleteErr);
      }
    }

    res.json({
      coverImageUrl: objectPath,
      message: 'Cover image uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading cover image:', error);
    res.status(500).json({ error: 'Failed to upload cover image', details: error.message });
  }
});

router.delete('/exhibition/:exhibitionId/artworks/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const exhibitionId = parseInt(req.params.exhibitionId);
    const artworkId = parseInt(req.params.artworkId);

    if (isNaN(exhibitionId) || isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid exhibition or artwork ID' });
    }

    const checkExhibition = await query(
      'SELECT * FROM artist_exhibitions WHERE id = $1 AND artist_id = $2',
      [exhibitionId, userId]
    );

    if (checkExhibition.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      'DELETE FROM artist_exhibition_artworks WHERE exhibition_id = $1 AND id = $2 RETURNING id',
      [exhibitionId, artworkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found in exhibition' });
    }

    console.log('Exhibition artwork deleted:', { exhibitionId, artworkId });
    res.json({ message: 'Artwork removed from exhibition' });
  } catch (error: any) {
    console.error('Error deleting exhibition artwork:', error);
    res.status(500).json({ error: 'Failed to remove artwork', details: error.message });
  }
});

router.get('/exhibition/:id/360-scene', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const result = await query(
      `SELECT ae.id, ae.title, ae.scene_360_data, ae.artist_id
       FROM artist_exhibitions ae
       WHERE ae.id = $1`,
      [exhibitionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const exhibition = result.rows[0];
    
    if (exhibition.artist_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let scene360Data = exhibition.scene_360_data || null;
    
    if (scene360Data) {
      const parsedScene = typeof scene360Data === 'string' 
        ? JSON.parse(scene360Data) 
        : scene360Data;
      
      const artworksResult = await query(
        `SELECT aea.id, aea.title, aea.image_url, aea.width_value, aea.height_value, aea.dimension_unit
         FROM artist_exhibition_artworks aea
         WHERE aea.exhibition_id = $1`,
        [exhibitionId]
      );
      
      const hydratedSlots = (parsedScene.slots || []).map((slot: any) => {
        if (!slot.artworkId) return slot;
        
        const artwork = artworksResult.rows.find((a: any) => String(a.id) === slot.artworkId);
        
        if (!artwork) return slot;
        
        return {
          ...slot,
          artworkUrl: artwork.image_url || slot.artworkUrl,
          artworkTitle: artwork.title || slot.artworkTitle,
          width: artwork.width_value || slot.width || 100,
          height: artwork.height_value || slot.height || 70,
          dimensionUnit: artwork.dimension_unit || 'cm'
        };
      });
      
      scene360Data = {
        ...parsedScene,
        slots: hydratedSlots
      };
    }

    res.json({
      collectionId: exhibition.id,
      title: exhibition.title,
      scene360Data
    });
  } catch (err) {
    console.error('Error fetching artist 360 scene:', err);
    res.status(500).json({ error: 'Failed to fetch 360 scene' });
  }
});

router.put('/exhibition/:id/360-scene', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { presetId, slots } = req.body;

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const result = await query(
      'SELECT id, artist_id FROM artist_exhibitions WHERE id = $1',
      [exhibitionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    if (result.rows[0].artist_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate gallery preset access based on plan
    if (presetId && PRO_ONLY_PRESET_IDS.includes(presetId) && req.user?.role !== 'admin') {
      const effectivePlan = getEffectivePlan(req.user);
      if (effectivePlan !== 'artist_pro') {
        return res.status(403).json({
          error: 'This gallery space requires Artist Pro. Please upgrade your plan.',
          code: 'PRESET_NOT_ALLOWED'
        });
      }
    }

    const scene360Data = {
      presetId: presetId || 'white-cube-v1',
      slots: slots || [],
      updatedAt: new Date().toISOString()
    };

    await query(
      `UPDATE artist_exhibitions 
       SET scene_360_data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify(scene360Data), exhibitionId]
    );

    res.json({ success: true, scene360Data });
  } catch (err) {
    console.error('Error saving artist 360 scene:', err);
    res.status(500).json({ error: 'Failed to save 360 scene' });
  }
});

router.get('/exhibition/:id/360-public', async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);

    if (isNaN(exhibitionId)) {
      return res.status(400).json({ error: 'Invalid exhibition ID' });
    }

    const result = await query(
      `SELECT ae.id, ae.title, ae.subtitle, ae.gallery_type, ae.scene_360_data, ae.status, ae.is_published,
              u.display_name as artist_name
       FROM artist_exhibitions ae
       JOIN users u ON ae.artist_id = u.id
       WHERE ae.id = $1`,
      [exhibitionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const exhibition = result.rows[0];
    
    if (exhibition.status !== 'published' && !exhibition.is_published) {
      return res.status(403).json({ error: 'Exhibition is not published' });
    }

    // JOIN with artworks to get clean_image_id, story, and pricing
    const artworksResult = await query(
      `SELECT aea.id, aea.source_artwork_id, aea.title, aea.width_value, aea.height_value, aea.dimension_unit,
              a.clean_image_id, a.updated_at as artwork_updated_at,
              a.width as artwork_width, a.height as artwork_height,
              a.story, a.price_amount, a.price_currency, a.buy_url
       FROM artist_exhibition_artworks aea
       LEFT JOIN artworks a ON a.id = aea.source_artwork_id
       WHERE aea.exhibition_id = $1`,
      [exhibitionId]
    );

    // Map gallery_type to preset ID
    const galleryTypeToPreset: Record<string, string> = {
      'classic': 'white-cube-v1',
      'modern': 'modern-gallery-v2',
      'industrial': 'industrial-loft-v1',
      'daylight': 'daylight-atrium-v1',
      'hybrid': 'hybrid-studio-v1'
    };

    let scene360Data: any;
    
    if (exhibition.scene_360_data) {
      scene360Data = typeof exhibition.scene_360_data === 'string' 
        ? JSON.parse(exhibition.scene_360_data) 
        : exhibition.scene_360_data;
    } else {
      // Create default scene with artworks auto-assigned to slots
      const presetId = galleryTypeToPreset[exhibition.gallery_type] || 'white-cube-v1';
      const defaultSlots: any[] = [];
      
      // Auto-assign artworks to default slot positions
      const slotPrefixes: Record<string, string[]> = {
        'white-cube-v1': ['north-1', 'north-2', 'east-1', 'east-2', 'south-1', 'south-2', 'west-1', 'west-2'],
        'modern-gallery-v2': ['north-1', 'north-2', 'north-3', 'east-1', 'east-2', 'south-1', 'south-2', 'west-1', 'west-2'],
        'industrial-loft-v1': ['north-1', 'north-2', 'east-1', 'south-1', 'south-2', 'west-1'],
        'daylight-atrium-v1': ['north-1', 'north-2', 'north-3', 'east-1', 'south-1', 'south-2', 'west-1'],
        'hybrid-studio-v1': ['hybrid-north-1', 'hybrid-north-2', 'hybrid-east-1', 'hybrid-south-1', 'hybrid-west-1']
      };
      
      const slotIds = slotPrefixes[presetId] || slotPrefixes['white-cube-v1'];
      
      artworksResult.rows.forEach((artwork: any, index: number) => {
        if (index < slotIds.length) {
          const cacheBust = artwork.artwork_updated_at ? new Date(artwork.artwork_updated_at).getTime() : Date.now();
          const sourceId = artwork.source_artwork_id;
          let cleanUrl: string;
          if (artwork.clean_image_id !== null && artwork.clean_image_id !== undefined) {
            cleanUrl = artwork.clean_image_id === 0
              ? `/api/artwork-image/${sourceId}?t=${cacheBust}`
              : `/api/artwork-gallery-image/${artwork.clean_image_id}?t=${cacheBust}`;
          } else {
            cleanUrl = `/api/artwork-image/${sourceId}?t=${cacheBust}`;
          }
          defaultSlots.push({
            slotId: slotIds[index],
            artworkId: String(artwork.id),
            artworkUrl: cleanUrl,
            artworkTitle: artwork.title,
            artistName: exhibition.artist_name,
            width: parseFloat(artwork.artwork_width) || parseFloat(artwork.width_value) || 100,
            height: parseFloat(artwork.artwork_height) || parseFloat(artwork.height_value) || 70,
            dimensionUnit: artwork.dimension_unit || 'cm'
          });
        }
      });
      
      scene360Data = {
        presetId,
        slots: defaultSlots
      };
    }

    const hydratedSlots = (scene360Data.slots || []).map((slot: any) => {
      if (!slot.artworkId) return slot;
      
      let artwork = artworksResult.rows.find((a: any) => String(a.id) === slot.artworkId);
      
      if (!artwork) {
        artwork = artworksResult.rows.find((a: any) => a.source_artwork_id && String(a.source_artwork_id) === slot.artworkId);
      }
      
      if (!artwork) {
        if (slot.artworkUrl) {
          return {
            ...slot,
            width: slot.width || 100,
            height: slot.height || 70,
            dimensionUnit: slot.dimensionUnit || 'cm'
          };
        }
        return slot;
      }
      
      // Compute clean_image_url from the artwork's designated exhibition image
      const cacheBust = artwork.artwork_updated_at ? new Date(artwork.artwork_updated_at).getTime() : Date.now();
      const sourceId = artwork.source_artwork_id;
      let cleanUrl: string;
      if (artwork.clean_image_id !== null && artwork.clean_image_id !== undefined) {
        cleanUrl = artwork.clean_image_id === 0
          ? `/api/artwork-image/${sourceId}?t=${cacheBust}`
          : `/api/artwork-gallery-image/${artwork.clean_image_id}?t=${cacheBust}`;
      } else {
        cleanUrl = `/api/artwork-image/${sourceId}?t=${cacheBust}`;
      }

      return {
        ...slot,
        artworkUrl: cleanUrl,
        artworkTitle: artwork.title || slot.artworkTitle,
        artistName: exhibition.artist_name || slot.artistName,
        width: parseFloat(artwork.artwork_width) || parseFloat(artwork.width_value) || slot.width || 100,
        height: parseFloat(artwork.artwork_height) || parseFloat(artwork.height_value) || slot.height || 70,
        dimensionUnit: artwork.dimension_unit || 'cm',
        story: artwork.story || null,
        priceAmount: artwork.price_amount ? parseFloat(artwork.price_amount) : null,
        priceCurrency: artwork.price_currency || 'EUR',
        buyUrl: artwork.buy_url || null,
        sourceArtworkId: String(artwork.source_artwork_id)
      };
    });

    res.json({
      id: exhibition.id,
      title: exhibition.title,
      subtitle: exhibition.subtitle,
      artistName: exhibition.artist_name,
      galleryType: exhibition.gallery_type,
      scene360Data: {
        ...scene360Data,
        slots: hydratedSlots
      }
    });
  } catch (err) {
    console.error('Error fetching public artist 360 exhibition:', err);
    res.status(500).json({ error: 'Failed to fetch exhibition' });
  }
});

export default router;
