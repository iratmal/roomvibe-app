import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/user', authenticateToken, requireRole('user', 'artist', 'designer', 'gallery', 'admin'), (req: AuthRequest, res: Response) => {
  res.json({
    message: 'User dashboard data',
    user: req.user,
    features: ['Browse artwork', 'My favorites', 'Recent visualizations']
  });
});

router.get('/artist', authenticateToken, requireRole('artist', 'admin'), (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Artist dashboard data',
    user: req.user,
    features: ['Upload artwork', 'Portfolio management', 'Sales analytics']
  });
});

router.get('/designer', authenticateToken, requireRole('designer', 'admin'), (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Designer dashboard data',
    user: req.user,
    features: ['Create designs', 'Client collaborations', 'Design library']
  });
});

router.get('/gallery', authenticateToken, requireRole('gallery', 'admin'), (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Gallery dashboard data',
    user: req.user,
    features: ['Collections', 'Artist partnerships', 'Virtual exhibitions']
  });
});

router.get('/admin', authenticateToken, requireRole('admin'), (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Admin dashboard data',
    user: req.user,
    features: ['User management', 'Content moderation', 'Platform analytics', 'System settings']
  });
});

export default router;
