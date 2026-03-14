export type PlanType = 'free' | 'user' | 'artist' | 'artist_pro' | 'designer' | 'gallery' | 'admin';

export type RoomTier = 'basic10' | 'standard40' | 'all';

export interface PlanLimits {
  maxArtworks: number;
  /** How many artworks render without a RoomVibe watermark. -1 = unlimited (all clean). */
  cleanArtworksLimit: number;
  /** How many artworks render with a RoomVibe watermark. 0 = none (all clean). */
  watermarkedArtworksLimit: number;
  maxWallPhotos: number;
  maxProjects: number;
  maxMockupRooms: number;
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
  visibleToDesigners?: number;
  visibleToGalleries?: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxArtworks: 10,
    cleanArtworksLimit: 3,
    watermarkedArtworksLimit: 7,
    maxWallPhotos: 1,
    maxProjects: 1,
    maxMockupRooms: 10,
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
    cleanArtworksLimit: 3,
    watermarkedArtworksLimit: 7,
    maxWallPhotos: 1,
    maxProjects: 1,
    maxMockupRooms: 10,
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
    cleanArtworksLimit: -1,
    watermarkedArtworksLimit: 0,
    maxWallPhotos: 100,
    maxProjects: 100,
    maxMockupRooms: 40,
    roomTier: 'standard40',
    rooms: 'standard',
    premiumRoomsAccess: false,
    futureRooms: false,
    highResExport: false,
    pdfExport: true,
    pdfMonthlyLimit: 10,
    designerTools: false,
    galleryTools: false,
    exhibitions: 3,
    clientFolders: false,
    galleryDashboard: false,
    multiArtistCollections: false,
    customBranding: false,
    pdfProposals: false,
    publicGalleryPages: false,
    prioritySupport: false,
    earlyAccess: false,
    visibleToDesigners: 20,
    visibleToGalleries: 20,
  },
  artist_pro: {
    maxArtworks: -1,
    cleanArtworksLimit: -1,
    watermarkedArtworksLimit: 0,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
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
    visibleToDesigners: -1,
    visibleToGalleries: -1,
  },
  designer: {
    maxArtworks: 100,
    cleanArtworksLimit: -1,
    watermarkedArtworksLimit: 0,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
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
    cleanArtworksLimit: -1,
    watermarkedArtworksLimit: 0,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
    roomTier: 'all',
    rooms: 'all',
    premiumRoomsAccess: true,
    futureRooms: false,
    highResExport: true,
    pdfExport: true,
    pdfMonthlyLimit: 20,
    designerTools: false,
    galleryTools: true,
    exhibitions: -1, // Unlimited for Gallery plan
    clientFolders: true,
    galleryDashboard: true,
    multiArtistCollections: true,
    customBranding: true,
    pdfProposals: true,
    publicGalleryPages: true,
    prioritySupport: false,
    earlyAccess: false,
  },
  admin: {
    maxArtworks: -1,
    cleanArtworksLimit: -1,
    watermarkedArtworksLimit: 0,
    maxWallPhotos: -1,
    maxProjects: -1,
    maxMockupRooms: -1,
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

export interface UserSubscriptionInfo {
  id: number;
  is_admin?: boolean;
  role?: string;
  subscription_status?: string;
  subscription_plan?: string;
  artist_access?: boolean;
  designer_access?: boolean;
  gallery_access?: boolean;
}

export function getEffectivePlan(user: UserSubscriptionInfo): PlanType {
  if (user.is_admin) return 'admin';

  const status = user.subscription_status || 'free';
  const plan = (user.subscription_plan || 'user') as PlanType;

  // Calculate effective entitlements (DB flags OR role-based)
  const hasArtist = user.artist_access || user.role === 'artist';
  const hasDesigner = user.designer_access || user.role === 'designer';
  const hasGallery = user.gallery_access || user.role === 'gallery';

  // Check for subscription_plan first - this determines the base plan
  // Artist Pro is a specific subscription, not a combination of entitlements
  if (plan === 'artist_pro') return 'artist_pro';

  // Check for cancelled/past_due subscriptions - fallback to checking entitlements
  if (status !== 'active' && status !== 'free') {
    if (hasGallery) return 'gallery';
    if (hasDesigner) return 'designer';
    if (hasArtist) return 'artist';
    return 'user';
  }

  // Single entitlement check - prioritize gallery > designer > artist
  if (hasGallery) return 'gallery';
  if (hasDesigner) return 'designer';
  if (hasArtist) return 'artist';

  // Fall back to subscription_plan if set
  if (['user', 'artist', 'artist_pro', 'designer', 'gallery'].includes(plan)) {
    return plan;
  }

  return 'user';
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
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return value !== 'standard';
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
      suggestedPlan: currentPlan === 'user' ? 'artist' : 'artist_pro',
    },
    maxProjects: {
      message: "You've reached your project limit. Upgrade to create more projects.",
      suggestedPlan: currentPlan === 'user' ? 'artist' : 'artist_pro',
    },
    highResExport: {
      message: "High-resolution exports are available on Artist Pro and Designer plans. Upgrade to download high-quality 3000px images.",
      suggestedPlan: 'artist_pro',
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
      message: "Premium mockup rooms (100+) are available on Artist Pro and Designer plans. Upgrade to access all rooms.",
      suggestedPlan: 'artist_pro',
    },
    designerTools: {
      message: "Designer Studio tools are available on Designer plan.",
      suggestedPlan: 'designer',
    },
    galleryTools: {
      message: "Gallery tools (multi-art walls, exhibitions) are available on Gallery plan.",
      suggestedPlan: 'gallery',
    },
    exhibitions: {
      message: currentPlan === 'artist'
        ? "You've reached your limit of 3 active exhibitions. Upgrade to Artist Pro for unlimited exhibitions."
        : "Virtual exhibitions are available on Artist and Gallery plans.",
      suggestedPlan: currentPlan === 'artist' ? 'artist_pro' : 'gallery',
    },
    clientFolders: {
      message: "Client folders are available on Designer plan and above.",
      suggestedPlan: 'designer',
    },
    galleryDashboard: {
      message: "The Gallery dashboard is reserved for Gallery plan.",
      suggestedPlan: 'gallery',
    },
    multiArtistCollections: {
      message: "Multi-artist collections are available on Gallery plan.",
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
      message: "Public gallery pages are available on Gallery plan.",
      suggestedPlan: 'gallery',
    },
    prioritySupport: {
      message: "Priority support is available on Artist Pro plan.",
      suggestedPlan: 'artist_pro',
    },
    earlyAccess: {
      message: "Early access to new features is available on Artist Pro plan.",
      suggestedPlan: 'artist_pro',
    },
    visibleToDesigners: {
      message: currentPlan === 'artist'
        ? "You've reached your limit of 20 artworks visible to designers. Upgrade to Artist Pro for unlimited visibility."
        : "This feature requires an Artist or Artist Pro plan.",
      suggestedPlan: 'artist_pro',
    },
    visibleToGalleries: {
      message: currentPlan === 'artist'
        ? "You've reached your limit of 20 artworks visible to galleries. Upgrade to Artist Pro for unlimited visibility."
        : "This feature requires an Artist or Artist Pro plan.",
      suggestedPlan: 'artist_pro',
    },
  };

  return upgradeMap[feature] || {
    message: "This feature requires a higher subscription plan.",
    suggestedPlan: 'artist',
  };
}
