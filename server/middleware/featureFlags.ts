import { Request, Response, NextFunction } from 'express';

export function requireGalleryFeature(req: Request, res: Response, next: NextFunction) {
  const galleryEnabled = process.env.FEATURE_GALLERY_ENABLED !== 'false';
  
  if (!galleryEnabled) {
    return res.status(503).json({
      error: 'Feature not available',
      message: 'The Gallery feature is currently being prepared for launch. Please check back soon.',
      feature: 'gallery'
    });
  }
  
  next();
}

export function requireStripeFeature(req: Request, res: Response, next: NextFunction) {
  const stripeEnabled = process.env.STRIPE_ENABLED === 'true';
  
  if (!stripeEnabled) {
    return res.status(503).json({
      error: 'Feature not available',
      message: 'Payment processing is currently disabled.',
      feature: 'stripe'
    });
  }
  
  next();
}

export function isGalleryEnabled(): boolean {
  return process.env.FEATURE_GALLERY_ENABLED !== 'false';
}

export function isStripeEnabled(): boolean {
  return process.env.STRIPE_ENABLED === 'true';
}
