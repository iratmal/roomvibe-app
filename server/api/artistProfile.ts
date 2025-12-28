import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

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
        website_url, instagram_url, facebook_url, tiktok_url, slug, languages,
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
        slug = COALESCE($11, slug),
        languages = $12,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING id, display_name, location_city, location_country, bio,
                 primary_style_tags, primary_medium, website_url, instagram_url, facebook_url, tiktok_url, slug, languages`,
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
      `SELECT c.id, c.title, c.subtitle, c.status, c.created_at,
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
        createdAt: exhibition.created_at
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
      `INSERT INTO gallery_collections (gallery_id, title, subtitle, status, updated_at)
       VALUES ($1, $2, $3, 'draft', CURRENT_TIMESTAMP)
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

export default router;
