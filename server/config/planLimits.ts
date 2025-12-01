export type PlanType = 'user' | 'artist' | 'designer' | 'gallery' | 'admin';

export interface PlanLimits {
  maxArtworks: number;
  maxWallPhotos: number;
  maxProjects: number;
  maxMockupRooms: number;
  premiumRoomsAccess: boolean;
  highResExport: boolean;
  clientFolders: boolean;
  galleryDashboard: boolean;
  multiArtistCollections: boolean;
  customBranding: boolean;
  pdfProposals: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  user: {
    maxArtworks: 1,
    maxWallPhotos: 1,
    maxProjects: 1,
    maxMockupRooms: 5,
    premiumRoomsAccess: false,
    highResExport: false,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
  },
  artist: {
    maxArtworks: 50,
    maxWallPhotos: 100,
    maxProjects: 100,
    maxMockupRooms: -1,
    premiumRoomsAccess: true,
    highResExport: true,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
  },
  designer: {
    maxArtworks: -1,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    premiumRoomsAccess: true,
    highResExport: true,
    clientFolders: true,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: true,
    pdfProposals: true,
  },
  gallery: {
    maxArtworks: 500,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    premiumRoomsAccess: true,
    highResExport: true,
    clientFolders: true,
    galleryDashboard: true,
    multiArtistCollections: true,
    customBranding: true,
    pdfProposals: true,
  },
  admin: {
    maxArtworks: -1,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    premiumRoomsAccess: true,
    highResExport: true,
    clientFolders: true,
    galleryDashboard: true,
    multiArtistCollections: true,
    customBranding: true,
    pdfProposals: true,
  },
};

export const PLAN_HIERARCHY: Record<PlanType, number> = {
  user: 0,
  artist: 1,
  designer: 2,
  gallery: 3,
  admin: 99,
};

export const PLAN_NAMES: Record<PlanType, string> = {
  user: 'Free',
  artist: 'Artist',
  designer: 'Designer',
  gallery: 'Gallery',
  admin: 'Admin',
};

export interface UserSubscriptionInfo {
  id: number;
  is_admin?: boolean;
  role?: string;
  subscription_status?: string;
  subscription_plan?: string;
}

export function getEffectivePlan(user: UserSubscriptionInfo): PlanType {
  if (user.is_admin) return 'admin';

  const status = user.subscription_status || 'free';
  const plan = (user.subscription_plan || 'user') as PlanType;

  if (status !== 'active' && status !== 'free') {
    return 'user';
  }

  if (!['user', 'artist', 'designer', 'gallery'].includes(plan)) {
    return 'user';
  }

  return plan;
}

export function getPlanLimits(user: UserSubscriptionInfo): PlanLimits {
  const effectivePlan = getEffectivePlan(user);
  return PLAN_LIMITS[effectivePlan];
}

export function canAccessFeature(user: UserSubscriptionInfo, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(user);
  const value = limits[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  return value !== 0;
}

export function getFeatureLimit(user: UserSubscriptionInfo, feature: keyof PlanLimits): number {
  const limits = getPlanLimits(user);
  const value = limits[feature];
  
  if (typeof value === 'number') {
    return value;
  }
  
  return value ? -1 : 0;
}

export function isWithinLimit(user: UserSubscriptionInfo, feature: keyof PlanLimits, currentCount: number): boolean {
  const limit = getFeatureLimit(user, feature);
  
  if (limit === -1) return true;
  
  return currentCount < limit;
}

export function getUpgradeMessage(currentPlan: PlanType, feature: string): { message: string; suggestedPlan: PlanType } {
  const upgradeMap: Record<string, { message: string; suggestedPlan: PlanType }> = {
    maxArtworks: {
      message: currentPlan === 'user' 
        ? "You've reached the limit for the free plan. Upgrade to Artist to upload more artworks."
        : currentPlan === 'artist'
        ? "You've reached your artwork limit. Upgrade to Gallery for up to 500 artworks."
        : "You've reached your artwork limit.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : 'gallery',
    },
    maxWallPhotos: {
      message: "You've reached your wall photo limit. Upgrade to unlock more uploads.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : 'designer',
    },
    maxProjects: {
      message: "You've reached your project limit. Upgrade to create more projects.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : 'designer',
    },
    highResExport: {
      message: "High-resolution exports are available on Artist plan and above. Upgrade to download high-quality images.",
      suggestedPlan: 'artist',
    },
    premiumRoomsAccess: {
      message: "Premium mockup rooms are available on Artist plan and above. Upgrade to access all rooms.",
      suggestedPlan: 'artist',
    },
    clientFolders: {
      message: "Client folders are available on the Designer plan. Upgrade to Designer to unlock this feature.",
      suggestedPlan: 'designer',
    },
    galleryDashboard: {
      message: "The Gallery dashboard is reserved for Gallery plans. Upgrade to Gallery to manage multi-artist collections.",
      suggestedPlan: 'gallery',
    },
    multiArtistCollections: {
      message: "Multi-artist collections are available on Gallery plan. Upgrade to Gallery to unlock this feature.",
      suggestedPlan: 'gallery',
    },
    customBranding: {
      message: "Custom branding on exports is available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    pdfProposals: {
      message: "Professional PDF proposals are available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
  };

  return upgradeMap[feature] || {
    message: "This feature requires a higher subscription plan.",
    suggestedPlan: 'artist',
  };
}
