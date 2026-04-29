import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

const logRateLimitHit = (req: Request, endpoint: string) => {
  console.warn(`[Security] Rate limit hit: endpoint=${endpoint} ip=${req.ip} path=${req.path} ua="${req.headers['user-agent']?.slice(0, 80) ?? ''}"`);
};

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  handler: (req, res, next, options) => {
    logRateLimitHit(req, 'login');
    res.status(options.statusCode).json(options.message);
  },
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id != null ? `user-${req.user.id}` : `ip-${ipKeyGenerator(req)}`,
  message: { error: 'Too many uploads. Please wait before uploading more images.' },
  handler: (req, res, next, options) => {
    logRateLimitHit(req, 'upload');
    res.status(options.statusCode).json(options.message);
  },
});

export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please wait before trying again.' },
  handler: (req, res, next, options) => {
    logRateLimitHit(req, 'contact');
    res.status(options.statusCode).json(options.message);
  },
});
