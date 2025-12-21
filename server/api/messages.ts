import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/inbox', authenticateToken, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT 
        m.id, m.sender_id, m.recipient_id, m.sender_role,
        m.artwork_id, m.project_name, m.subject, m.body,
        m.is_read, m.created_at,
        u.email as sender_email, u.display_name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.recipient_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );

    const messages = result.rows.map((row: any) => ({
      id: row.id,
      senderId: row.sender_id,
      senderEmail: row.sender_email,
      senderName: row.sender_name || row.sender_email,
      senderRole: row.sender_role,
      artworkId: row.artwork_id,
      projectName: row.project_name,
      subject: row.subject,
      body: row.body,
      isRead: row.is_read,
      createdAt: row.created_at
    }));

    res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/inbox/unread-count', authenticateToken, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.get('/inbox/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);

    const result = await query(
      `SELECT 
        m.id, m.sender_id, m.recipient_id, m.sender_role,
        m.artwork_id, m.project_name, m.subject, m.body,
        m.is_read, m.created_at,
        u.email as sender_email, u.display_name as sender_name,
        a.title as artwork_title, a.image_url as artwork_image
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN artworks a ON m.artwork_id = a.id
       WHERE m.id = $1 AND m.recipient_id = $2`,
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const row = result.rows[0];
    
    await query(
      `UPDATE messages SET is_read = TRUE WHERE id = $1`,
      [messageId]
    );

    const message = {
      id: row.id,
      senderId: row.sender_id,
      senderEmail: row.sender_email,
      senderName: row.sender_name || row.sender_email,
      senderRole: row.sender_role,
      artworkId: row.artwork_id,
      artworkTitle: row.artwork_title,
      artworkImage: row.artwork_image,
      projectName: row.project_name,
      subject: row.subject,
      body: row.body,
      isRead: true,
      createdAt: row.created_at
    };

    res.json({ message });
  } catch (error: any) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

router.put('/inbox/:messageId/read', authenticateToken, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);

    const result = await query(
      `UPDATE messages SET is_read = TRUE 
       WHERE id = $1 AND recipient_id = $2
       RETURNING id`,
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

router.put('/inbox/mark-all-read', authenticateToken, async (req: any, res) => {
  try {
    await query(
      `UPDATE messages SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error: any) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

router.delete('/inbox/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);

    const result = await query(
      `DELETE FROM messages WHERE id = $1 AND recipient_id = $2 RETURNING id`,
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

router.post('/send', authenticateToken, async (req: any, res) => {
  try {
    const { recipientId, artworkId, projectName, subject, body } = req.body;

    if (!recipientId || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: recipientId, subject, body' });
    }

    const senderRole = req.user.designer_access ? 'designer' : (req.user.gallery_access ? 'gallery' : 'user');

    if (!req.user.designer_access && !req.user.gallery_access) {
      return res.status(403).json({ 
        error: 'Only designers and galleries can send messages to artists',
        message: 'You need a Designer or Gallery subscription to contact artists.'
      });
    }

    const recipientResult = await query(
      `SELECT id, email, display_name, visible_to_designers, visible_to_galleries FROM users WHERE id = $1`,
      [recipientId]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipient = recipientResult.rows[0];
    
    if (senderRole === 'designer' && !recipient.visible_to_designers) {
      return res.status(403).json({ 
        error: 'Artist not discoverable',
        message: 'This artist is not currently visible to designers.'
      });
    }

    if (senderRole === 'gallery' && !recipient.visible_to_galleries) {
      return res.status(403).json({ 
        error: 'Artist not discoverable',
        message: 'This artist is not currently visible to galleries.'
      });
    }

    const result = await query(
      `INSERT INTO messages (sender_id, recipient_id, sender_role, artwork_id, project_name, subject, body)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, sender_id, recipient_id, sender_role, artwork_id, project_name, subject, body, is_read, created_at`,
      [req.user.id, recipientId, senderRole, artworkId || null, projectName || null, subject, body]
    );

    res.status(201).json({ 
      message: 'Message sent successfully',
      messageData: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
