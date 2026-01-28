export type PlanType = 'free' | 'user' | 'artist' | 'artist_pro' | 'designer' | 'gallery' | 'admin';

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
    maxArtworks: 10,
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
    maxArtworks: 10,
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
    pdfExport: true,
    pdfMonthlyLimit: 10,
    designerTools: false,
    galleryTools: false,
    exhibitions: 1,
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
    highResExport: false,
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
  artist_pro: {
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
    designerTools: false,
    galleryTools: false,
    exhibitions: -1,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
    publicGalleryPages: false,
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
  artist_pro: 2,
  designer: 3,
  gallery: 4,
  admin: 99,
};

export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Free',
  user: 'Free',
  artist: 'Artist',
  artist_pro: 'Artist Pro',
  designer: 'Designer',
  gallery: 'Gallery',
  admin: 'Admin',
};

export const PLAN_PRICES: Record<PlanType, string> = {
  free: 'Free',
  user: 'Free',
  artist: '€9/month',
  artist_pro: '€29/month',
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
  entitlements?: {
    artist_access?: boolean;
    designer_access?: boolean;
    gallery_access?: boolean;
  };
}): PlanType {
  // Prefer server-computed effectivePlan if available
  if (user.effectivePlan) {
    return user.effectivePlan as PlanType;
  }
  
  if (user.isAdmin) return 'admin';

  const status = user.subscriptionStatus || 'free';
  const plan = (user.subscriptionPlan || 'user') as PlanType;

  // Check for cancelled/past_due - fallback to entitlements
  if (status !== 'active' && status !== 'free') {
    if (user.entitlements?.gallery_access) return 'gallery';
    if (user.entitlements?.designer_access) return 'designer';
    if (user.entitlements?.artist_access) return 'artist';
    return 'user';
  }

  // Single entitlement check - priority: gallery > designer > artist
  if (user.entitlements?.gallery_access) return 'gallery';
  if (user.entitlements?.designer_access) return 'designer';
  if (user.entitlements?.artist_access) {
    // Check if artist_pro based on subscription plan
    if (plan === 'artist_pro') return 'artist_pro';
    return 'artist';
  }

  // Fall back to subscription_plan
  if (['user', 'artist', 'artist_pro', 'designer', 'gallery'].includes(plan)) {
    return plan;
  }

  return 'user';
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
        ? "You've reached your 50 artwork limit. Upgrade to Artist Pro for unlimited artworks."
        : currentPlan === 'designer'
        ? "You've reached your 100 artwork limit. Upgrade to Gallery for unlimited artworks."
        : "You've reached your artwork limit.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : currentPlan === 'artist' ? 'artist_pro' : 'gallery',
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
      message: "High-resolution exports (3000px) are available on Artist plan and above. Upgrade to download professional-quality images.",
      suggestedPlan: 'artist',
    },
    pdfExport: {
      message: "PDF exports are available on Artist plan and above.",
      suggestedPlan: 'artist',
    },
    pdfMonthlyLimit: {
      message: "You've reached your monthly PDF export limit. Upgrade to Artist Pro for unlimited PDF exports.",
      suggestedPlan: 'artist_pro',
    },
    premiumRoomsAccess: {
      message: (currentPlan === 'user' || currentPlan === 'artist')
        ? "Premium mockup rooms (100+) are available on the Artist Pro plan. Upgrade to unlock all rooms."
        : "Premium mockup rooms (100+) are available on the Designer plan and above. Upgrade to access all rooms.",
      suggestedPlan: (currentPlan === 'user' || currentPlan === 'artist') ? 'artist_pro' : 'designer',
    },
    maxPremiumRooms: {
      message: currentPlan === 'user' 
        ? "Upgrade to Artist Pro to access premium rooms."
        : currentPlan === 'artist'
        ? "Upgrade to Artist Pro to access all 100+ premium rooms."
        : "Upgrade to access more premium rooms.",
      suggestedPlan: (currentPlan === 'user' || currentPlan === 'artist') ? 'artist_pro' : 'designer',
    },
    designerTools: {
      message: "Designer Studio tools are available on the Designer plan.",
      suggestedPlan: 'designer',
    },
    galleryTools: {
      message: "Gallery tools (multi-art walls, exhibitions) are available on the Gallery plan.",
      suggestedPlan: 'gallery',
    },
    exhibitions: {
      message: currentPlan === 'artist'
        ? "You've reached your limit of 1 exhibition. Upgrade to Artist Pro for unlimited exhibitions."
        : currentPlan === 'gallery'
        ? "You've reached your limit of 3 active exhibitions. Upgrade to Artist Pro for unlimited exhibitions."
        : "Virtual exhibitions are available on Artist and Gallery plans.",
      suggestedPlan: (currentPlan === 'artist' || currentPlan === 'gallery') ? 'artist_pro' : 'artist',
    },
    clientFolders: {
      message: "Client folders are available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    galleryDashboard: {
      message: "The Gallery dashboard is reserved for Gallery plan users.",
      suggestedPlan: 'gallery',
    },
    multiArtistCollections: {
      message: "Multi-artist collections are available on the Gallery plan.",
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
      message: "Public gallery pages are available on Gallery and Artist Pro plans.",
      suggestedPlan: 'gallery',
    },
    prioritySupport: {
      message: "Priority support is available on Artist Pro and Gallery plans.",
      suggestedPlan: 'artist_pro',
    },
    earlyAccess: {
      message: "Early access to new features is available on Artist Pro and Gallery plans.",
      suggestedPlan: 'artist_pro',
    },
  };

  return upgradeMap[feature] || {
    message: "This feature requires a higher subscription plan.",
    suggestedPlan: 'artist',
  };
}
