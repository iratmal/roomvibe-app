export type PlanType = 'free' | 'user' | 'artist' | 'designer' | 'gallery' | 'allaccess' | 'admin';

export type RoomTier = 'basic10' | 'standard40' | 'all';

export interface PlanLimits {
  maxArtworks: number;
  maxWallPhotos: number;
  maxProjects: number;
  maxMockupRooms: number;
  maxPremiumRooms: number;
  roomTier: RoomTier;
  rooms: 'standard' | 'all';
  premiumRoomsAccess: boolean;
  futureRooms: boolean;
  highResExport: boolean;
  pdfExport: boolean;
  pdfMonthlyLimit: number;
  designerTools: boolean;
  galleryTools: boolean;
  exhibitions: number;
  clientFolders: boolean;
  galleryDashboard: boolean;
  multiArtistCollections: boolean;
  customBranding: boolean;
  pdfProposals: boolean;
  publicGalleryPages: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxArtworks: 3,
    maxWallPhotos: 1,
    maxProjects: 1,
    maxMockupRooms: 10,
    maxPremiumRooms: 0,
    roomTier: 'basic10',
    rooms: 'standard',
    premiumRoomsAccess: false,
    futureRooms: false,
    highResExport: false,
    pdfExport: false,
    pdfMonthlyLimit: 0,
    designerTools: false,
    galleryTools: false,
    exhibitions: 0,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
    publicGalleryPages: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  user: {
    maxArtworks: 3,
    maxWallPhotos: 1,
    maxProjects: 1,
    maxMockupRooms: 10,
    maxPremiumRooms: 0,
    roomTier: 'basic10',
    rooms: 'standard',
    premiumRoomsAccess: false,
    futureRooms: false,
    highResExport: false,
    pdfExport: false,
    pdfMonthlyLimit: 0,
    designerTools: false,
    galleryTools: false,
    exhibitions: 0,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
    publicGalleryPages: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  artist: {
    maxArtworks: 50,
    maxWallPhotos: 100,
    maxProjects: 100,
    maxMockupRooms: 40,
    maxPremiumRooms: 0,
    roomTier: 'standard40',
    rooms: 'standard',
    premiumRoomsAccess: false,
    futureRooms: false,
    highResExport: false,
    pdfExport: false,
    pdfMonthlyLimit: 0,
    designerTools: false,
    galleryTools: false,
    exhibitions: 0,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
    publicGalleryPages: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  designer: {
    maxArtworks: 100,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    maxPremiumRooms: -1,
    roomTier: 'all',
    rooms: 'all',
    premiumRoomsAccess: true,
    futureRooms: false,
    highResExport: true,
    pdfExport: true,
    pdfMonthlyLimit: -1,
    designerTools: true,
    galleryTools: false,
    exhibitions: 0,
    clientFolders: true,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: true,
    pdfProposals: true,
    publicGalleryPages: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  gallery: {
    maxArtworks: -1,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    maxPremiumRooms: -1,
    roomTier: 'all',
    rooms: 'all',
    premiumRoomsAccess: true,
    futureRooms: false,
    highResExport: true,
    pdfExport: true,
    pdfMonthlyLimit: 20,
    designerTools: false,
    galleryTools: true,
    exhibitions: 3,
    clientFolders: true,
    galleryDashboard: true,
    multiArtistCollections: true,
    customBranding: true,
    pdfProposals: true,
    publicGalleryPages: true,
    prioritySupport: false,
    earlyAccess: false,
  },
  allaccess: {
    maxArtworks: -1,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    maxPremiumRooms: -1,
    roomTier: 'all',
    rooms: 'all',
    premiumRoomsAccess: true,
    futureRooms: true,
    highResExport: true,
    pdfExport: true,
    pdfMonthlyLimit: -1,
    designerTools: true,
    galleryTools: true,
    exhibitions: -1,
    clientFolders: true,
    galleryDashboard: true,
    multiArtistCollections: true,
    customBranding: true,
    pdfProposals: true,
    publicGalleryPages: true,
    prioritySupport: true,
    earlyAccess: true,
  },
  admin: {
    maxArtworks: -1,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    maxPremiumRooms: -1,
    roomTier: 'all',
    rooms: 'all',
    premiumRoomsAccess: true,
    futureRooms: true,
    highResExport: true,
    pdfExport: true,
    pdfMonthlyLimit: -1,
    designerTools: true,
    galleryTools: true,
    exhibitions: -1,
    clientFolders: true,
    galleryDashboard: true,
    multiArtistCollections: true,
    customBranding: true,
    pdfProposals: true,
    publicGalleryPages: true,
    prioritySupport: true,
    earlyAccess: true,
  },
};

export const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  user: 0,
  artist: 1,
  designer: 2,
  gallery: 3,
  allaccess: 4,
  admin: 99,
};

export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Free',
  user: 'Free',
  artist: 'Artist',
  designer: 'Designer',
  gallery: 'Gallery',
  allaccess: 'All-Access',
  admin: 'Admin',
};

export const PLAN_PRICES: Record<PlanType, string> = {
  free: 'Free',
  user: 'Free',
  artist: '€9/month',
  designer: '€29/month',
  gallery: '€49/month',
  allaccess: '€79/month',
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
  entitlements?: {
    artist_access?: boolean;
    designer_access?: boolean;
    gallery_access?: boolean;
  };
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

  if (user.entitlements?.artist_access && user.entitlements?.designer_access && user.entitlements?.gallery_access) {
    return 'allaccess';
  }

  if (!['user', 'artist', 'designer', 'gallery', 'allaccess'].includes(plan)) {
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
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return value !== 'standard';
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
        ? "You've reached the limit for the free plan. Upgrade to Artist to upload up to 50 artworks."
        : currentPlan === 'artist'
        ? "You've reached your 50 artwork limit. Upgrade to Designer for up to 100 artworks, or Gallery for unlimited."
        : currentPlan === 'designer'
        ? "You've reached your 100 artwork limit. Upgrade to Gallery or All-Access for unlimited artworks."
        : "You've reached your artwork limit.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : currentPlan === 'artist' ? 'designer' : 'gallery',
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
    pdfExport: {
      message: "PDF exports are available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    pdfMonthlyLimit: {
      message: "You've reached your monthly PDF export limit. Upgrade to All-Access for unlimited PDF exports.",
      suggestedPlan: 'allaccess',
    },
    premiumRoomsAccess: {
      message: "Premium mockup rooms (100+) are available on Designer plan and above. Upgrade to access all rooms.",
      suggestedPlan: 'designer',
    },
    maxPremiumRooms: {
      message: currentPlan === 'user' 
        ? "Upgrade to Designer to access premium rooms."
        : currentPlan === 'artist'
        ? "Upgrade to Designer to access all 100+ premium rooms."
        : "Upgrade to access more premium rooms.",
      suggestedPlan: 'designer',
    },
    designerTools: {
      message: "Designer Studio tools are available on Designer and All-Access plans.",
      suggestedPlan: 'designer',
    },
    galleryTools: {
      message: "Gallery tools (multi-art walls, exhibitions) are available on Gallery and All-Access plans.",
      suggestedPlan: 'gallery',
    },
    exhibitions: {
      message: currentPlan === 'gallery'
        ? "You've reached your limit of 3 active exhibitions. Upgrade to All-Access for unlimited exhibitions."
        : "Virtual exhibitions are available on Gallery and All-Access plans.",
      suggestedPlan: currentPlan === 'gallery' ? 'allaccess' : 'gallery',
    },
    clientFolders: {
      message: "Client folders are available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    galleryDashboard: {
      message: "The Gallery dashboard is reserved for Gallery and All-Access plans.",
      suggestedPlan: 'gallery',
    },
    multiArtistCollections: {
      message: "Multi-artist collections are available on Gallery and All-Access plans.",
      suggestedPlan: 'gallery',
    },
    customBranding: {
      message: "Custom branding on exports is available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    pdfProposals: {
      message: "PDF proposals are available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    publicGalleryPages: {
      message: "Public gallery pages are available on Gallery and All-Access plans.",
      suggestedPlan: 'gallery',
    },
    prioritySupport: {
      message: "Priority support is available exclusively on the All-Access plan.",
      suggestedPlan: 'allaccess',
    },
    earlyAccess: {
      message: "Early access to new features is available exclusively on the All-Access plan.",
      suggestedPlan: 'allaccess',
    },
  };

  return upgradeMap[feature] || {
    message: "This feature requires a higher subscription plan.",
    suggestedPlan: 'artist',
  };
}
