import express from 'express';
import multer from 'multer';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getEffectivePlan, requireMinimumPlan } from '../middleware/subscription.js';
import { ObjectStorageService } from '../objectStorage.js';

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

    const existingResult = await query(
      'SELECT id FROM artist_exhibitions WHERE artist_id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an exhibition. Each artist can have one virtual exhibition.' });
    }

    const validGalleryType = galleryType || 'classic';

    const result = await query(
      `INSERT INTO artist_exhibitions (artist_id, title, subtitle, gallery_type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, title.trim(), subtitle?.trim() || null, validGalleryType]
    );

    const exhibition = result.rows[0];
    console.log('Artist exhibition created:', { id: exhibition.id, artistId: userId, title: exhibition.title });

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

    const result = await query(
      `SELECT id, exhibition_id, source_artwork_id, title, artist_name, image_url, 
              width_value, height_value, dimension_unit, slot_id, created_at
       FROM artist_exhibition_artworks 
       WHERE exhibition_id = $1 
       ORDER BY created_at DESC`,
      [exhibitionId]
    );

    res.json({
      artworks: result.rows.map(row => ({
        id: row.id,
        exhibitionId: row.exhibition_id,
        sourceArtworkId: row.source_artwork_id,
        title: row.title,
        artistName: row.artist_name,
        imageUrl: row.image_url,
        widthValue: parseFloat(row.width_value),
        heightValue: parseFloat(row.height_value),
        dimensionUnit: row.dimension_unit,
        slotId: row.slot_id,
        createdAt: row.created_at
      }))
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

export default router;
