import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectStorageService } from '../objectStorage.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT 
        id, email, role,
        display_name, location_city, location_country, bio,
        primary_style_tags, primary_medium, profile_image_url,
        website_url, instagram_url, facebook_url, tiktok_url, 
        linkedin_url, pinterest_url, etsy_url, slug, languages,
        visible_to_designers, visible_to_galleries,
        artist_access, designer_access, gallery_access
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    const profile = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name || '',
      locationCity: user.location_city || '',
      locationCountry: user.location_country || '',
      bio: user.bio || '',
      primaryStyleTags: user.primary_style_tags || [],
      primaryMedium: user.primary_medium || '',
      profileImageUrl: user.profile_image_url || '',
      websiteUrl: user.website_url || '',
      instagramUrl: user.instagram_url || '',
      facebookUrl: user.facebook_url || '',
      tiktokUrl: user.tiktok_url || '',
      linkedinUrl: user.linkedin_url || '',
      pinterestUrl: user.pinterest_url || '',
      etsyUrl: user.etsy_url || '',
      slug: user.slug || '',
      languages: user.languages || [],
      visibleToDesigners: user.visible_to_designers || false,
      visibleToGalleries: user.visible_to_galleries || false,
      artistAccess: user.artist_access || false,
      designerAccess: user.designer_access || false,
      galleryAccess: user.gallery_access || false
    };

    res.json({ profile });
  } catch (error: any) {
    console.error('Error fetching artist profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const {
      displayName,
      locationCity,
      locationCountry,
      bio,
      primaryStyleTags,
      primaryMedium,
      websiteUrl,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      linkedinUrl,
      pinterestUrl,
      etsyUrl,
      languages
    } = req.body;

    let websiteUrlClean = websiteUrl || null;
    if (websiteUrlClean && !websiteUrlClean.startsWith('http://') && !websiteUrlClean.startsWith('https://')) {
      websiteUrlClean = 'https://' + websiteUrlClean;
    }

    let instagramUrlClean = instagramUrl || null;
    if (instagramUrlClean) {
      if (instagramUrlClean.startsWith('@')) {
        instagramUrlClean = 'https://instagram.com/' + instagramUrlClean.slice(1);
      } else if (!instagramUrlClean.startsWith('http')) {
        instagramUrlClean = 'https://instagram.com/' + instagramUrlClean;
      }
    }

    let facebookUrlClean = facebookUrl || null;
    if (facebookUrlClean && !facebookUrlClean.startsWith('http://') && !facebookUrlClean.startsWith('https://')) {
      facebookUrlClean = 'https://' + facebookUrlClean;
    }

    let tiktokUrlClean = tiktokUrl || null;
    if (tiktokUrlClean) {
      if (tiktokUrlClean.startsWith('@')) {
        tiktokUrlClean = 'https://tiktok.com/@' + tiktokUrlClean.slice(1);
      } else if (!tiktokUrlClean.startsWith('http')) {
        tiktokUrlClean = 'https://tiktok.com/@' + tiktokUrlClean;
      }
    }

    let linkedinUrlClean = linkedinUrl || null;
    if (linkedinUrlClean && !linkedinUrlClean.startsWith('http://') && !linkedinUrlClean.startsWith('https://')) {
      linkedinUrlClean = 'https://' + linkedinUrlClean;
    }

    let pinterestUrlClean = pinterestUrl || null;
    if (pinterestUrlClean && !pinterestUrlClean.startsWith('http://') && !pinterestUrlClean.startsWith('https://')) {
      pinterestUrlClean = 'https://pinterest.com/' + pinterestUrlClean;
    }

    let etsyUrlClean = etsyUrl || null;
    if (etsyUrlClean && !etsyUrlClean.startsWith('http://') && !etsyUrlClean.startsWith('https://')) {
      etsyUrlClean = 'https://etsy.com/shop/' + etsyUrlClean;
    }

    const styleTagsJson = Array.isArray(primaryStyleTags) ? JSON.stringify(primaryStyleTags) : '[]';
    const languagesJson = Array.isArray(languages) ? JSON.stringify(languages) : '[]';

    let slug: string | null = null;
    if (displayName) {
      const baseSlug = generateSlug(displayName);
      const existingSlug = await query(
        `SELECT slug FROM users WHERE id = $1`,
        [req.user.id]
      );
      
      if (!existingSlug.rows[0]?.slug) {
        let candidateSlug = baseSlug;
        let counter = 1;
        while (true) {
          const check = await query(
            `SELECT id FROM users WHERE slug = $1 AND id != $2`,
            [candidateSlug, req.user.id]
          );
          if (check.rows.length === 0) {
            slug = candidateSlug;
            break;
          }
          candidateSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      } else {
        slug = existingSlug.rows[0].slug;
      }
    }

    const result = await query(
      `UPDATE users SET
        display_name = $1,
        location_city = $2,
        location_country = $3,
        bio = $4,
        primary_style_tags = $5,
        primary_medium = $6,
        website_url = $7,
        instagram_url = $8,
        facebook_url = $9,
        tiktok_url = $10,
        linkedin_url = $11,
        pinterest_url = $12,
        etsy_url = $13,
        slug = COALESCE($14, slug),
        languages = $15,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING id, display_name, location_city, location_country, bio,
                 primary_style_tags, primary_medium, website_url, instagram_url, 
                 facebook_url, tiktok_url, linkedin_url, pinterest_url, etsy_url, slug, languages`,
      [
        displayName || null,
        locationCity || null,
        locationCountry || null,
        bio || null,
        styleTagsJson,
        primaryMedium || null,
        websiteUrlClean,
        instagramUrlClean,
        facebookUrlClean,
        tiktokUrlClean,
        linkedinUrlClean,
        pinterestUrlClean,
        etsyUrlClean,
        slug,
        languagesJson,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating artist profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/profile/visibility', authenticateToken, async (req: any, res) => {
  try {
    const { visibleToDesigners, visibleToGalleries } = req.body;

    // Use entitlements as single source of truth (admin always has access)
    const hasArtistAccess = req.user.is_admin || req.user.entitlements?.artist_access;
    
    if (!hasArtistAccess) {
      return res.status(403).json({ 
        error: 'Artist access required',
        message: 'You need an Artist subscription to enable visibility in Artist Connect.'
      });
    }

    const result = await query(
      `UPDATE users SET
        visible_to_designers = $1,
        visible_to_galleries = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, visible_to_designers, visible_to_galleries`,
      [
        visibleToDesigners === true,
        visibleToGalleries === true,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Visibility settings updated successfully',
      visibility: {
        visibleToDesigners: result.rows[0].visible_to_designers,
        visibleToGalleries: result.rows[0].visible_to_galleries
      }
    });
  } catch (error: any) {
    console.error('Error updating visibility settings:', error);
    res.status(500).json({ error: 'Failed to update visibility settings' });
  }
});

router.post('/profile/image', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const imageUrl = `/api/artist/profile-image/${req.user.id}`;

    await query(
      `UPDATE users SET
        profile_image_url = $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [imageUrl, req.user.id]
    );

    await query(
      `INSERT INTO user_profile_images (user_id, image_data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET image_data = $2, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, imageData]
    ).catch(async () => {
      await query(
        `CREATE TABLE IF NOT EXISTS user_profile_images (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          image_data TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await query(
        `INSERT INTO user_profile_images (user_id, image_data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET image_data = $2, updated_at = CURRENT_TIMESTAMP`,
        [req.user.id, imageData]
      );
    });

    res.json({ 
      message: 'Profile image uploaded successfully',
      profileImageUrl: imageUrl
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

router.get('/profile-image/:userId', async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const result = await query(
      `SELECT image_data FROM user_profile_images WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).json({ error: 'Profile image not found' });
    }

    const imageData = result.rows[0].image_data;
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(500).json({ error: 'Invalid image data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({ error: 'Failed to fetch profile image' });
  }
});

router.get('/profile/connect-stats', authenticateToken, async (req: any, res) => {
  try {
    const artworkCount = await query(
      `SELECT COUNT(*) as count FROM artworks WHERE artist_id = $1`,
      [req.user.id]
    );

    const messageCount = await query(
      `SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    const visibilityResult = await query(
      `SELECT visible_to_designers, visible_to_galleries FROM users WHERE id = $1`,
      [req.user.id]
    );

    const visibility = visibilityResult.rows[0] || { visible_to_designers: false, visible_to_galleries: false };

    res.json({
      stats: {
        totalArtworks: parseInt(artworkCount.rows[0].count),
        unreadMessages: parseInt(messageCount.rows[0].count),
        visibleToDesigners: visibility.visible_to_designers,
        visibleToGalleries: visibility.visible_to_galleries
      }
    });
  } catch (error: any) {
    console.error('Error fetching connect stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/exhibition', authenticateToken, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.title, c.subtitle, c.status, c.created_at, c.cover_image_url,
        (SELECT COUNT(*) FROM gallery_artworks WHERE collection_id = c.id) as artwork_count
       FROM gallery_collections c
       WHERE c.gallery_id = $1
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [req.user.id]
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
        status: exhibition.status,
        artworkCount: parseInt(exhibition.artwork_count),
        createdAt: exhibition.created_at,
        coverImageUrl: exhibition.cover_image_url
      }
    });
  } catch (error: any) {
    console.error('Error fetching artist exhibition:', error);
    res.status(500).json({ error: 'Failed to fetch exhibition' });
  }
});

router.post('/exhibition', authenticateToken, async (req: any, res) => {
  try {
    const existingResult = await query(
      `SELECT COUNT(*) as count FROM gallery_collections WHERE gallery_id = $1`,
      [req.user.id]
    );

    if (parseInt(existingResult.rows[0].count) >= 1) {
      return res.status(403).json({ 
        error: 'Exhibition limit reached',
        message: 'Artists can have 1 active exhibition. Delete the existing one to create a new one.'
      });
    }

    const { title, subtitle } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Exhibition title is required' });
    }

    const result = await query(
      `INSERT INTO gallery_collections (gallery_id, title, subtitle, status, owner_type, updated_at)
       VALUES ($1, $2, $3, 'draft', 'artist', CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, title, subtitle || null]
    );

    res.status(201).json({ 
      exhibition: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        subtitle: result.rows[0].subtitle,
        status: result.rows[0].status,
        artworkCount: 0,
        createdAt: result.rows[0].created_at
      },
      message: 'Exhibition created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating artist exhibition:', error);
    res.status(500).json({ error: 'Failed to create exhibition' });
  }
});

router.delete('/exhibition/:id', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    await query('DELETE FROM gallery_artworks WHERE collection_id = $1', [exhibitionId]);
    await query('DELETE FROM gallery_collections WHERE id = $1', [exhibitionId]);

    res.json({ message: 'Exhibition deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting artist exhibition:', error);
    res.status(500).json({ error: 'Failed to delete exhibition' });
  }
});

// Update artist exhibition (title, subtitle)
router.put('/exhibition/:id', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);
    const { title, subtitle } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Exhibition title is required' });
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      `UPDATE gallery_collections 
       SET title = $1, subtitle = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [title.trim(), subtitle?.trim() || null, exhibitionId]
    );

    // Get artwork count
    const artworkCountResult = await query(
      'SELECT COUNT(*) as count FROM gallery_artworks WHERE collection_id = $1',
      [exhibitionId]
    );

    res.json({ 
      exhibition: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        subtitle: result.rows[0].subtitle,
        status: result.rows[0].status,
        artworkCount: parseInt(artworkCountResult.rows[0].count),
        createdAt: result.rows[0].created_at,
        coverImageUrl: result.rows[0].cover_image_url
      },
      message: 'Exhibition updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating artist exhibition:', error);
    res.status(500).json({ error: 'Failed to update exhibition' });
  }
});

router.post('/exhibition/:id/cover-image', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Cover image is required' });
    }

    const objectStorage = new ObjectStorageService();
    const imageUrl = await objectStorage.uploadBuffer(
      req.file.buffer,
      `exhibition-cover-${exhibitionId}-${Date.now()}.${req.file.mimetype.split('/')[1] || 'jpg'}`,
      req.file.mimetype
    );

    await query(
      'UPDATE gallery_collections SET cover_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [imageUrl, exhibitionId]
    );

    res.json({ 
      coverImageUrl: imageUrl,
      message: 'Cover image uploaded successfully' 
    });
  } catch (error: any) {
    console.error('Error uploading exhibition cover image:', error);
    res.status(500).json({ error: 'Failed to upload cover image' });
  }
});

router.get('/exhibition/:id/artworks', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      `SELECT id, collection_id, title, artist_name, image_url, 
              width_value, height_value, dimension_unit,
              price_amount, price_currency, buy_url, description, created_at, source_artwork_id
       FROM gallery_artworks
       WHERE collection_id = $1
       ORDER BY created_at DESC`,
      [exhibitionId]
    );

    const artworks = result.rows.map(row => ({
      id: row.id,
      collectionId: row.collection_id,
      title: row.title,
      artistName: row.artist_name,
      imageUrl: row.image_url,
      widthValue: row.width_value,
      heightValue: row.height_value,
      dimensionUnit: row.dimension_unit || 'cm',
      priceAmount: row.price_amount,
      priceCurrency: row.price_currency,
      buyUrl: row.buy_url,
      description: row.description,
      createdAt: row.created_at,
      sourceArtworkId: row.source_artwork_id
    }));

    res.json({ artworks });
  } catch (error: any) {
    console.error('Error fetching exhibition artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

router.post('/exhibition/:id/artworks', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Artwork image is required' });
    }

    const { title, widthValue, heightValue, dimensionUnit } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Artwork title is required' });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const imageUrl = `/api/gallery-artwork-image/PLACEHOLDER`;
    
    const validUnits = ['cm', 'in'];
    const unit = dimensionUnit && validUnits.includes(dimensionUnit) ? dimensionUnit : 'cm';

    const userResult = await query('SELECT display_name, email FROM users WHERE id = $1', [req.user.id]);
    const artistName = userResult.rows[0]?.display_name || userResult.rows[0]?.email || 'Artist';

    const result = await query(
      `INSERT INTO gallery_artworks 
       (collection_id, title, artist_name, image_url, image_data, width_value, height_value, dimension_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [exhibitionId, title, artistName, imageUrl, base64Image, 
       parseFloat(widthValue) || 50, parseFloat(heightValue) || 50, unit]
    );

    const artworkId = result.rows[0].id;
    await query(
      `UPDATE gallery_artworks SET image_url = $1 WHERE id = $2`,
      [`/api/gallery-artwork-image/${artworkId}`, artworkId]
    );

    res.status(201).json({ 
      artwork: {
        id: artworkId,
        title: result.rows[0].title,
        artistName: result.rows[0].artist_name,
        imageUrl: `/api/gallery-artwork-image/${artworkId}`,
        widthValue: result.rows[0].width_value,
        heightValue: result.rows[0].height_value,
        dimensionUnit: result.rows[0].dimension_unit
      },
      message: 'Artwork added to exhibition' 
    });
  } catch (error: any) {
    console.error('Error adding exhibition artwork:', error);
    res.status(500).json({ error: 'Failed to add artwork' });
  }
});

router.post('/exhibition/:id/artworks/link/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);
    const sourceArtworkId = parseInt(req.params.artworkId);
    const isAdmin = req.user.is_admin === true;

    // Check exhibition ownership (admins can access any exhibition)
    const exhibitionQuery = isAdmin 
      ? 'SELECT * FROM gallery_collections WHERE id = $1'
      : 'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2';
    const exhibitionParams = isAdmin ? [exhibitionId] : [exhibitionId, req.user.id];
    
    const checkResult = await query(exhibitionQuery, exhibitionParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const exhibitionOwnerId = checkResult.rows[0].gallery_id;

    // Check artwork ownership (must belong to exhibition owner)
    const artworkResult = await query(
      'SELECT * FROM artworks WHERE id = $1 AND artist_id = $2',
      [sourceArtworkId, exhibitionOwnerId]
    );

    if (artworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const existingLink = await query(
      'SELECT * FROM gallery_artworks WHERE collection_id = $1 AND source_artwork_id = $2',
      [exhibitionId, sourceArtworkId]
    );

    if (existingLink.rows.length > 0) {
      return res.status(400).json({ error: 'Artwork already in exhibition' });
    }

    const artwork = artworkResult.rows[0];
    const userResult = await query('SELECT display_name, email FROM users WHERE id = $1', [exhibitionOwnerId]);
    const artistName = userResult.rows[0]?.display_name || userResult.rows[0]?.email || 'Artist';

    const result = await query(
      `INSERT INTO gallery_artworks 
       (collection_id, title, artist_name, image_url, width_value, height_value, dimension_unit, 
        price_amount, price_currency, buy_url, description, source_artwork_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [exhibitionId, artwork.title, artistName, `/api/artwork-image/${sourceArtworkId}`,
       artwork.width_value || 50, artwork.height_value || 50, artwork.dimension_unit || 'cm',
       artwork.price_amount || null, artwork.price_currency || 'EUR', artwork.buy_url || null, 
       artwork.description || null, sourceArtworkId]
    );

    res.status(201).json({ 
      artwork: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        artistName: result.rows[0].artist_name,
        imageUrl: result.rows[0].image_url,
        widthValue: result.rows[0].width_value,
        heightValue: result.rows[0].height_value,
        dimensionUnit: result.rows[0].dimension_unit,
        sourceArtworkId: result.rows[0].source_artwork_id
      },
      message: 'Artwork added to exhibition' 
    });
  } catch (error: any) {
    console.error('Error linking artwork to exhibition:', error);
    res.status(500).json({ error: 'Failed to add artwork to exhibition' });
  }
});

router.delete('/exhibition/:id/artworks/unlink/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);
    const sourceArtworkId = parseInt(req.params.artworkId);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const result = await query(
      'DELETE FROM gallery_artworks WHERE collection_id = $1 AND source_artwork_id = $2 RETURNING *',
      [exhibitionId, sourceArtworkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not in exhibition' });
    }

    res.json({ message: 'Artwork removed from exhibition' });
  } catch (error: any) {
    console.error('Error unlinking artwork from exhibition:', error);
    res.status(500).json({ error: 'Failed to remove artwork from exhibition' });
  }
});

router.delete('/exhibition/:id/artworks/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const exhibitionId = parseInt(req.params.id);
    const artworkId = parseInt(req.params.artworkId);

    const checkResult = await query(
      'SELECT * FROM gallery_collections WHERE id = $1 AND gallery_id = $2',
      [exhibitionId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const artworkCheck = await query(
      'SELECT * FROM gallery_artworks WHERE id = $1 AND collection_id = $2',
      [artworkId, exhibitionId]
    );

    if (artworkCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    await query('DELETE FROM gallery_artworks WHERE id = $1', [artworkId]);

    res.json({ message: 'Artwork deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting exhibition artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

export default router;
