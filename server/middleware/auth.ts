import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Entitlements interface for multi-role access
export interface UserEntitlements {
  artist_access: boolean;
  designer_access: boolean;
  gallery_access: boolean;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    is_admin?: boolean;
    subscription_status?: string;
    subscription_plan?: string;
    effectivePlan?: string;
    isActiveSubscriber?: boolean;
    entitlements: UserEntitlements;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Cookie-only authentication
  const token = req.cookies?.token;

  if (!token) {
    console.warn('[Auth] No token cookie found for request:', req.method, req.path);
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };
    
    const result = await query(
      'SELECT id, email, role, is_admin, subscription_status, subscription_plan, artist_access, designer_access, gallery_access FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }
    
    const user = result.rows[0];
    
    let effectivePlan = user.subscription_plan || 'user';
    const status = user.subscription_status || 'free';
    
    if (user.is_admin) {
      effectivePlan = 'admin';
    } else if (status !== 'active' && status !== 'free') {
      effectivePlan = 'user';
    }
    
    // Build entitlements object - admins get all access
    const entitlements: UserEntitlements = {
      artist_access: user.is_admin ? true : (user.artist_access || false),
      designer_access: user.is_admin ? true : (user.designer_access || false),
      gallery_access: user.is_admin ? true : (user.gallery_access || false),
    };
    
    req.user = {
      id: user.id,
      email: user.email,
      role: user.is_admin ? 'admin' : user.role,
      is_admin: user.is_admin || false,
      subscription_status: user.subscription_status || 'free',
      subscription_plan: user.subscription_plan || 'user',
      effectivePlan,
      isActiveSubscriber: status === 'active' || status === 'free',
      entitlements,
    };
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Legacy role-based middleware (kept for backward compatibility)
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

// New entitlement-based middleware for multi-role access
export const requireEntitlement = (entitlement: 'artist_access' | 'designer_access' | 'gallery_access') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admins always have access
    if (req.user.is_admin) {
      return next();
    }

    // Check specific entitlement
    if (!req.user.entitlements[entitlement]) {
      const planMap = {
        artist_access: 'Artist',
        designer_access: 'Designer',
        gallery_access: 'Gallery',
      };
      return res.status(403).json({ 
        error: 'Subscription required',
        message: `This feature requires ${planMap[entitlement]} access. Please upgrade your subscription.`,
        required_entitlement: entitlement,
        upgrade_url: '/pricing'
      });
    }

    next();
  };
};

// Check if user has ANY of the specified entitlements
export const requireAnyEntitlement = (...entitlements: Array<'artist_access' | 'designer_access' | 'gallery_access'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admins always have access
    if (req.user.is_admin) {
      return next();
    }

    // Check if user has any of the required entitlements
    const hasAccess = entitlements.some(ent => req.user!.entitlements[ent]);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Subscription required',
        message: 'This feature requires an active subscription. Please upgrade to access.',
        upgrade_url: '/pricing'
      });
    }

    next();
  };
};
