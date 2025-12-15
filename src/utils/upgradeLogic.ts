export type PlanKey = 'free' | 'user' | 'artist' | 'designer' | 'gallery' | 'allaccess' | 'admin';

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
    premiumRooms: 'artist',
    highResExport: 'artist',
    pdfExport: 'artist',
    designerTools: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
    futurePremiumPacks: 'allaccess',
  },
  user: {
    artworkSelection: 'artist',
    watermarkRemoval: 'artist',
    moreArtworks: 'artist',
    standardRooms: 'artist',
    premiumRooms: 'artist',
    highResExport: 'artist',
    pdfExport: 'artist',
    designerTools: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
    futurePremiumPacks: 'allaccess',
  },
  artist: {
    premiumRooms: 'designer',
    highResExport: 'designer',
    designerTools: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
    futurePremiumPacks: 'allaccess',
  },
  designer: {
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
    futurePremiumPacks: 'allaccess',
  },
  gallery: {
    designerTools: 'allaccess',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
    futurePremiumPacks: 'allaccess',
  },
  allaccess: {},
  admin: {},
};

export function getRecommendedUpgradePlan(
  currentPlan: PlanKey,
  feature: FeatureKey
): PlanKey | null {
  if (currentPlan === 'allaccess' || currentPlan === 'admin') {
    return null;
  }
  return UPGRADE_MATRIX[currentPlan]?.[feature] ?? null;
}

export const PLAN_NAMES: Record<PlanKey, string> = {
  free: 'Free',
  user: 'Free',
  artist: 'Artist',
  designer: 'Designer',
  gallery: 'Gallery',
  allaccess: 'All-Access',
  admin: 'Admin',
};

export const PLAN_PRICES: Record<PlanKey, string> = {
  free: 'Free',
  user: 'Free',
  artist: '€9/month',
  designer: '€29/month',
  gallery: '€49/month',
  allaccess: '€79/month',
  admin: 'N/A',
};

export function getUpgradeMessageForFeature(feature: FeatureKey, recommendedPlan: PlanKey): string {
  const planName = PLAN_NAMES[recommendedPlan];
  
  const messages: Record<FeatureKey, string> = {
    premiumRooms: `Premium mockup rooms (100+) are available on the ${planName} plan and above. Upgrade to access all rooms.`,
    standardRooms: `Access to up to 40 standard mockup rooms is available on the ${planName} plan and above.`,
    highResExport: `High-resolution exports (3000px) are available on the ${planName} plan and above. Upgrade to download professional-quality images.`,
    pdfExport: `PDF exports are available on the ${planName} plan and above. Upgrade to create professional PDF visualizations.`,
    galleryTools: `Gallery tools (exhibitions, multi-art walls) are available on the ${planName} plan and above.`,
    exhibitions: `Virtual exhibitions are available on the ${planName} plan and above.`,
    unlimitedExhibitions: `You've reached your exhibition limit. Upgrade to ${planName} for unlimited exhibitions.`,
    unlimitedPDF: `You've reached your monthly PDF export limit. Upgrade to ${planName} for unlimited PDF exports.`,
    designerTools: `Designer Studio tools are available on the ${planName} plan and above.`,
    artworkSelection: `Full artwork selection is available on the ${planName} plan and above. Upgrade to explore all artwork options!`,
    watermarkRemoval: `Remove watermarks and unlock professional features on the ${planName} plan and above.`,
    moreArtworks: `Upload up to 50 artworks on the ${planName} plan. Upgrade to unlock more storage!`,
    futurePremiumPacks: `Future premium room packs are included with the ${planName} plan.`,
  };
  
  return messages[feature] || `This feature requires the ${planName} plan or higher.`;
}
