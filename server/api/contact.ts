import express from 'express';
import nodemailer from 'nodemailer';
import { contactRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', contactRateLimit, async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.trim().length > 5000) {
    return res.status(400).json({ error: 'Message is too long (max 5000 characters).' });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const contactTo = process.env.CONTACT_EMAIL || 'contact@roomvibe.app';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('[contact] SMTP not configured — missing SMTP_HOST, SMTP_USER, or SMTP_PASS env vars');
    console.info(`[contact] Message from ${name} <${email.trim()}>: ${message.trim()}`);
    return res.status(503).json({ error: 'Email service is not configured yet.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"RoomVibe Contact" <${smtpUser}>`,
      to: contactTo,
      replyTo: `"${name.trim()}" <${email.trim()}>`,
      subject: `Contact form: ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
      html: `<p><strong>Name:</strong> ${name.trim()}</p><p><strong>Email:</strong> <a href="mailto:${email.trim()}">${email.trim()}</a></p><hr/><p>${message.trim().replace(/\n/g, '<br/>')}</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[contact] Failed to send email:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
