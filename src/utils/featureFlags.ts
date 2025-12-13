export const FEATURE_FLAGS = {
  GALLERY_ENABLED: import.meta.env.VITE_FEATURE_GALLERY_ENABLED !== 'false',
  EXHIBITION_PUBLIC_ENABLED: import.meta.env.VITE_FEATURE_EXHIBITION_PUBLIC_ENABLED !== 'false',
  STRIPE_ENABLED: import.meta.env.VITE_STRIPE_ENABLED === 'true',
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
