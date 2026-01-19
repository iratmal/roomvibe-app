import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkArtworkLimit, getEffectivePlan, requireMinimumPlan } from '../middleware/subscription.js';
import { generateTagsFromImage } from '../services/imageTagging.js';
import { ObjectStorageService } from '../objectStorage.js';

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
  // Prevent caching of dynamic artwork list
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    // Safeguard: ensure user is authenticated with valid ID
    if (!req.user || !req.user.id) {
      console.warn('[GET /artworks] Missing user ID in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Safely get effective plan with fallback
    let effectivePlan = 'user';
    try {
      effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    } catch (planError) {
      console.warn('[GET /artworks] Error getting effective plan, defaulting to user:', planError);
      effectivePlan = 'user';
    }
    
    // Allow all authenticated users to view their own artworks (for usage tracking)
    // Even free users need to see their artworks to understand their upload limit
    // DEBUG: Log full user context to diagnose ownership issues
    console.log('[GET /artworks] User context:', { 
      userId: req.user.id, 
      email: req.user.email,
      role: req.user.role,
      effectivePlan,
      entitlements: req.user.entitlements
    });

    let queryText;
    let queryParams;

    if (effectivePlan === 'admin') {
      queryText = `SELECT a.id, a.artist_id, a.title, a.image_url, a.storage_key, a.width, a.height, a.dimension_unit, a.price_amount, a.price_currency, a.buy_url, a.tags, a.orientation, a.style_tags, a.dominant_colors, a.medium, a.availability, a.visible_to_designers, a.visible_to_galleries, a.variants, a.created_at, a.updated_at, u.email as artist_email
                   FROM artworks a
                   LEFT JOIN users u ON a.artist_id = u.id
                   ORDER BY a.created_at DESC`;
      queryParams = [];
    } else {
      queryText = `SELECT id, artist_id, title, image_url, storage_key, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, visible_to_designers, visible_to_galleries, variants, created_at, updated_at
                   FROM artworks 
                   WHERE artist_id = $1 
                   ORDER BY created_at DESC`;
      queryParams = [req.user.id];
    }

    const result = await query(queryText, queryParams);
    // Always return array, never null/undefined
    const artworks = result?.rows || [];
    
    // Normalize image_url to API endpoint format for frontend compatibility
    // Also add requiresReupload flag for artworks missing storage_key
    artworks.forEach((a: any) => {
      // Check if artwork needs re-upload (missing storage_key)
      const hasValidStorageKey = a.storage_key && a.storage_key.trim() !== '';
      const hasValidImageUrl = a.image_url && (a.image_url.startsWith('/objects/') || a.image_url.startsWith('http'));
      a.requiresReupload = !hasValidStorageKey && !hasValidImageUrl;
      
      if (a.image_url && a.image_url.startsWith('/objects/')) {
        a.image_url = `/api/artwork-image/${a.id}`;
      }
    });
    
    console.log(`Found ${artworks.length} artworks`);
    res.json({ artworks });
  } catch (error: any) {
    console.error('[GET /artworks] Error:', error?.message || error);
    // Return empty array instead of 500 for graceful degradation
    // This prevents the red error banner on User Dashboard
    console.warn('[GET /artworks] Returning empty array due to error');
    res.json({ artworks: [] });
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
      `SELECT id, title, image_url, storage_key, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, created_at
       FROM artworks 
       WHERE artist_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    // Transform to Studio-friendly format - gracefully handle empty results
    const rows = result.rows || [];
    const artworks = rows.map((row: any) => {
      // Normalize image_url to API endpoint format
      const imageUrl = row.image_url && row.image_url.startsWith('/objects/')
        ? `/api/artwork-image/${row.id}`
        : row.image_url;
      
      // Check if artwork needs re-upload (missing storage_key)
      const hasValidStorageKey = row.storage_key && row.storage_key.trim() !== '';
      const hasValidImageUrl = row.image_url && (row.image_url.startsWith('/objects/') || row.image_url.startsWith('http'));
      const requiresReupload = !hasValidStorageKey && !hasValidImageUrl;
      
      return {
        id: `db-${row.id}`,
        title: row.title,
        overlayImageUrl: imageUrl,
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
        availability: row.availability || 'available',
        requiresReupload
      };
    });
    
    console.log(`[/mine] Found ${artworks.length} artworks for user ${req.user.id}`);
    res.json({ artworks });
  } catch (error: any) {
    console.error('[/mine] Error fetching user artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// Admin/dev endpoint: List artworks with missing or invalid storage_key
router.get('/artworks/storage-audit', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    // Only admins can access this endpoint
    if (effectivePlan !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Find artworks with missing storage_key
    const missingStorageKey = await query(`
      SELECT id, title, artist_id, image_url, storage_key, created_at
      FROM artworks
      WHERE storage_key IS NULL OR storage_key = ''
      ORDER BY created_at DESC
    `);

    // Find artworks with corrupted/invalid image_url (legacy issues)
    const invalidImageUrl = await query(`
      SELECT id, title, artist_id, image_url, storage_key, created_at
      FROM artworks
      WHERE image_url LIKE '/api/artwork-image/%'
         OR (image_url IS NOT NULL AND image_url NOT LIKE '/objects/%' AND image_url NOT LIKE 'http%')
      ORDER BY created_at DESC
    `);

    // Find artworks with storage_key that might not exist in storage
    const withStorageKey = await query(`
      SELECT id, title, artist_id, image_url, storage_key, created_at
      FROM artworks
      WHERE storage_key IS NOT NULL AND storage_key != ''
      ORDER BY created_at DESC
    `);

    res.json({
      summary: {
        total_missing_storage_key: missingStorageKey.rows.length,
        total_invalid_image_url: invalidImageUrl.rows.length,
        total_with_storage_key: withStorageKey.rows.length
      },
      missing_storage_key: missingStorageKey.rows,
      invalid_image_url: invalidImageUrl.rows,
      with_storage_key: withStorageKey.rows
    });
  } catch (error: any) {
    console.error('[storage-audit] Error:', error);
    res.status(500).json({ error: 'Failed to audit storage keys' });
  }
});

router.get('/artworks/debug/:id', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (effectivePlan !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const artworkId = parseInt(req.params.id);
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    const dbHost = process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown';
    
    const result = await query(`
      SELECT a.*, u.email as artist_email, u.first_name, u.last_name
      FROM artworks a
      LEFT JOIN users u ON a.artist_id = u.id
      WHERE a.id = $1
    `, [artworkId]);

    if (result.rows.length === 0) {
      return res.json({
        found: false,
        artworkId,
        dbHost,
        message: 'Artwork not found in database'
      });
    }

    const artwork = result.rows[0];
    const expectedStorageKey = artwork.storage_key || null;
    const legacyStorageKey = artwork.image_url?.startsWith('/objects/') 
      ? artwork.image_url.replace('/objects/', '')
      : null;

    res.json({
      found: true,
      artworkId,
      dbHost,
      artwork: {
        id: artwork.id,
        title: artwork.title,
        artist_id: artwork.artist_id,
        artist_email: artwork.artist_email,
        storage_key: artwork.storage_key,
        image_url: artwork.image_url,
        created_at: artwork.created_at,
        updated_at: artwork.updated_at
      },
      storage_analysis: {
        has_storage_key: !!artwork.storage_key,
        expected_storage_key: expectedStorageKey,
        legacy_storage_key: legacyStorageKey,
        image_url_type: artwork.image_url?.startsWith('/objects/') ? 'object_storage'
          : artwork.image_url?.startsWith('http') ? 'external_url'
          : artwork.image_url?.startsWith('/api/') ? 'corrupted_api_path'
          : 'unknown',
        needs_reupload: !artwork.storage_key || artwork.storage_key.trim() === ''
      }
    });
  } catch (error: any) {
    console.error('[debug-artwork] Error:', error);
    res.status(500).json({ error: 'Failed to debug artwork', details: error.message });
  }
});

router.post('/artworks', authenticateToken, checkArtworkLimit, upload.single('image'), async (req: any, res) => {
  console.log('[UPLOAD] ========== POST /api/artist/artworks ==========');
  console.log('[UPLOAD] Content-Type:', req.headers['content-type']);
  console.log('[UPLOAD] Body keys:', Object.keys(req.body || {}));
  console.log('[UPLOAD] Body values:', JSON.stringify(req.body || {}, null, 2));
  console.log('[UPLOAD] File present:', !!req.file);
  if (req.file) {
    console.log('[UPLOAD] File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLen: req.file.buffer?.length || 0,
      bufferType: req.file.buffer?.constructor?.name || 'unknown',
      isBuffer: Buffer.isBuffer(req.file.buffer)
    });
    // Verify buffer integrity - check first few bytes for JPEG/PNG signature
    if (req.file.buffer && req.file.buffer.length > 4) {
      const header = req.file.buffer.slice(0, 4);
      console.log('[UPLOAD] File header bytes:', header.toString('hex'));
    }
  } else {
    console.log('[UPLOAD] NO FILE - req.file is undefined/null');
  }
  console.log('[UPLOAD] ==============================================');

  if (!req.file) {
    console.error('[UPLOAD] NO_FILE: Returning 400');
    return res.status(400).json({ error: 'NO_FILE: Image file is required', code: 'NO_FILE' });
  }
  
  // Validate buffer integrity
  if (!req.file.buffer || req.file.buffer.length < 100) {
    console.error('[UPLOAD] INVALID_BUFFER: Buffer too small or missing', { 
      hasBuffer: !!req.file.buffer, 
      length: req.file.buffer?.length 
    });
    return res.status(400).json({ 
      error: 'Image file appears to be corrupted or incomplete', 
      code: 'INVALID_BUFFER',
      receivedBytes: req.file.buffer?.length || 0
    });
  }

  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    console.log('[UPLOAD] User context:', {
      userId: req.user?.id,
      email: req.user?.email,
      effectivePlan,
      role: req.user?.role
    });

    const { title, width, height, dimensionUnit, priceAmount, priceCurrency, buyUrl, artistId, orientation, styleTags, dominantColors, medium, availability } = req.body;

    console.log('[UPLOAD] Artwork data:', { title, width, height, dimensionUnit, buyUrl, orientation, medium, availability });

    if (!title || !width || !height) {
      console.error('[UPLOAD] Missing required fields:', { title: !!title, width: !!width, height: !!height });
      return res.status(400).json({ error: 'Missing required fields: title, width, height' });
    }

    const targetArtistId = effectivePlan === 'admin' && artistId ? parseInt(artistId) : req.user.id;
    const currency = priceCurrency || 'EUR';
    const unit = dimensionUnit || 'cm';

    // Upload image to Object Storage
    console.log('[Upload] Uploading image to Object Storage...');
    const objectStorage = new ObjectStorageService();
    let imageUrl: string;
    let storageKey: string;
    
    try {
      imageUrl = await objectStorage.uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      // Extract storage_key from imageUrl (strip /objects/ prefix)
      storageKey = imageUrl.startsWith('/objects/') ? imageUrl.replace('/objects/', '') : imageUrl;
      console.log('[Upload] Image uploaded to Object Storage:', { imageUrl, storageKey });
    } catch (uploadError: any) {
      console.error('[Upload] Storage upload failed:', uploadError.message);
      return res.status(503).json({ 
        error: 'Image upload failed. Storage service unavailable.',
        details: process.env.APP_ENV === 'staging' ? uploadError.message : undefined
      });
    }

    // Generate AI tags from image (non-blocking, with fallback to empty array)
    let tags: string[] = [];
    try {
      console.log('[Upload] Generating AI tags for artwork...');
      tags = await generateTagsFromImage(req.file.buffer.toString('base64'), req.file.mimetype);
      console.log('[Upload] Generated tags:', tags);
    } catch (tagError: any) {
      console.warn('[Upload] AI tag generation failed, continuing without tags:', tagError.message);
      tags = [];
    }

    // Parse connect metadata
    const styleTagsJson = styleTags ? (typeof styleTags === 'string' ? styleTags : JSON.stringify(styleTags)) : '[]';
    const dominantColorsJson = dominantColors ? (typeof dominantColors === 'string' ? dominantColors : JSON.stringify(dominantColors)) : '[]';
    const artworkOrientation = orientation || null;
    const artworkMedium = medium || null;
    const artworkAvailability = availability || 'available';

    console.log('[Upload] Inserting artwork into database...');
    let result;
    try {
      result = await query(
        `INSERT INTO artworks (artist_id, title, image_url, storage_key, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, visible_to_designers, visible_to_galleries, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, FALSE, FALSE, CURRENT_TIMESTAMP)
         RETURNING id, artist_id, title, image_url, storage_key, width, height, dimension_unit, price_amount, price_currency, buy_url, tags, orientation, style_tags, dominant_colors, medium, availability, visible_to_designers, visible_to_galleries, created_at, updated_at`,
        [targetArtistId, title, imageUrl, storageKey, parseFloat(width), parseFloat(height), unit, priceAmount ? parseFloat(priceAmount) : null, currency, buyUrl, tags, artworkOrientation, styleTagsJson, dominantColorsJson, artworkMedium, artworkAvailability]
      );
    } catch (dbError: any) {
      console.error('[Upload] DB insert failed, cleaning up storage:', dbError.message);
      // Cleanup orphaned storage file
      try {
        await objectStorage.deleteObject(storageKey);
        console.log('[Upload] Orphaned storage file cleaned up:', storageKey);
      } catch (cleanupError: any) {
        console.warn('[Upload] Failed to cleanup orphaned storage file:', cleanupError.message);
      }
      
      let errorMessage = 'Failed to save artwork';
      if (dbError.code === '23505') {
        errorMessage = 'Duplicate artwork detected.';
      } else if (dbError.code?.startsWith('23')) {
        errorMessage = 'Database constraint error. Please check your input.';
      }
      
      return res.status(500).json({ 
        error: errorMessage, 
        details: process.env.APP_ENV === 'staging' ? dbError.message : undefined,
        code: dbError.code 
      });
    }

    const artworkId = result.rows[0].id;
    // Return the API endpoint URL for frontend compatibility (actual path is stored in DB)
    result.rows[0].image_url = `/api/artwork-image/${artworkId}`;
    console.log('[Upload] Artwork created successfully:', artworkId);
    res.status(201).json({ artwork: result.rows[0], message: 'Artwork created successfully' });
  } catch (error: any) {
    console.error('[Upload] Unexpected error:', error);
    console.error('[Upload] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to create artwork', 
      details: process.env.APP_ENV === 'staging' ? error.message : undefined,
      code: error.code 
    });
  }
});

router.put('/artworks/:id', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    const artworkId = parseInt(req.params.id);
    const { title, width, height, dimensionUnit, priceAmount, priceCurrency, buyUrl, orientation, styleTags, dominantColors, medium, availability, visibleToDesigners, visibleToGalleries, variants } = req.body;

    let existingArtwork;
    if (effectivePlan === 'admin') {
      existingArtwork = await query('SELECT * FROM artworks WHERE id = $1', [artworkId]);
    } else {
      existingArtwork = await query('SELECT * FROM artworks WHERE id = $1 AND artist_id = $2', [artworkId, req.user.id]);
    }

    if (existingArtwork.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or you can only edit your own artworks' });
    }

    let imageUrl = existingArtwork.rows[0].image_url;
    let storageKey = existingArtwork.rows[0].storage_key;
    
    // Check if existing image_url is corrupted (contains API path instead of object path)
    const isCorrupted = imageUrl && imageUrl.startsWith('/api/artwork-image/');
    if (isCorrupted) {
      console.warn(`[Update] Artwork ${artworkId} has corrupted image_url: ${imageUrl}`);
    }
    
    if (req.file) {
      // Upload new image to Object Storage
      console.log('[Update] Uploading new image to Object Storage...');
      const objectStorage = new ObjectStorageService();
      imageUrl = await objectStorage.uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      // Extract storage_key from imageUrl
      storageKey = imageUrl.startsWith('/objects/') ? imageUrl.replace('/objects/', '') : imageUrl;
      console.log('[Update] New image uploaded:', { imageUrl, storageKey });
    } else if (isCorrupted) {
      // If no new file and existing is corrupted, keep it but warn
      console.warn(`[Update] No new image provided for artwork ${artworkId} with corrupted image. Image will remain broken.`);
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
    const artworkVisibleToDesigners = visibleToDesigners !== undefined ? (visibleToDesigners === true || visibleToDesigners === 'true') : existingArtwork.rows[0].visible_to_designers;
    const artworkVisibleToGalleries = visibleToGalleries !== undefined ? (visibleToGalleries === true || visibleToGalleries === 'true') : existingArtwork.rows[0].visible_to_galleries;
    
    // Parse variants (additional sizes/prints/editions)
    let artworkVariants = existingArtwork.rows[0].variants || [];
    if (variants !== undefined) {
      try {
        artworkVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        // Filter out empty variants
        if (Array.isArray(artworkVariants)) {
          artworkVariants = artworkVariants.filter((v: any) => v.width && v.height);
        }
      } catch (e) {
        console.warn('[Update] Failed to parse variants:', e);
        artworkVariants = [];
      }
    }
    const variantsJson = JSON.stringify(artworkVariants);

    const result = await query(
      `UPDATE artworks 
       SET title = $1, image_url = $2, storage_key = $3, width = $4, height = $5, dimension_unit = $6, price_amount = $7, price_currency = $8, buy_url = $9, orientation = $10, style_tags = $11, dominant_colors = $12, medium = $13, availability = $14, visible_to_designers = $15, visible_to_galleries = $16, variants = $17, updated_at = CURRENT_TIMESTAMP
       WHERE id = $18
       RETURNING id, artist_id, title, image_url, storage_key, width, height, dimension_unit, price_amount, price_currency, buy_url, orientation, style_tags, dominant_colors, medium, availability, visible_to_designers, visible_to_galleries, variants, created_at, updated_at`,
      [title, imageUrl, storageKey, parseFloat(width), parseFloat(height), unit, priceAmount ? parseFloat(priceAmount) : null, currency, buyUrl, artworkOrientation, styleTagsJson, dominantColorsJson, artworkMedium, artworkAvailability, artworkVisibleToDesigners, artworkVisibleToGalleries, variantsJson, artworkId]
    );

    // Return the API endpoint URL for frontend compatibility (actual path is stored in DB)
    result.rows[0].image_url = `/api/artwork-image/${artworkId}`;
    res.json({ artwork: result.rows[0], message: 'Artwork updated successfully' });
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

router.patch('/artworks/:id/visibility', authenticateToken, async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    const { visibleToDesigners, visibleToGalleries } = req.body;

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    const existingArtwork = await query(
      'SELECT id, visible_to_designers, visible_to_galleries FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, req.user.id]
    );

    if (existingArtwork.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or access denied' });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (visibleToDesigners !== undefined) {
      paramCount++;
      updates.push(`visible_to_designers = $${paramCount}`);
      params.push(visibleToDesigners === true || visibleToDesigners === 'true');
    }

    if (visibleToGalleries !== undefined) {
      paramCount++;
      updates.push(`visible_to_galleries = $${paramCount}`);
      params.push(visibleToGalleries === true || visibleToGalleries === 'true');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No visibility fields provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    params.push(artworkId);

    const result = await query(
      `UPDATE artworks SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, visible_to_designers, visible_to_galleries`,
      params
    );

    res.json({ 
      artwork: result.rows[0], 
      message: 'Visibility updated successfully' 
    });
  } catch (error) {
    console.error('Error updating artwork visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

router.get('/artworks/:id/images', authenticateToken, async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    // Verify ownership
    const artworkResult = await query(
      'SELECT id, image_url, storage_key FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, userId]
    );

    if (artworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const artwork = artworkResult.rows[0];

    // Fetch gallery images
    const imagesResult = await query(
      `SELECT id, storage_key, display_order, is_mockup, created_at
       FROM artwork_gallery_images
       WHERE artwork_id = $1
       ORDER BY display_order ASC`,
      [artworkId]
    );

    // Build images array with cover image first
    const images: Array<{ id: number; image_url: string; display_order: number; is_mockup: boolean; is_cover: boolean }> = [];
    
    // Add cover image (from main artworks table)
    if (artwork.storage_key || artwork.image_url) {
      images.push({
        id: 0,
        image_url: `/api/artwork-image/${artworkId}`,
        display_order: 0,
        is_mockup: false,
        is_cover: true
      });
    }

    // Add gallery images
    imagesResult.rows.forEach((img: any, index: number) => {
      images.push({
        id: img.id,
        image_url: `/api/artwork-gallery-image/${img.id}`,
        display_order: img.display_order,
        is_mockup: img.is_mockup,
        is_cover: false
      });
    });

    res.json({ images });
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images', details: error.message });
  }
});

// Upload a new gallery image for an artwork
router.post('/artworks/:id/images', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    const userId = req.user.id;
    const isMockup = req.body.is_mockup === 'true';

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    // Verify ownership
    const artworkResult = await query(
      'SELECT id FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, userId]
    );

    if (artworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check current count (max 5 total: 1 cover + 4 gallery = 5 slots)
    const countResult = await query(
      'SELECT COUNT(*) as count FROM artwork_gallery_images WHERE artwork_id = $1',
      [artworkId]
    );
    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= 4) {
      return res.status(400).json({ error: 'Maximum 5 images per artwork (1 cover + 4 additional)' });
    }

    // Get next display order
    const orderResult = await query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM artwork_gallery_images WHERE artwork_id = $1',
      [artworkId]
    );
    const nextOrder = orderResult.rows[0].next_order;

    // Upload to storage
    const { ObjectStorageService } = await import('../objectStorage.js');
    const objectStorage = new ObjectStorageService();
    const storageKey = await objectStorage.uploadBuffer(
      req.file.buffer,
      `gallery-${artworkId}-${Date.now()}.${req.file.originalname.split('.').pop()}`,
      req.file.mimetype
    );

    // Insert into database
    const insertResult = await query(
      `INSERT INTO artwork_gallery_images (artwork_id, storage_key, display_order, is_mockup)
       VALUES ($1, $2, $3, $4)
       RETURNING id, storage_key, display_order, is_mockup, created_at`,
      [artworkId, storageKey, nextOrder, isMockup]
    );

    const newImage = insertResult.rows[0];
    res.status(201).json({
      image: {
        id: newImage.id,
        image_url: `/api/artwork-gallery-image/${newImage.id}`,
        display_order: newImage.display_order,
        is_mockup: newImage.is_mockup,
        is_cover: false
      }
    });
  } catch (error: any) {
    console.error('Error uploading gallery image:', error);
    res.status(500).json({ error: 'Failed to upload gallery image', details: error.message });
  }
});

// Reorder gallery images
router.put('/artworks/:id/images/reorder', authenticateToken, async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    const userId = req.user.id;
    const { imageOrder } = req.body; // Array of image IDs in new order

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    if (!Array.isArray(imageOrder)) {
      return res.status(400).json({ error: 'imageOrder must be an array' });
    }

    // Verify ownership
    const artworkResult = await query(
      'SELECT id FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, userId]
    );

    if (artworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Update display_order for each image
    for (let i = 0; i < imageOrder.length; i++) {
      const imageId = imageOrder[i];
      await query(
        'UPDATE artwork_gallery_images SET display_order = $1 WHERE id = $2 AND artwork_id = $3',
        [i + 1, imageId, artworkId]
      );
    }

    res.json({ message: 'Gallery images reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering gallery images:', error);
    res.status(500).json({ error: 'Failed to reorder gallery images', details: error.message });
  }
});

// Delete a specific gallery image
router.delete('/artworks/:artworkId/images/:imageId', authenticateToken, async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.artworkId);
    const imageId = parseInt(req.params.imageId);
    const userId = req.user.id;

    if (isNaN(artworkId) || isNaN(imageId)) {
      return res.status(400).json({ error: 'Invalid artwork or image ID' });
    }

    // Verify ownership via artwork
    const artworkResult = await query(
      'SELECT id FROM artworks WHERE id = $1 AND artist_id = $2',
      [artworkId, userId]
    );

    if (artworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Get storage key before deletion
    const imageResult = await query(
      'SELECT storage_key FROM artwork_gallery_images WHERE id = $1 AND artwork_id = $2',
      [imageId, artworkId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }

    const storageKey = imageResult.rows[0].storage_key;

    // Delete from database
    await query('DELETE FROM artwork_gallery_images WHERE id = $1', [imageId]);

    // Try to delete from storage (non-blocking)
    try {
      const { ObjectStorageService } = await import('../objectStorage.js');
      const objectStorage = new ObjectStorageService();
      await objectStorage.deleteObject(storageKey);
    } catch (storageErr) {
      console.error('Error deleting gallery image from storage:', storageErr);
    }

    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: 'Failed to delete gallery image', details: error.message });
  }
});

router.delete('/artworks/:id', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    const artworkId = parseInt(req.params.id);

    // First, delete any exhibition artwork entries that reference this artwork
    // This ensures no "No image" placeholders remain in exhibitions
    await query('DELETE FROM artist_exhibition_artworks WHERE source_artwork_id = $1', [artworkId]);

    let result;
    if (effectivePlan === 'admin') {
      result = await query('DELETE FROM artworks WHERE id = $1 RETURNING id', [artworkId]);
    } else {
      result = await query('DELETE FROM artworks WHERE id = $1 AND artist_id = $2 RETURNING id', [artworkId, req.user.id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or you can only delete your own artworks' });
    }

    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

export default router;
