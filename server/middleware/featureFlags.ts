import { Request, Response, NextFunction } from 'express';
import { envBool, envBoolDefaultTrue } from '../utils/envBool.js';

export function requireGalleryFeature(req: Request, res: Response, next: NextFunction) {
  const galleryEnabled = envBoolDefaultTrue(process.env.FEATURE_GALLERY_ENABLED);
  
  if (!galleryEnabled) {
    return res.status(403).json({
      error: 'Feature disabled',
      message: 'The Gallery feature is currently being prepared for launch. Please check back soon.',
      feature: 'gallery'
    });
  }
  
  next();
}

export function requireExhibitionPublicFeature(req: Request, res: Response, next: NextFunction) {
  const exhibitionPublicEnabled = envBoolDefaultTrue(process.env.FEATURE_EXHIBITION_PUBLIC_ENABLED);
  
  if (!exhibitionPublicEnabled) {
    return res.status(403).json({
      error: 'Feature disabled',
      message: 'This feature is temporarily unavailable. Please try again later.',
      feature: 'exhibition_public'
    });
  }
  
  next();
}

export function requireStripeFeature(req: Request, res: Response, next: NextFunction) {
  const stripeEnabled = envBool(process.env.STRIPE_ENABLED);
  const paymentsEnabled = envBool(process.env.PAYMENTS_ENABLED);
  const paymentsAvailable = stripeEnabled && paymentsEnabled;
  
  if (!paymentsAvailable) {
    return res.status(403).json({
      error: 'Payments disabled',
      message: 'Payments are disabled in this environment.',
      feature: 'stripe'
    });
  }
  
  next();
}

export function isGalleryEnabled(): boolean {
  return envBoolDefaultTrue(process.env.FEATURE_GALLERY_ENABLED);
}

export function isExhibitionPublicEnabled(): boolean {
  return envBoolDefaultTrue(process.env.FEATURE_EXHIBITION_PUBLIC_ENABLED);
}

export function isStripeEnabled(): boolean {
  return envBool(process.env.STRIPE_ENABLED);
}

export function isPaymentsEnabled(): boolean {
  return envBool(process.env.PAYMENTS_ENABLED);
}

export function isPaymentsAvailable(): boolean {
  return isStripeEnabled() && isPaymentsEnabled();
}
