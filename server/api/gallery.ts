import express from 'express';
import multer from 'multer';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkGalleryArtworkLimit, getEffectivePlan, requireMinimumPlan, getPlanLimits } from '../middleware/subscription.js';
import { requireGalleryFeature, requireExhibitionPublicFeature } from '../middleware/featureFlags.js';

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

router.get('/collections', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ 
        error: 'Gallery subscription required',
        message: 'The Gallery dashboard is reserved for Gallery plans. Upgrade to Gallery to manage multi-artist collections.',
        current_plan: effectivePlan,
        suggested_plan: 'gallery',
        upgrade_url: '/pricing'
      });
    }

    console.log('Fetching collections for user:', { userId: req.user.id, effectivePlan });

    let queryText;
    let queryParams;

    if (effectivePlan === 'admin') {
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

router.post('/collections', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'allaccess', 'admin'].includes(effectivePlan) && 
        !(req.user.entitlements?.gallery_access)) {
      return res.status(403).json({ error: 'Only gallery, all-access, and admins can create collections' });
    }

    const { title, subtitle, description, status } = req.body;

    console.log('Creating collection with data:', { title, subtitle, description, status });

    if (!title) {
      return res.status(400).json({ error: 'Collection title is required' });
    }

    // Check exhibition limit for non-admin users (only count published exhibitions)
    const planLimits = getPlanLimits(req.user);
    const exhibitionLimit = planLimits.exhibitions;
    
    if (exhibitionLimit !== -1 && effectivePlan !== 'admin') {
      const countResult = await query(
        "SELECT COUNT(*) as count FROM gallery_collections WHERE gallery_id = $1 AND status = 'published'",
        [req.user.id]
      );
      const currentCount = parseInt(countResult.rows[0].count || '0', 10);
      
      if (currentCount >= exhibitionLimit) {
        return res.status(403).json({
          error: 'Exhibition limit reached',
          message: `You've reached your limit of ${exhibitionLimit} active (published) exhibitions. Upgrade to All-Access for unlimited exhibitions.`,
          current_count: currentCount,
          limit: exhibitionLimit,
          suggested_plan: 'allaccess',
          upgrade_url: '/pricing'
        });
      }
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

router.put('/collections/:id', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Only galleries and admins can update collections' });
    }

    const collectionId = req.params.id;
    const { title, subtitle, description, status } = req.body;

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
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

router.delete('/collections/:id', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
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

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
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

router.get('/collections/:id/artworks', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
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

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view artworks from your own collections' });
    }

    // IMPORTANT: Do NOT use SELECT * - it includes image_data (base64) which makes response 20MB+
    // Only select metadata fields needed for the 360 editor
    const result = await query(
      `SELECT id, collection_id, title, artist_name, image_url, 
              width_value, height_value, dimension_unit,
              price_amount, price_currency, buy_url, description, created_at
       FROM gallery_artworks
       WHERE collection_id = $1
       ORDER BY created_at DESC`,
      [collectionId]
    );

    // Map to frontend-expected format with width_cm/height_cm
    const artworks = result.rows.map(row => {
      // Convert inches to cm if needed
      const unit = row.dimension_unit || 'cm';
      let widthCm = row.width_value || 100;
      let heightCm = row.height_value || 70;
      
      if (unit === 'in') {
        widthCm = widthCm * 2.54;
        heightCm = heightCm * 2.54;
      }

      // Determine orientation
      let orientation: 'horizontal' | 'vertical' | 'square' = 'horizontal';
      if (Math.abs(widthCm - heightCm) < 1) {
        orientation = 'square';
      } else if (heightCm > widthCm) {
        orientation = 'vertical';
      }

      return {
        ...row,
        // Add computed fields for 360 scene
        width_cm: Math.round(widthCm),
        height_cm: Math.round(heightCm),
        width: Math.round(widthCm),  // Also expose as width/height for compatibility
        height: Math.round(heightCm),
        orientation
      };
    });

    console.log(`Found ${artworks.length} artworks (metadata only, no binary data)`);
    res.json({ artworks });
  } catch (error: any) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks', details: error.message });
  }
});

router.post('/collections/:id/artworks', authenticateToken, requireGalleryFeature, checkGalleryArtworkLimit, upload.single('image'), async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ 
        error: 'Gallery subscription required',
        message: 'Adding artworks to collections requires a Gallery subscription.',
        current_plan: effectivePlan,
        suggested_plan: 'gallery',
        upgrade_url: '/pricing'
      });
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

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only add artworks to your own collections' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Artwork image is required' });
    }

    const { title, artistName, widthValue, heightValue, dimensionUnit, priceAmount, priceCurrency, buyUrl, description } = req.body;

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
        dimension_unit, price_amount, price_currency, buy_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        buyUrl || null,
        description || null
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

router.get('/artworks/:id', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
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

    if (effectivePlan !== 'admin' && result.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view artworks from your own collections' });
    }

    console.log('Artwork fetched successfully:', artworkId);
    res.json({ artwork: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({ error: 'Failed to fetch artwork', details: error.message });
  }
});

router.put('/artworks/:id', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Only galleries and admins can update artworks' });
    }

    const artworkId = req.params.id;
    const { title, artistName, widthValue, heightValue, dimensionUnit, priceAmount, priceCurrency, buyUrl, description } = req.body;

    console.log('Updating artwork:', artworkId, 'with data:', { title, artistName, widthValue, heightValue, description });

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

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
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
           buy_url = $8,
           description = $9
       WHERE id = $10
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
        description || null,
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

router.delete('/artworks/:id', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
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

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
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

router.get('/collections/:id/scene', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'allaccess', 'admin'].includes(effectivePlan) && 
        !(req.user.entitlements?.gallery_access)) {
      return res.status(403).json({ error: 'Gallery access required' });
    }

    const collectionId = req.params.id;
    
    const result = await query(
      `SELECT c.id, c.title, c.scene_data, c.gallery_id
       FROM gallery_collections c
       WHERE c.id = $1`,
      [collectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collection = result.rows[0];
    
    if (effectivePlan !== 'admin' && collection.gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this collection' });
    }

    res.json({ 
      collectionId: collection.id,
      title: collection.title,
      sceneData: collection.scene_data || null
    });
  } catch (error: any) {
    console.error('Error fetching scene:', error);
    res.status(500).json({ error: 'Failed to fetch scene', details: error.message });
  }
});

router.put('/collections/:id/scene', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'allaccess', 'admin'].includes(effectivePlan) && 
        !(req.user.entitlements?.gallery_access)) {
      return res.status(403).json({ error: 'Gallery access required' });
    }

    const collectionId = req.params.id;
    const { sceneData } = req.body;

    const validPresetIds = ['white-cube', 'modern-loft', 'concrete-room', 'classic-museum'];
    
    if (!sceneData || typeof sceneData !== 'object') {
      return res.status(400).json({ error: 'Invalid scene data format' });
    }
    
    if (!sceneData.presetId || !validPresetIds.includes(sceneData.presetId)) {
      return res.status(400).json({ error: 'Invalid or missing preset ID' });
    }
    
    if (!Array.isArray(sceneData.placements)) {
      return res.status(400).json({ error: 'Invalid placements format' });
    }
    
    for (const placement of sceneData.placements) {
      if (typeof placement.artworkId !== 'number' ||
          typeof placement.x !== 'number' || placement.x < 0 || placement.x > 1 ||
          typeof placement.y !== 'number' || placement.y < 0 || placement.y > 1 ||
          typeof placement.scale !== 'number' || placement.scale < 0.1 || placement.scale > 5) {
        return res.status(400).json({ error: 'Invalid artwork placement data' });
      }
    }

    const checkResult = await query(
      'SELECT gallery_id FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (effectivePlan !== 'admin' && checkResult.rows[0].gallery_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own collections' });
    }

    const result = await query(
      `UPDATE gallery_collections 
       SET scene_data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, scene_data`,
      [JSON.stringify(sceneData), collectionId]
    );

    console.log('Scene saved for collection:', collectionId);
    res.json({ 
      message: 'Scene saved successfully',
      collectionId: result.rows[0].id,
      sceneData: result.rows[0].scene_data
    });
  } catch (error: any) {
    console.error('Error saving scene:', error);
    res.status(500).json({ error: 'Failed to save scene', details: error.message });
  }
});

router.get('/exhibitions/:id/public', requireExhibitionPublicFeature, async (req, res) => {
  try {
    const collectionId = req.params.id;
    
    const result = await query(
      `SELECT c.id, c.title, c.subtitle, c.description, c.scene_data, c.status,
              u.email as gallery_email
       FROM gallery_collections c
       LEFT JOIN users u ON c.gallery_id = u.id
       WHERE c.id = $1`,
      [collectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const collection = result.rows[0];
    
    if (collection.status !== 'published') {
      return res.status(403).json({ error: 'This exhibition is not published' });
    }

    const artworksResult = await query(
      `SELECT id, title, artist_name, image_url, width, height, dimension_unit, price, currency, buy_url
       FROM gallery_artworks
       WHERE collection_id = $1
       ORDER BY position ASC, created_at ASC`,
      [collectionId]
    );

    res.json({ 
      exhibition: {
        id: collection.id,
        title: collection.title,
        subtitle: collection.subtitle,
        description: collection.description,
        sceneData: collection.scene_data || null,
        galleryEmail: collection.gallery_email
      },
      artworks: artworksResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching public exhibition:', error);
    res.status(500).json({ error: 'Failed to fetch exhibition', details: error.message });
  }
});

export default router;
