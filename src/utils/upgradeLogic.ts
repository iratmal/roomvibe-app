export type PlanKey = 'user' | 'artist' | 'designer' | 'gallery' | 'allaccess' | 'admin';

export type FeatureKey =
  | 'premiumRooms'
  | 'highResExport'
  | 'pdfExport'
  | 'galleryTools'
  | 'exhibitions'
  | 'unlimitedExhibitions'
  | 'unlimitedPDF'
  | 'designerTools'
  | 'artworkSelection'
  | 'watermarkRemoval';

const UPGRADE_MATRIX: Record<PlanKey, Partial<Record<FeatureKey, PlanKey>>> = {
  user: {
    artworkSelection: 'artist',
    watermarkRemoval: 'artist',
    premiumRooms: 'designer',
    highResExport: 'designer',
    pdfExport: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    designerTools: 'designer',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
  },
  artist: {
    premiumRooms: 'designer',
    highResExport: 'designer',
    pdfExport: 'designer',
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    designerTools: 'designer',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
  },
  designer: {
    galleryTools: 'gallery',
    exhibitions: 'gallery',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
  },
  gallery: {
    designerTools: 'allaccess',
    premiumRooms: 'allaccess',
    highResExport: 'allaccess',
    unlimitedExhibitions: 'allaccess',
    unlimitedPDF: 'allaccess',
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
  user: 'Free',
  artist: 'Artist',
  designer: 'Designer',
  gallery: 'Gallery',
  allaccess: 'All-Access',
  admin: 'Admin',
};

export const PLAN_PRICES: Record<PlanKey, string> = {
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
    highResExport: `High-resolution exports (3000px) are available on the ${planName} plan and above. Upgrade to download professional-quality images.`,
    pdfExport: `PDF exports are available on the ${planName} plan and above. Upgrade to create professional PDF visualizations.`,
    galleryTools: `Gallery tools (exhibitions, multi-art walls) are available on the ${planName} plan and above.`,
    exhibitions: `Virtual exhibitions are available on the ${planName} plan and above.`,
    unlimitedExhibitions: `You've reached your exhibition limit. Upgrade to ${planName} for unlimited exhibitions.`,
    unlimitedPDF: `You've reached your monthly PDF export limit. Upgrade to ${planName} for unlimited PDF exports.`,
    designerTools: `Designer Studio tools are available on the ${planName} plan and above.`,
    artworkSelection: `Full artwork selection is available on the ${planName} plan and above. Upgrade to explore all artwork options!`,
    watermarkRemoval: `Remove watermarks and unlock professional features on the ${planName} plan and above.`,
  };
  
  return messages[feature] || `This feature requires the ${planName} plan or higher.`;
}
