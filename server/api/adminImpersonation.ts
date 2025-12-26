import { Router, Response } from 'express';
import { query } from '../db/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { getEffectivePlan, getPlanLimits } from '../config/planLimits.js';

const router = Router();

const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  const isAdmin = req.realUser?.is_admin || req.user?.is_admin;
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.post('/start', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await query(
      `SELECT id, email, role, email_confirmed, created_at, is_admin, 
              subscription_status, subscription_plan, 
              artist_access, designer_access, gallery_access, onboarding_completed 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = result.rows[0];

    if (targetUser.is_admin) {
      return res.status(400).json({ error: 'Cannot impersonate another admin' });
    }

    const viewer = await buildViewerObject(targetUser);

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || !!process.env.REPLIT_DOMAINS;
    res.cookie('impersonatedUserId', String(userId), {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      viewer,
    });
  } catch (error) {
    console.error('Impersonation start error:', error);
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
});

router.post('/stop', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || !!process.env.REPLIT_DOMAINS;
    res.clearCookie('impersonatedUserId', {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Impersonation stop error:', error);
    res.status(500).json({ error: 'Failed to stop impersonation' });
  }
});

router.get('/user/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, email, role, email_confirmed, created_at, is_admin, 
              subscription_status, subscription_plan, 
              artist_access, designer_access, gallery_access, onboarding_completed 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = result.rows[0];
    const viewer = await buildViewerObject(targetUser);

    res.json({ viewer });
  } catch (error) {
    console.error('Get user for impersonation error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

router.get('/search', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { q, plan, limit = 20 } = req.query;

    let sql = `
      SELECT id, email, role, subscription_status, subscription_plan, 
             artist_access, designer_access, gallery_access, is_admin, created_at
      FROM users
      WHERE is_admin = false
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (q && typeof q === 'string' && q.trim()) {
      sql += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (plan && typeof plan === 'string') {
      if (plan === 'free' || plan === 'user') {
        sql += ` AND (subscription_plan IS NULL OR subscription_plan = 'user' OR (subscription_status != 'active' AND subscription_status != 'free'))`;
      } else if (['artist', 'designer', 'gallery', 'allaccess'].includes(plan)) {
        sql += ` AND subscription_plan = $${paramIndex} AND subscription_status IN ('active', 'free')`;
        params.push(plan);
        paramIndex++;
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(Number(limit));

    const result = await query(sql, params);

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscription_plan || 'user',
      subscriptionStatus: user.subscription_status || 'free',
      effectivePlan: computeEffectivePlan(user),
      createdAt: user.created_at,
    }));

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/fixture-users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const fixtureEmails = [
      { plan: 'free', email: 'free@test.com' },
      { plan: 'artist', email: 'artist@test.com' },
      { plan: 'designer', email: 'designer@test.com' },
      { plan: 'gallery', email: 'gallery@test.com' },
      { plan: 'allaccess', email: 'allaccess@test.com' },
    ];

    const result = await query(
      `SELECT id, email, role, subscription_status, subscription_plan, 
              artist_access, designer_access, gallery_access, is_admin, created_at
       FROM users 
       WHERE email = ANY($1::text[])`,
      [fixtureEmails.map(f => f.email)]
    );

    const fixtureMap = new Map<string, any>(result.rows.map(u => [u.email, u]));
    
    const fixtures = fixtureEmails.map(f => {
      const user = fixtureMap.get(f.email);
      if (!user) {
        return { plan: f.plan, email: f.email, exists: false, user: null };
      }
      return {
        plan: f.plan,
        email: f.email,
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          effectivePlan: computeEffectivePlan(user),
        },
      };
    });

    res.json({ fixtures });
  } catch (error) {
    console.error('Fixture users error:', error);
    res.status(500).json({ error: 'Failed to get fixture users' });
  }
});

function computeEffectivePlan(user: any): string {
  if (user.is_admin) return 'admin';
  
  const status = user.subscription_status || 'free';
  const plan = user.subscription_plan || 'user';

  if (status !== 'active' && status !== 'free') {
    return 'user';
  }

  if (user.artist_access && user.designer_access && user.gallery_access) {
    return 'allaccess';
  }

  if (!['user', 'artist', 'designer', 'gallery', 'allaccess'].includes(plan)) {
    return 'user';
  }

  return plan;
}

async function buildViewerObject(targetUser: any) {
  const effectivePlan = getEffectivePlan(targetUser);
  const planLimits = getPlanLimits(targetUser);

  const entitlements = {
    artist_access: targetUser.artist_access || false,
    designer_access: targetUser.designer_access || false,
    gallery_access: targetUser.gallery_access || false,
  };

  const [artworkResult, projectResult, wallPhotoResult] = await Promise.all([
    query('SELECT COUNT(*) as count FROM artworks WHERE artist_id = $1', [targetUser.id]),
    query('SELECT COUNT(*) as count FROM projects WHERE designer_id = $1', [targetUser.id]),
    query(
      'SELECT COUNT(*) as count FROM room_images ri JOIN projects p ON ri.project_id = p.id WHERE p.designer_id = $1',
      [targetUser.id]
    ),
  ]);

  const usage = {
    artworks: parseInt(artworkResult.rows[0].count, 10),
    projects: parseInt(projectResult.rows[0].count, 10),
    wallPhotos: parseInt(wallPhotoResult.rows[0].count, 10),
  };

  return {
    id: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    isAdmin: false,
    emailConfirmed: targetUser.email_confirmed,
    createdAt: targetUser.created_at,
    subscriptionStatus: targetUser.subscription_status || 'free',
    subscriptionPlan: targetUser.subscription_plan || 'user',
    effectivePlan,
    planLimits,
    entitlements,
    onboardingCompleted: targetUser.onboarding_completed || false,
    usage,
  };
}

export default router;
