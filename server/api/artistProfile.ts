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
        website_url, instagram_url, languages,
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

    const styleTagsJson = Array.isArray(primaryStyleTags) ? JSON.stringify(primaryStyleTags) : '[]';
    const languagesJson = Array.isArray(languages) ? JSON.stringify(languages) : '[]';

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
        languages = $9,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, display_name, location_city, location_country, bio,
                 primary_style_tags, primary_medium, website_url, instagram_url, languages`,
      [
        displayName || null,
        locationCity || null,
        locationCountry || null,
        bio || null,
        styleTagsJson,
        primaryMedium || null,
        websiteUrlClean,
        instagramUrlClean,
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

    if (!req.user.artist_access) {
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

export default router;
