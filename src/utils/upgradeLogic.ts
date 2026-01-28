export type PlanKey = 'free' | 'user' | 'artist' | 'artist_pro' | 'designer' | 'gallery' | 'admin';

export type FeatureKey =
  | 'premiumRooms'
  | 'standardRooms'
  | 'highResExport'
  | 'pdfExport'
  | 'galleryTools'
  | 'exhibitions'
  | 'unlimitedExhibitions'
  | 'unlimitedPDF'
  | 'designerTools'
  | 'artworkSelection'
  | 'watermarkRemoval'
  | 'moreArtworks'
  | 'futurePremiumPacks';

const UPGRADE_MATRIX: Record<PlanKey, Partial<Record<FeatureKey, PlanKey>>> = {
  free: {
    artworkSelection: 'artist',
    watermarkRemoval: 'artist',
    moreArtworks: 'artist',
    standardRooms: 'artist',
    premiumRooms: 'artist_pro',
    highResExport: 'artist',
    pdfExport: 'artist',
    designerTools: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'artist',
    unlimitedExhibitions: 'artist_pro',
    unlimitedPDF: 'artist_pro',
    futurePremiumPacks: 'artist_pro',
  },
  user: {
    artworkSelection: 'artist',
    watermarkRemoval: 'artist',
    moreArtworks: 'artist',
    standardRooms: 'artist',
    premiumRooms: 'artist_pro',
    highResExport: 'artist',
    pdfExport: 'artist',
    designerTools: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'artist',
    unlimitedExhibitions: 'artist_pro',
    unlimitedPDF: 'artist_pro',
    futurePremiumPacks: 'artist_pro',
  },
  artist: {
    premiumRooms: 'artist_pro',
    designerTools: 'designer',
    galleryTools: 'gallery',
    unlimitedExhibitions: 'artist_pro',
    unlimitedPDF: 'artist_pro',
    futurePremiumPacks: 'artist_pro',
  },
  artist_pro: {
    designerTools: 'designer',
    galleryTools: 'gallery',
  },
  designer: {
    galleryTools: 'gallery',
  },
  gallery: {
    designerTools: 'designer',
  },
  admin: {},
};

export function getRecommendedUpgradePlan(
  currentPlan: PlanKey,
  feature: FeatureKey
): PlanKey | null {
  if (currentPlan === 'admin') {
    return null;
  }
  return UPGRADE_MATRIX[currentPlan]?.[feature] ?? null;
}

export const PLAN_NAMES: Record<PlanKey, string> = {
  free: 'Free',
  user: 'Free',
  artist: 'Artist',
  artist_pro: 'Artist Pro',
  designer: 'Designer',
  gallery: 'Gallery',
  admin: 'Admin',
};

export const PLAN_PRICES: Record<PlanKey, string> = {
  free: 'Free',
  user: 'Free',
  artist: '€9/month',
  artist_pro: '€29/month',
  designer: '€29/month',
  gallery: '€49/month',
  admin: 'N/A',
};

export function getUpgradeMessageForFeature(feature: FeatureKey, recommendedPlan: PlanKey): string {
  const planName = PLAN_NAMES[recommendedPlan];
  
  const messages: Record<FeatureKey, string> = {
    premiumRooms: `Premium mockup rooms (100+) are available on the ${planName} plan. Upgrade to access all rooms.`,
    standardRooms: `Access to up to 40 standard mockup rooms is available on the ${planName} plan and above.`,
    highResExport: `High-resolution exports (3000px) are available on the Artist plan and above. Upgrade to download professional-quality images.`,
    pdfExport: `PDF exports are available on the ${planName} plan and above. Upgrade to create professional PDF visualizations.`,
    galleryTools: `Gallery tools (exhibitions, multi-art walls) are available on the ${planName} plan.`,
    exhibitions: `Virtual exhibitions are available on the ${planName} plan and above.`,
    unlimitedExhibitions: `You've reached your exhibition limit. Upgrade to ${planName} for unlimited exhibitions.`,
    unlimitedPDF: `You've reached your monthly PDF export limit. Upgrade to ${planName} for unlimited PDF exports.`,
    designerTools: `Designer Studio tools are available on the ${planName} plan.`,
    artworkSelection: `Full artwork selection is available on the ${planName} plan and above. Upgrade to explore all artwork options!`,
    watermarkRemoval: `Remove watermarks and unlock professional features on the ${planName} plan and above.`,
    moreArtworks: `Upload up to 50 artworks on the ${planName} plan. Upgrade to unlock more storage!`,
    futurePremiumPacks: `Future premium room packs are included with the ${planName} plan.`,
  };
  
  return messages[feature] || `This feature requires the ${planName} plan or higher.`;
}
