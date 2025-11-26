import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Use memory storage (like Artist uploads) to store image as base64 in database
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp) are allowed!'));
    }
  }
});

router.get('/projects', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can access projects' });
    }

    console.log('Fetching projects for user:', { userId: req.user.id, role: req.user.role });

    let queryText;
    let queryParams;

    if (req.user.role === 'admin') {
      queryText = `
        SELECT p.*, u.email as designer_email,
        (SELECT COUNT(*) FROM room_images WHERE project_id = p.id) as image_count
        FROM projects p
        LEFT JOIN users u ON p.designer_id = u.id
        ORDER BY p.created_at DESC`;
      queryParams = [];
    } else {
      queryText = `
        SELECT p.*,
        (SELECT COUNT(*) FROM room_images WHERE project_id = p.id) as image_count
        FROM projects p
        WHERE p.designer_id = $1
        ORDER BY p.created_at DESC`;
      queryParams = [req.user.id];
    }

    const result = await query(queryText, queryParams);
    console.log(`Found ${result.rows.length} projects`);
    res.json({ projects: result.rows });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

router.post('/projects', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can create projects' });
    }

    const { title, clientName, roomType, notes } = req.body;

    console.log('Creating project with data:', { title, clientName, roomType, notes });

    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const result = await query(
      `INSERT INTO projects (designer_id, title, client_name, room_type, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, title, clientName || null, roomType || null, notes || null]
    );

    console.log('Project created successfully:', result.rows[0].id);
    res.status(201).json({ project: result.rows[0], message: 'Project created successfully' });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

router.delete('/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can delete projects' });
    }

    const projectId = parseInt(req.params.id);

    const checkResult = await query(
      'SELECT designer_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && checkResult.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own projects' });
    }

    await query('DELETE FROM projects WHERE id = $1', [projectId]);

    console.log('Project deleted successfully:', projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

router.get('/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can access projects' });
    }

    const projectId = parseInt(req.params.id);

    const result = await query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && result.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only access your own projects' });
    }

    res.json({ project: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project', details: error.message });
  }
});

router.get('/projects/:id/rooms', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can access room images' });
    }

    const projectId = parseInt(req.params.id);

    const projectCheck = await query(
      'SELECT designer_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && projectCheck.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only access your own projects' });
    }

    const result = await query(
      'SELECT * FROM room_images WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );

    res.json({ rooms: result.rows });
  } catch (error: any) {
    console.error('Error fetching room images:', error);
    res.status(500).json({ error: 'Failed to fetch room images', details: error.message });
  }
});

router.post('/projects/:id/rooms', authenticateToken, upload.single('image'), async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can upload room images' });
    }

    const projectId = parseInt(req.params.id);
    const { label } = req.body;

    const projectCheck = await query(
      'SELECT designer_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && projectCheck.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only upload to your own projects' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Convert image to base64 (same approach as Artist uploads)
    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    console.log('[Designer Upload] Image converted to base64, size:', imageData.length);

    // Store with a URL that will serve the image from the database
    const result = await query(
      `INSERT INTO room_images (project_id, image_url, image_data, label)
       VALUES ($1, $2, $3, $4)
       RETURNING id, project_id, image_url, label, created_at`,
      [projectId, `/api/room-image/${Date.now()}`, imageData, label || null]
    );

    // Update the image_url to include the actual ID
    const roomId = result.rows[0].id;
    await query(
      `UPDATE room_images SET image_url = $1 WHERE id = $2`,
      [`/api/room-image/${roomId}`, roomId]
    );

    console.log('Room image uploaded successfully:', roomId);
    res.status(201).json({ 
      room: { ...result.rows[0], image_url: `/api/room-image/${roomId}` }, 
      message: 'Room image uploaded successfully' 
    });
  } catch (error: any) {
    console.error('Error uploading room image:', error);
    res.status(500).json({ error: 'Failed to upload room image', details: error.message });
  }
});

router.delete('/rooms/:id', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'designer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers and admins can delete room images' });
    }

    const roomId = parseInt(req.params.id);

    const roomCheck = await query(
      `SELECT r.id, p.designer_id 
       FROM room_images r
       JOIN projects p ON r.project_id = p.id
       WHERE r.id = $1`,
      [roomId]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Room image not found' });
    }

    if (req.user.role !== 'admin' && roomCheck.rows[0].designer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own room images' });
    }

    await query('DELETE FROM room_images WHERE id = $1', [roomId]);

    console.log('Room image deleted successfully:', roomId);
    res.json({ message: 'Room image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting room image:', error);
    res.status(500).json({ error: 'Failed to delete room image', details: error.message });
  }
});

export default router;
