import { envBool, envBoolDefaultTrue } from './envBool';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export const FEATURE_FLAGS = {
  GALLERY_ENABLED: envBoolDefaultTrue(import.meta.env.VITE_FEATURE_GALLERY_ENABLED),
  EXHIBITION_PUBLIC_ENABLED: envBoolDefaultTrue(import.meta.env.VITE_FEATURE_EXHIBITION_PUBLIC_ENABLED),
  STRIPE_ENABLED: envBool(import.meta.env.VITE_STRIPE_ENABLED),
  PAYMENTS_ENABLED: envBool(import.meta.env.VITE_PAYMENTS_ENABLED),
  IS_STAGING: envBool(import.meta.env.VITE_STAGING_ENVIRONMENT),
};

export function isGalleryEnabled(): boolean {
  return FEATURE_FLAGS.GALLERY_ENABLED;
}

export function isExhibitionPublicEnabled(): boolean {
  return FEATURE_FLAGS.EXHIBITION_PUBLIC_ENABLED;
}

export function isStripeEnabled(): boolean {
  return FEATURE_FLAGS.STRIPE_ENABLED;
}

export function isPaymentsEnabled(): boolean {
  return FEATURE_FLAGS.PAYMENTS_ENABLED;
}

export function isPaymentsAvailable(): boolean {
  return isStripeEnabled() && isPaymentsEnabled();
}

export function isStagingEnvironment(): boolean {
  return FEATURE_FLAGS.IS_STAGING;
}

interface FeatureFlagsResponse {
  galleryEnabled: boolean;
  exhibitionPublicEnabled: boolean;
  stripeEnabled: boolean;
  paymentsEnabled: boolean;
  paymentsAvailable: boolean;
}

let cachedFlags: FeatureFlagsResponse | null = null;

export async function fetchFeatureFlags(): Promise<FeatureFlagsResponse> {
  if (cachedFlags) return cachedFlags;
  
  try {
    const response = await fetch(`${API_URL}/api/feature-flags`);
    if (response.ok) {
      cachedFlags = await response.json();
      return cachedFlags!;
    }
  } catch (error) {
    console.warn('Failed to fetch feature flags, using defaults:', error);
  }
  
  return {
    galleryEnabled: FEATURE_FLAGS.GALLERY_ENABLED,
    exhibitionPublicEnabled: FEATURE_FLAGS.EXHIBITION_PUBLIC_ENABLED,
    stripeEnabled: FEATURE_FLAGS.STRIPE_ENABLED,
    paymentsEnabled: FEATURE_FLAGS.PAYMENTS_ENABLED,
    paymentsAvailable: FEATURE_FLAGS.STRIPE_ENABLED && FEATURE_FLAGS.PAYMENTS_ENABLED,
  };
}

export function clearFeatureFlagsCache(): void {
  cachedFlags = null;
}
