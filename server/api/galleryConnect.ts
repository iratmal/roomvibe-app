import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getEffectivePlan } from '../middleware/subscription.js';

const router = express.Router();

router.get('/artist-directory', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ 
        error: 'Subscription required',
        message: 'Access to the Artist Directory requires a Gallery subscription.',
        upgrade_url: '/pricing'
      });
    }

    const { style, medium, availability, minWidth, maxWidth, minHeight, maxHeight, country, city } = req.query;

    let queryText = `
      SELECT 
        u.id, u.email, u.display_name, u.bio, 
        u.location_city, u.location_country,
        u.primary_medium, u.profile_image_url,
        u.website_url, u.instagram_url,
        COUNT(a.id) as artwork_count,
        ARRAY_AGG(DISTINCT jsonb_array_elements_text(a.style_tags)) FILTER (WHERE a.style_tags IS NOT NULL) as all_styles
      FROM users u
      LEFT JOIN artworks a ON a.artist_id = u.id
      WHERE u.visible_to_galleries = TRUE
        AND u.artist_access = TRUE
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (style) {
      paramCount++;
      queryText += ` AND EXISTS (
        SELECT 1 FROM artworks aw 
        WHERE aw.artist_id = u.id 
        AND aw.style_tags @> $${paramCount}::jsonb
      )`;
      params.push(JSON.stringify([style]));
    }

    if (medium) {
      paramCount++;
      queryText += ` AND EXISTS (
        SELECT 1 FROM artworks aw 
        WHERE aw.artist_id = u.id 
        AND aw.medium = $${paramCount}
      )`;
      params.push(medium);
    }

    if (availability) {
      paramCount++;
      queryText += ` AND EXISTS (
        SELECT 1 FROM artworks aw 
        WHERE aw.artist_id = u.id 
        AND aw.availability = $${paramCount}
      )`;
      params.push(availability);
    }

    if (minWidth || maxWidth || minHeight || maxHeight) {
      const sizeConditions: string[] = [];
      if (minWidth) {
        paramCount++;
        sizeConditions.push(`aw.width >= $${paramCount}`);
        params.push(parseFloat(minWidth as string));
      }
      if (maxWidth) {
        paramCount++;
        sizeConditions.push(`aw.width <= $${paramCount}`);
        params.push(parseFloat(maxWidth as string));
      }
      if (minHeight) {
        paramCount++;
        sizeConditions.push(`aw.height >= $${paramCount}`);
        params.push(parseFloat(minHeight as string));
      }
      if (maxHeight) {
        paramCount++;
        sizeConditions.push(`aw.height <= $${paramCount}`);
        params.push(parseFloat(maxHeight as string));
      }
      if (sizeConditions.length > 0) {
        queryText += ` AND EXISTS (
          SELECT 1 FROM artworks aw 
          WHERE aw.artist_id = u.id 
          AND ${sizeConditions.join(' AND ')}
        )`;
      }
    }

    if (country) {
      paramCount++;
      queryText += ` AND u.location_country ILIKE $${paramCount}`;
      params.push(`%${country}%`);
    }

    if (city) {
      paramCount++;
      queryText += ` AND u.location_city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    queryText += `
      GROUP BY u.id, u.email, u.display_name, u.bio, 
               u.location_city, u.location_country, u.primary_medium,
               u.profile_image_url, u.website_url, u.instagram_url
      HAVING COUNT(a.id) > 0
      ORDER BY u.display_name ASC NULLS LAST, u.email ASC
    `;

    const result = await query(queryText, params);

    const artists = result.rows.map((row: any) => ({
      id: row.id,
      name: row.display_name || row.email,
      email: row.email,
      bio: row.bio,
      city: row.location_city,
      country: row.location_country,
      primaryMedium: row.primary_medium,
      profileImageUrl: row.profile_image_url,
      websiteUrl: row.website_url,
      instagramUrl: row.instagram_url,
      artworkCount: parseInt(row.artwork_count) || 0,
      styleTags: (row.all_styles || []).filter(Boolean).slice(0, 5)
    }));

    res.json({ artists, total: artists.length });
  } catch (error: any) {
    console.error('Error fetching artist directory:', error);
    res.status(500).json({ error: 'Failed to fetch artist directory' });
  }
});

router.get('/artist-directory/:artistId', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const artistId = parseInt(req.params.artistId);

    const artistResult = await query(`
      SELECT 
        u.id, u.email, u.display_name, u.bio,
        u.location_city, u.location_country,
        u.primary_medium, u.profile_image_url,
        u.website_url, u.instagram_url, u.visible_to_galleries
      FROM users u
      WHERE u.id = $1 
        AND u.visible_to_galleries = TRUE 
        AND u.artist_access = TRUE
    `, [artistId]);

    if (artistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found or not available' });
    }

    const artist = artistResult.rows[0];

    const artworksResult = await query(`
      SELECT 
        id, title, image_url, width, height, dimension_unit,
        orientation, style_tags, dominant_colors, medium, availability
      FROM artworks
      WHERE artist_id = $1
      ORDER BY created_at DESC
    `, [artistId]);

    const artworks = artworksResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      width: parseFloat(row.width),
      height: parseFloat(row.height),
      dimensionUnit: row.dimension_unit,
      orientation: row.orientation,
      styleTags: row.style_tags || [],
      dominantColors: row.dominant_colors || [],
      medium: row.medium,
      availability: row.availability
    }));

    res.json({
      artist: {
        id: artist.id,
        name: artist.display_name || artist.email,
        email: artist.email,
        bio: artist.bio,
        city: artist.location_city,
        country: artist.location_country,
        primaryMedium: artist.primary_medium,
        profileImageUrl: artist.profile_image_url,
        websiteUrl: artist.website_url,
        instagramUrl: artist.instagram_url
      },
      artworks
    });
  } catch (error: any) {
    console.error('Error fetching artist detail:', error);
    res.status(500).json({ error: 'Failed to fetch artist details' });
  }
});

router.get('/artist-directory/filters', authenticateToken, async (req: any, res) => {
  try {
    const stylesResult = await query(`
      SELECT DISTINCT jsonb_array_elements_text(a.style_tags) as style
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_galleries = TRUE AND u.artist_access = TRUE
      ORDER BY style
    `);

    const mediumsResult = await query(`
      SELECT DISTINCT a.medium
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_galleries = TRUE 
        AND u.artist_access = TRUE 
        AND a.medium IS NOT NULL
      ORDER BY medium
    `);

    const availabilityResult = await query(`
      SELECT DISTINCT a.availability
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_galleries = TRUE 
        AND u.artist_access = TRUE 
        AND a.availability IS NOT NULL
      ORDER BY availability
    `);

    const countriesResult = await query(`
      SELECT DISTINCT u.location_country as country
      FROM users u
      WHERE u.visible_to_galleries = TRUE 
        AND u.artist_access = TRUE 
        AND u.location_country IS NOT NULL
      ORDER BY country
    `);

    const citiesResult = await query(`
      SELECT DISTINCT u.location_city as city
      FROM users u
      WHERE u.visible_to_galleries = TRUE 
        AND u.artist_access = TRUE 
        AND u.location_city IS NOT NULL
      ORDER BY city
    `);

    const sizeRangeResult = await query(`
      SELECT 
        MIN(a.width) as min_width, MAX(a.width) as max_width,
        MIN(a.height) as min_height, MAX(a.height) as max_height
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_galleries = TRUE AND u.artist_access = TRUE
    `);

    res.json({
      styles: stylesResult.rows.map((r: any) => r.style).filter(Boolean),
      mediums: mediumsResult.rows.map((r: any) => r.medium).filter(Boolean),
      availabilities: availabilityResult.rows.map((r: any) => r.availability).filter(Boolean),
      countries: countriesResult.rows.map((r: any) => r.country).filter(Boolean),
      cities: citiesResult.rows.map((r: any) => r.city).filter(Boolean),
      sizeRange: sizeRangeResult.rows[0] || { min_width: 0, max_width: 500, min_height: 0, max_height: 500 }
    });
  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

router.get('/sent-messages', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const result = await query(`
      SELECT 
        m.id, m.recipient_id, m.sender_role,
        m.artwork_id, m.project_name, m.subject, m.body,
        m.is_read, m.created_at,
        u.email as recipient_email, u.display_name as recipient_name,
        a.title as artwork_title, a.image_url as artwork_image
      FROM messages m
      JOIN users u ON m.recipient_id = u.id
      LEFT JOIN artworks a ON m.artwork_id = a.id
      WHERE m.sender_id = $1 AND m.sender_role = 'gallery'
      ORDER BY m.created_at DESC
    `, [req.user.id]);

    const messages = result.rows.map((row: any) => ({
      id: row.id,
      recipientId: row.recipient_id,
      recipientEmail: row.recipient_email,
      recipientName: row.recipient_name || row.recipient_email,
      senderRole: row.sender_role,
      artworkId: row.artwork_id,
      artworkTitle: row.artwork_title,
      artworkImage: row.artwork_image,
      projectName: row.project_name,
      subject: row.subject,
      body: row.body,
      isRead: row.is_read,
      createdAt: row.created_at
    }));

    res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const visibleArtistsResult = await query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN artworks a ON a.artist_id = u.id
      WHERE u.visible_to_galleries = TRUE AND u.artist_access = TRUE
    `);

    const contactedArtistsResult = await query(`
      SELECT COUNT(DISTINCT m.recipient_id) as count
      FROM messages m
      WHERE m.sender_id = $1 AND m.sender_role = 'gallery'
    `, [req.user.id]);

    res.json({
      visibleArtists: parseInt(visibleArtistsResult.rows[0]?.count) || 0,
      contactedArtists: parseInt(contactedArtistsResult.rows[0]?.count) || 0
    });
  } catch (error: any) {
    console.error('Error fetching gallery stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
