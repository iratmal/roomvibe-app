import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('📝 Registration attempt:', { email: req.body?.email, role: req.body?.role });
    
    const { email, password, role = 'user', tosAccepted = false, marketingOptIn = false } = req.body;

    if (!email || !password) {
      console.log('❌ Registration failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!tosAccepted) {
      console.log('❌ Registration failed: Terms not accepted');
      return res.status(400).json({ error: 'You must accept the Terms of Service to create an account.' });
    }

    if (password.length < 6) {
      console.log('❌ Registration failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const validRoles = ['user', 'artist', 'designer', 'gallery', 'admin'];
    if (!validRoles.includes(role)) {
      console.log('❌ Registration failed: Invalid role:', role);
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Registration failed: Email already exists:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tosVersion = '2025-12-13';
    const now = new Date();

    const result = await query(
      `INSERT INTO users (email, password_hash, role, confirmation_token, email_confirmed, tos_accepted_at, privacy_accepted_at, tos_version, marketing_opt_in, marketing_opt_in_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, role, email_confirmed`,
      [email.toLowerCase(), passwordHash, role, confirmationToken, true, now, now, tosVersion, marketingOptIn, marketingOptIn ? now : null]
    );

    const user = result.rows[0];

    console.log(`✅ User registered successfully: ${email} (role: ${role})`);
    console.log(`📧 [MVP] Email confirmation disabled - user auto-verified`);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || !!process.env.REPLIT_DOMAINS;
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Registration successful! You are now logged in.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailConfirmed: user.email_confirmed
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT id, email, password_hash, role, email_confirmed, is_admin, artist_access, designer_access, gallery_access FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const effectiveRole = user.is_admin ? 'admin' : user.role;

    // Build entitlements object - admins get all access, role grants access, DB columns add more
    const entitlements = {
      artist_access: user.is_admin ? true : (user.artist_access || user.role === 'artist'),
      designer_access: user.is_admin ? true : (user.designer_access || user.role === 'designer'),
      gallery_access: user.is_admin ? true : (user.gallery_access || user.role === 'gallery'),
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: effectiveRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || !!process.env.REPLIT_DOMAINS;
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: effectiveRole,
        isAdmin: user.is_admin || false,
        emailConfirmed: user.email_confirmed,
        entitlements
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/confirm/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await query(
      'SELECT id, email FROM users WHERE confirmation_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid confirmation token' });
    }

    await query(
      'UPDATE users SET email_confirmed = true, confirmation_token = NULL WHERE confirmation_token = $1',
      [token]
    );

    const user = result.rows[0];

    res.json({
      message: 'Email confirmed successfully! You can now log in.',
      email: user.email
    });
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({ error: 'Email confirmation failed' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  // Prevent caching of auth state
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await query(
      'SELECT id, email, role, email_confirmed, created_at, is_admin, subscription_status, subscription_plan, artist_access, designer_access, gallery_access, onboarding_completed FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const effectiveRole = user.is_admin ? 'admin' : user.role;
    
    const { getEffectivePlan, getPlanLimits } = await import('../middleware/subscription.js');
    const effectivePlan = getEffectivePlan(user);
    const planLimits = getPlanLimits(user);

    // Build entitlements object - admins get all access, role grants access, DB columns add more
    const entitlements = {
      artist_access: user.is_admin ? true : (user.artist_access || user.role === 'artist'),
      designer_access: user.is_admin ? true : (user.designer_access || user.role === 'designer'),
      gallery_access: user.is_admin ? true : (user.gallery_access || user.role === 'gallery'),
    };

    const artworkCountResult = await query(
      'SELECT COUNT(*) as count FROM artworks WHERE artist_id = $1',
      [user.id]
    );
    const artworkCount = parseInt(artworkCountResult.rows[0].count, 10);

    const projectCountResult = await query(
      'SELECT COUNT(*) as count FROM projects WHERE designer_id = $1',
      [user.id]
    );
    const projectCount = parseInt(projectCountResult.rows[0].count, 10);

    const wallPhotoCountResult = await query(
      'SELECT COUNT(*) as count FROM room_images ri JOIN projects p ON ri.project_id = p.id WHERE p.designer_id = $1',
      [user.id]
    );
    const wallPhotoCount = parseInt(wallPhotoCountResult.rows[0].count, 10);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: effectiveRole,
        isAdmin: user.is_admin || false,
        emailConfirmed: user.email_confirmed,
        createdAt: user.created_at,
        subscriptionStatus: user.subscription_status || 'free',
        subscriptionPlan: user.subscription_plan || 'user',
        effectivePlan,
        planLimits,
        entitlements,
        onboardingCompleted: user.onboarding_completed || false,
        usage: {
          artworks: artworkCount,
          projects: projectCount,
          wallPhotos: wallPhotoCount,
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

router.post('/complete-onboarding', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await query(
      'UPDATE users SET onboarding_completed = TRUE WHERE id = $1',
      [req.user.id]
    );

    console.log(`✅ Onboarding completed for user: ${req.user.email}`);

    res.json({ 
      success: true,
      message: 'Onboarding completed' 
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to update onboarding status' });
  }
});

router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be at least 6 characters' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password and confirm password do not match' 
      });
    }

    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    console.log(`✅ Password changed successfully for user: ${req.user.email}`);

    res.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password. Please try again.' 
    });
  }
});

export default router;
