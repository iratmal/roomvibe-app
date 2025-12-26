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
  realUser?: {
    id: number;
    email: string;
    is_admin: boolean;
  };
  isImpersonating?: boolean;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    
    const realUser = result.rows[0];
    
    const impersonatedUserId = req.cookies?.impersonatedUserId;
    let targetUser = realUser;
    let isImpersonating = false;

    if (realUser.is_admin && impersonatedUserId) {
      const targetResult = await query(
        'SELECT id, email, role, is_admin, subscription_status, subscription_plan, artist_access, designer_access, gallery_access FROM users WHERE id = $1',
        [parseInt(impersonatedUserId, 10)]
      );
      
      if (targetResult.rows.length > 0 && !targetResult.rows[0].is_admin) {
        targetUser = targetResult.rows[0];
        isImpersonating = true;
        req.realUser = {
          id: realUser.id,
          email: realUser.email,
          is_admin: realUser.is_admin,
        };
      }
    }
    
    const entitlements: UserEntitlements = {
      artist_access: targetUser.is_admin ? true : (targetUser.artist_access || false),
      designer_access: targetUser.is_admin ? true : (targetUser.designer_access || false),
      gallery_access: targetUser.is_admin ? true : (targetUser.gallery_access || false),
    };
    
    // Derive effectivePlan from entitlements FIRST, then fall back to Stripe
    let effectivePlan: string;
    if (targetUser.is_admin) {
      effectivePlan = 'admin';
    } else {
      // Check entitlements first
      const entitlementCount = [entitlements.artist_access, entitlements.designer_access, entitlements.gallery_access].filter(Boolean).length;
      
      if (entitlementCount >= 2) {
        effectivePlan = 'allaccess';
      } else if (entitlements.designer_access) {
        effectivePlan = 'designer';
      } else if (entitlements.gallery_access) {
        effectivePlan = 'gallery';
      } else if (entitlements.artist_access) {
        effectivePlan = 'artist';
      } else {
        // No entitlements - fall back to Stripe subscription
        const status = targetUser.subscription_status || 'free';
        if (status !== 'active' && status !== 'free') {
          effectivePlan = 'user';
        } else {
          effectivePlan = targetUser.subscription_plan || 'user';
        }
      }
    }
    
    req.user = {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.is_admin ? 'admin' : targetUser.role,
      is_admin: isImpersonating ? false : (targetUser.is_admin || false),
      subscription_status: targetUser.subscription_status || 'free',
      subscription_plan: targetUser.subscription_plan || 'user',
      effectivePlan,
      isActiveSubscriber: status === 'active' || status === 'free',
      entitlements,
    };
    req.isImpersonating = isImpersonating;
    
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
