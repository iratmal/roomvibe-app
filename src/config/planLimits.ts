export type PlanType = 'user' | 'artist' | 'designer' | 'gallery' | 'admin';

export interface PlanLimits {
  maxArtworks: number;
  maxWallPhotos: number;
  maxProjects: number;
  maxMockupRooms: number;
  maxPremiumRooms: number;
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
    maxPremiumRooms: 3,
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
    maxPremiumRooms: 30,
    premiumRoomsAccess: true,
    highResExport: false,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: true,
  },
  designer: {
    maxArtworks: -1,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    maxPremiumRooms: -1,
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
    maxPremiumRooms: -1,
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
    maxPremiumRooms: -1,
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

export const PLAN_PRICES: Record<PlanType, string> = {
  user: 'Free',
  artist: '€9/month',
  designer: '€29/month',
  gallery: '€49/month',
  admin: 'N/A',
};

export interface UserPlanInfo {
  effectivePlan: PlanType;
  planLimits: PlanLimits;
  usage?: {
    artworks: number;
    projects: number;
    wallPhotos: number;
  };
  isAdmin?: boolean;
}

export function getEffectivePlan(user: { 
  isAdmin?: boolean; 
  subscriptionStatus?: string; 
  subscriptionPlan?: string;
  effectivePlan?: string;
}): PlanType {
  if (user.effectivePlan) {
    return user.effectivePlan as PlanType;
  }
  
  if (user.isAdmin) return 'admin';

  const status = user.subscriptionStatus || 'free';
  const plan = (user.subscriptionPlan || 'user') as PlanType;

  if (status !== 'active' && status !== 'free') {
    return 'user';
  }

  if (!['user', 'artist', 'designer', 'gallery'].includes(plan)) {
    return 'user';
  }

  return plan;
}

export function getPlanLimits(user: { 
  isAdmin?: boolean; 
  subscriptionStatus?: string; 
  subscriptionPlan?: string;
  effectivePlan?: string;
  planLimits?: PlanLimits;
}): PlanLimits {
  if (user.planLimits) {
    return user.planLimits;
  }
  
  const effectivePlan = getEffectivePlan(user);
  return PLAN_LIMITS[effectivePlan];
}

export function canAccessFeature(user: UserPlanInfo | null, feature: keyof PlanLimits): boolean {
  if (!user) return false;
  
  const limits = user.planLimits || getPlanLimits(user);
  const value = limits[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  return value !== 0;
}

export function isWithinLimit(user: UserPlanInfo | null, feature: keyof PlanLimits): boolean {
  if (!user || !user.usage) return true;
  
  const limits = user.planLimits || getPlanLimits(user);
  const limit = limits[feature];
  
  if (typeof limit !== 'number' || limit === -1) return true;
  
  const usageMap: Partial<Record<keyof PlanLimits, keyof typeof user.usage>> = {
    maxArtworks: 'artworks',
    maxProjects: 'projects',
    maxWallPhotos: 'wallPhotos',
  };
  
  const usageKey = usageMap[feature];
  if (!usageKey) return true;
  
  return user.usage[usageKey] < limit;
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
      message: "High-resolution exports are available on Designer plan and above. Upgrade to download high-quality 3000px images.",
      suggestedPlan: 'designer',
    },
    premiumRoomsAccess: {
      message: "Premium mockup rooms are available on Artist plan and above. Upgrade to access all rooms.",
      suggestedPlan: 'artist',
    },
    maxPremiumRooms: {
      message: currentPlan === 'user' 
        ? "Upgrade to Artist to access more premium rooms (30 rooms)."
        : currentPlan === 'artist'
        ? "Upgrade to Designer to access all 100+ premium rooms."
        : "Upgrade to access more premium rooms.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : 'designer',
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
      message: "Professional PDF proposals are available on Artist plan and above.",
      suggestedPlan: 'artist',
    },
  };

  return upgradeMap[feature] || {
    message: "This feature requires a higher subscription plan.",
    suggestedPlan: 'artist',
  };
}
