import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };
    
    const result = await query(
      'SELECT id, email, role, is_admin, subscription_status, subscription_plan FROM users WHERE id = $1',
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
    
    req.user = {
      id: user.id,
      email: user.email,
      role: user.is_admin ? 'admin' : user.role,
      is_admin: user.is_admin || false,
      subscription_status: user.subscription_status || 'free',
      subscription_plan: user.subscription_plan || 'user',
      effectivePlan,
      isActiveSubscriber: status === 'active' || status === 'free',
    };
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

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
