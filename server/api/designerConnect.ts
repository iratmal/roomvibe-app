import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getEffectivePlan } from '../middleware/subscription.js';

const router = express.Router();

router.get('/art-library', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['designer', 'gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ 
        error: 'Subscription required',
        message: 'Access to the Art Library requires a Designer subscription.',
        upgrade_url: '/pricing'
      });
    }

    const { style, medium, orientation, color, minWidth, maxWidth, minHeight, maxHeight } = req.query;

    let queryText = `
      SELECT 
        a.id, a.artist_id, a.title, a.image_url, 
        a.width, a.height, a.dimension_unit,
        a.orientation, a.style_tags, a.dominant_colors, a.medium, a.availability,
        u.display_name as artist_name, u.email as artist_email,
        u.location_city, u.location_country, u.bio, u.primary_medium,
        u.profile_image_url, u.website_url, u.instagram_url
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_designers = TRUE
        AND u.artist_access = TRUE
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (style) {
      paramCount++;
      queryText += ` AND a.style_tags @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([style]));
    }

    if (medium) {
      paramCount++;
      queryText += ` AND a.medium = $${paramCount}`;
      params.push(medium);
    }

    if (orientation) {
      paramCount++;
      queryText += ` AND a.orientation = $${paramCount}`;
      params.push(orientation);
    }

    if (color) {
      paramCount++;
      queryText += ` AND a.dominant_colors @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([color]));
    }

    if (minWidth) {
      paramCount++;
      queryText += ` AND a.width >= $${paramCount}`;
      params.push(parseFloat(minWidth as string));
    }

    if (maxWidth) {
      paramCount++;
      queryText += ` AND a.width <= $${paramCount}`;
      params.push(parseFloat(maxWidth as string));
    }

    if (minHeight) {
      paramCount++;
      queryText += ` AND a.height >= $${paramCount}`;
      params.push(parseFloat(minHeight as string));
    }

    if (maxHeight) {
      paramCount++;
      queryText += ` AND a.height <= $${paramCount}`;
      params.push(parseFloat(maxHeight as string));
    }

    queryText += ` ORDER BY a.created_at DESC`;

    const result = await query(queryText, params);

    const artworks = result.rows.map((row: any) => ({
      id: row.id,
      artistId: row.artist_id,
      title: row.title,
      imageUrl: row.image_url,
      width: parseFloat(row.width),
      height: parseFloat(row.height),
      dimensionUnit: row.dimension_unit,
      orientation: row.orientation,
      styleTags: row.style_tags || [],
      dominantColors: row.dominant_colors || [],
      medium: row.medium,
      availability: row.availability,
      artist: {
        id: row.artist_id,
        name: row.artist_name || row.artist_email,
        email: row.artist_email,
        city: row.location_city,
        country: row.location_country,
        bio: row.bio,
        primaryMedium: row.primary_medium,
        profileImageUrl: row.profile_image_url,
        websiteUrl: row.website_url,
        instagramUrl: row.instagram_url
      }
    }));

    res.json({ artworks, total: artworks.length });
  } catch (error: any) {
    console.error('Error fetching art library:', error);
    res.status(500).json({ error: 'Failed to fetch art library' });
  }
});

router.get('/art-library/filters', authenticateToken, async (req: any, res) => {
  try {
    const stylesResult = await query(`
      SELECT DISTINCT jsonb_array_elements_text(a.style_tags) as style
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_designers = TRUE AND u.artist_access = TRUE
      ORDER BY style
    `);

    const mediumsResult = await query(`
      SELECT DISTINCT a.medium
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_designers = TRUE 
        AND u.artist_access = TRUE 
        AND a.medium IS NOT NULL
      ORDER BY medium
    `);

    const colorsResult = await query(`
      SELECT DISTINCT jsonb_array_elements_text(a.dominant_colors) as color
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_designers = TRUE AND u.artist_access = TRUE
      ORDER BY color
    `);

    const sizeRangeResult = await query(`
      SELECT 
        MIN(a.width) as min_width, MAX(a.width) as max_width,
        MIN(a.height) as min_height, MAX(a.height) as max_height
      FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE u.visible_to_designers = TRUE AND u.artist_access = TRUE
    `);

    res.json({
      styles: stylesResult.rows.map((r: any) => r.style).filter(Boolean),
      mediums: mediumsResult.rows.map((r: any) => r.medium).filter(Boolean),
      orientations: ['portrait', 'landscape', 'square'],
      colors: colorsResult.rows.map((r: any) => r.color).filter(Boolean),
      sizeRange: sizeRangeResult.rows[0] || { min_width: 0, max_width: 500, min_height: 0, max_height: 500 }
    });
  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

router.get('/projects/:projectId/artworks', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['designer', 'gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const projectId = parseInt(req.params.projectId);

    const projectCheck = await query(
      'SELECT designer_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (effectivePlan !== 'admin' && projectCheck.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(`
      SELECT 
        dpa.id as link_id, dpa.added_at, dpa.notes as link_notes,
        a.id, a.artist_id, a.title, a.image_url,
        a.width, a.height, a.dimension_unit,
        a.orientation, a.style_tags, a.dominant_colors, a.medium,
        u.display_name as artist_name, u.email as artist_email
      FROM designer_project_artworks dpa
      JOIN artworks a ON dpa.artwork_id = a.id
      JOIN users u ON a.artist_id = u.id
      WHERE dpa.project_id = $1
      ORDER BY dpa.added_at DESC
    `, [projectId]);

    const artworks = result.rows.map((row: any) => ({
      linkId: row.link_id,
      addedAt: row.added_at,
      linkNotes: row.link_notes,
      id: row.id,
      artistId: row.artist_id,
      title: row.title,
      imageUrl: row.image_url,
      width: parseFloat(row.width),
      height: parseFloat(row.height),
      dimensionUnit: row.dimension_unit,
      orientation: row.orientation,
      styleTags: row.style_tags || [],
      dominantColors: row.dominant_colors || [],
      medium: row.medium,
      artistName: row.artist_name || row.artist_email
    }));

    res.json({ artworks });
  } catch (error: any) {
    console.error('Error fetching project artworks:', error);
    res.status(500).json({ error: 'Failed to fetch project artworks' });
  }
});

router.post('/projects/:projectId/artworks', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['designer', 'gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const projectId = parseInt(req.params.projectId);
    const { artworkId, notes } = req.body;

    if (!artworkId) {
      return res.status(400).json({ error: 'Artwork ID is required' });
    }

    const projectCheck = await query(
      'SELECT designer_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (effectivePlan !== 'admin' && projectCheck.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const artworkCheck = await query(`
      SELECT a.id FROM artworks a
      JOIN users u ON a.artist_id = u.id
      WHERE a.id = $1 AND u.visible_to_designers = TRUE
    `, [artworkId]);

    if (artworkCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found or not available' });
    }

    const result = await query(`
      INSERT INTO designer_project_artworks (project_id, artwork_id, notes)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, artwork_id) DO NOTHING
      RETURNING id, added_at
    `, [projectId, artworkId, notes || null]);

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Artwork already in project' });
    }

    res.status(201).json({ 
      message: 'Artwork added to project',
      linkId: result.rows[0].id
    });
  } catch (error: any) {
    console.error('Error adding artwork to project:', error);
    res.status(500).json({ error: 'Failed to add artwork to project' });
  }
});

router.delete('/projects/:projectId/artworks/:artworkId', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['designer', 'gallery', 'admin'].includes(effectivePlan)) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const projectId = parseInt(req.params.projectId);
    const artworkId = parseInt(req.params.artworkId);

    const projectCheck = await query(
      'SELECT designer_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (effectivePlan !== 'admin' && projectCheck.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(`
      DELETE FROM designer_project_artworks 
      WHERE project_id = $1 AND artwork_id = $2
      RETURNING id
    `, [projectId, artworkId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found in project' });
    }

    res.json({ message: 'Artwork removed from project' });
  } catch (error: any) {
    console.error('Error removing artwork from project:', error);
    res.status(500).json({ error: 'Failed to remove artwork from project' });
  }
});

router.get('/sent-messages', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = req.user.effectivePlan || getEffectivePlan(req.user);
    
    if (!['designer', 'gallery', 'admin'].includes(effectivePlan)) {
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
      WHERE m.sender_id = $1
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

export default router;
