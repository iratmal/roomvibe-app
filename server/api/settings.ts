import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/settings', authenticateToken, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT inbox_email_notifications FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    res.json({
      inboxEmailNotifications: row.inbox_email_notifications !== false
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', authenticateToken, async (req: any, res) => {
  try {
    const { inboxEmailNotifications } = req.body;

    if (typeof inboxEmailNotifications !== 'boolean') {
      return res.status(400).json({ error: 'inboxEmailNotifications must be a boolean' });
    }

    await query(
      `UPDATE users SET inbox_email_notifications = $1 WHERE id = $2`,
      [inboxEmailNotifications, req.user.id]
    );

    res.json({ success: true, inboxEmailNotifications });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
