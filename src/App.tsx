import React, { useEffect, useRef, useState, useMemo } from "react";
import localArtworks from "./data/artworks.json";
import presets from "./data/presets.json";
import { premiumRooms, getCategoryDisplayName, type PremiumRoom } from "./data/premiumRooms";
import { getSmartScalePlacement, shouldUseSmartScale } from "./lib/studio/smartScale";
import { getTopSuggestedRooms } from "./lib/ai/roomSuggest";
import { PLAN_LIMITS, type PlanType } from "./config/planLimits";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CookieConsentProvider, useCookieConsent } from "./context/CookieConsentContext";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserDashboard } from "./components/dashboards/UserDashboard";
import { ArtistDashboard } from "./components/dashboards/ArtistDashboard";
import { DesignerDashboard } from "./components/dashboards/DesignerDashboard";
import { GalleryDashboard } from "./components/dashboards/GalleryDashboard";
import { AdminDashboard } from "./components/dashboards/AdminDashboard";
import { UnifiedDashboard } from "./components/dashboards/UnifiedDashboard";
import ProjectDetail from "./components/dashboards/ProjectDetail";
import CollectionDetail from "./components/dashboards/CollectionDetail";
import ArtworkEdit from "./components/dashboards/ArtworkEdit";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";
import UploadConsent from "./components/legal/UploadConsent";
import { PricingPage } from "./components/PricingPage";
import { BillingPage } from "./components/BillingPage";
import { Exhibition } from "./pages/Exhibition";
import { UpgradePrompt } from "./components/UpgradePrompt";
import { ComingSoonModal } from "./components/ComingSoonModal";
import { ExportSuccessModal } from "./components/ExportSuccessModal";
import { UpgradeNudge } from "./components/UpgradeNudge";
import { OnboardingPage } from "./components/OnboardingPage";
import { Footer } from "./components/Footer";
import { SiteHeader } from "./components/SiteHeader";
import { initGA4, resetGA4, GA4Events } from "./utils/analytics";
import { initHotjar, resetHotjar } from "./utils/hotjar";
import { getRecommendedUpgradePlan, getUpgradeMessageForFeature, type FeatureKey, type PlanKey } from "./utils/upgradeLogic";

/**
 * RoomVibe — App + Landing + Studio + Authentication
 */

function useHashRoute() {
  const [hash, setHash] = useState<string>(() => window.location.hash || "");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

function useIsInIframe() {
  const [isIframe] = useState<boolean>(() => {
    try {
      return window.self !== window.top;
    } catch {
      return false;
    }
  });
  return isIframe;
}

export default function App() {
  return (
    <AuthProvider>
      <CookieConsentProvider>
        <AppContent />
      </CookieConsentProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const hash = useHashRoute();
  const normalizedHash = hash.split('?')[0].replace(/\/+$/, '');
  const isDashboardRoute = normalizedHash.startsWith("#/dashboard");
  const { consentStatus } = useCookieConsent();

  useEffect(() => {
    if (consentStatus === 'accepted') {
      const ga4Id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
      const hotjarId = import.meta.env.VITE_HOTJAR_ID;
      const hotjarSv = import.meta.env.VITE_HOTJAR_SV;
      
      if (ga4Id) {
        initGA4(ga4Id);
      }
      
      if (hotjarId) {
        const sv = hotjarSv ? parseInt(hotjarSv, 10) : 6;
        initHotjar(parseInt(hotjarId, 10), sv);
      }
    } else {
      // Reset loaded flags when consent is declined or reset
      resetGA4();
      resetHotjar();
    }
  }, [consentStatus]);

  return (
    <div className="min-h-screen bg-white text-rv-text">
      {normalizedHash !== "#/studio" && normalizedHash !== "#/simple" && !isDashboardRoute && normalizedHash !== "#/privacy" && normalizedHash !== "#/terms" && normalizedHash !== "#/upload-consent" && normalizedHash !== "#/pricing" && normalizedHash !== "#/billing" && normalizedHash !== "#/onboarding" && !normalizedHash.startsWith("#/exhibition") && !normalizedHash.startsWith("#/gallery/exhibitions/") && !normalizedHash.startsWith("#/exhibitions/") && <TopNav />}
      {normalizedHash === "#/onboarding" ? (
        <OnboardingRouter />
      ) : normalizedHash === "#/pricing" ? (
        <PricingPage />
      ) : normalizedHash === "#/billing" ? (
        <BillingPage />
      ) : normalizedHash === "#/privacy" ? (
        <PrivacyPolicy />
      ) : normalizedHash === "#/terms" ? (
        <TermsOfService />
      ) : normalizedHash === "#/upload-consent" ? (
        <UploadConsent />
      ) : normalizedHash === "#/studio" ? (
        <Studio />
      ) : normalizedHash === "#/simple" ? (
        <SimpleVisualizer />
      ) : normalizedHash.startsWith("#/exhibition/") ? (
        <Exhibition />
      ) : normalizedHash.startsWith("#/exhibitions/") && normalizedHash.endsWith("/public") ? (
        <PublicExhibitionPage />
      ) : normalizedHash.startsWith("#/gallery/exhibitions/") ? (
        <VirtualExhibitionRoom />
      ) : normalizedHash === "#/docs" ? (
        <DocsPage />
      ) : normalizedHash === "#/login" ? (
        <AuthPage mode="login" />
      ) : normalizedHash === "#/register" ? (
        <AuthPage mode="register" />
      ) : normalizedHash.startsWith("#/dashboard/designer/project/") ? (
        <ProjectDetail />
      ) : normalizedHash.match(/^#\/dashboard\/gallery\/artwork\/\d+\/edit/) ? (
        <ArtworkEdit />
      ) : normalizedHash.startsWith("#/dashboard/gallery/collection/") ? (
        <CollectionDetail />
      ) : normalizedHash === "#/dashboard/artist" ? (
        <RoleDashboardRouter requiredRole="artist" />
      ) : normalizedHash === "#/dashboard/designer" ? (
        <RoleDashboardRouter requiredRole="designer" />
      ) : normalizedHash === "#/dashboard/gallery" ? (
        <RoleDashboardRouter requiredRole="gallery" />
      ) : normalizedHash === "#/dashboard" ? (
        <DashboardRouter />
      ) : (
        <HomePage />
      )}
      {normalizedHash !== "#/simple" && <Footer />}
      <CookieConsentBanner />
    </div>
  );
}

/* ------------- Auth & Dashboard Components ------------- */

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [currentMode, setCurrentMode] = useState(mode);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSuccess = () => {
    window.location.hash = '#/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-white">
      {currentMode === 'login' ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={() => setCurrentMode('register')}
        />
      ) : (
        <RegisterForm
          onSuccess={() => setCurrentMode('login')}
          onSwitchToLogin={() => setCurrentMode('login')}
        />
      )}
    </div>
  );
}

function OnboardingRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rv-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rv-textMuted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  const handleComplete = () => {
    window.location.hash = '#/dashboard';
  };

  return <OnboardingPage onComplete={handleComplete} />;
}

function DashboardRouter() {
  const { user, loading, effectiveRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rv-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rv-textMuted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  // Redirect first-time users to onboarding (skip for admins)
  if (!user.onboardingCompleted && effectiveRole !== 'admin') {
    window.location.hash = '#/onboarding';
    return null;
  }

  // Admin goes to admin dashboard
  if (effectiveRole === 'admin') {
    return <AdminDashboard />;
  }

  // Free users get UserDashboard with basic artwork upload (max 3)
  // Dashboard type is driven by subscription plan, not account type
  const effectivePlan = user?.effectivePlan || 'user';
  const isFreePlan = effectivePlan === 'user' || effectivePlan === 'free';
  
  if (isFreePlan) {
    return <UserDashboard />;
  }

  // Paid users get the unified dashboard with sidebar navigation
  // The sidebar shows modules based on their entitlements
  return <UnifiedDashboard />;
}

function RoleDashboardRouter({ requiredRole }: { requiredRole: string }) {
  const { user, loading, impersonatedRole, setImpersonation, hasEntitlement } = useAuth();

  useEffect(() => {
    const normalizeHash = (hash: string) => {
      return hash.split('?')[0].replace(/\/+$/, '');
    };
    
    const currentHash = normalizeHash(window.location.hash);
    const expectedHash = normalizeHash(`#/dashboard/${requiredRole}`);
    
    if (
      user?.role === 'admin' && 
      impersonatedRole !== requiredRole &&
      currentHash === expectedHash
    ) {
      setImpersonation(requiredRole as 'user' | 'artist' | 'designer' | 'gallery');
    }
  }, [user, requiredRole, impersonatedRole, setImpersonation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rv-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rv-textMuted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  const isAdmin = user.role === 'admin' || user.isAdmin;
  
  // Map role to entitlement
  const entitlementMap: Record<string, 'artist_access' | 'designer_access' | 'gallery_access'> = {
    artist: 'artist_access',
    designer: 'designer_access',
    gallery: 'gallery_access',
  };
  
  const requiredEntitlement = entitlementMap[requiredRole];
  
  // Check access via entitlement system (or admin override)
  const hasAccess = isAdmin || (requiredEntitlement && hasEntitlement(requiredEntitlement));

  if (!hasAccess) {
    window.location.hash = '#/dashboard';
    return null;
  }

  switch (requiredRole) {
    case 'artist':
      return <ArtistDashboard />;
    case 'designer':
      return <DesignerDashboard />;
    case 'gallery':
      return <GalleryDashboard />;
    default:
      window.location.hash = '#/dashboard';
      return null;
  }
}

/* ------------- Layout helper ------------- */

function Container({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/* ------------- Top navigation ------------- */

function TopNav() {
  return <SiteHeader showPlanBadge={false} />;
}

/* ------------- HOMEPAGE ------------- */

function HomePage() {
  return (
    <main className="flex flex-col bg-white pt-16 sm:pt-0">
      {/* Section 1: Hero */}
      <Hero />
      {/* Section 2: User Groups */}
      <UserGroupsSection />
      {/* Section 3: Video Section (moved above How It Works) */}
      <DashboardVideosSection />
      {/* Section 4: How It Works */}
      <HowItWorks />
      {/* Section 5: Mid-Page CTA */}
      <MidPageCTA />
    </main>
  );
}

/* ------------- Hero ------------- */

function Hero() {
  return (
    <section id="home" className="relative w-full overflow-hidden" style={{ backgroundColor: '#faf9f7' }}>
      {/* Full-width background image - DESKTOP ONLY */}
      <div 
        className="hidden md:block absolute inset-0 w-full h-full bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: "url('/serenity-hero-extended.png')",
          backgroundPosition: 'right 10% center'
        }}
      />
      
      {/* Content overlay */}
      <div className="relative mx-auto max-w-7xl px-5 sm:px-12 lg:px-16 lg:pr-24">
        <div className="min-h-0 md:min-h-[700px] lg:min-h-[800px] flex flex-col justify-start pt-0 md:pt-24 lg:pt-28 pb-0 md:pb-40 lg:pb-44">
          {/* Text content */}
          <div className="max-w-full md:max-w-md lg:max-w-lg pt-1 md:pt-0">
            <h1 className="mb-2 md:mb-6 text-2xl md:text-4xl lg:text-[52px] font-bold leading-[1.25] md:leading-[1.3] lg:leading-[1.1] text-[#1A2B3C]">
              See Art in Your<br /> Space. Instantly.
            </h1>

            <p className="mb-2 md:mb-5 text-[15px] md:text-lg leading-[1.45] md:leading-[1.5] lg:leading-[1.4] text-[#1A2B3C]/80 max-w-[320px] md:max-w-sm">
              Preview any artwork on any wall in seconds, with one simple upload.
            </p>

            {/* Desktop buttons - hidden on mobile */}
            <div className="hidden md:flex md:flex-row md:items-center md:gap-4">
              <a href="#/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[#1A2B3C] rounded-lg hover:bg-[#0F1D2A] transition-colors">
                Start Free
              </a>
              <a href="#how" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[#1A2B3C] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                How It Works
              </a>
            </div>
          </div>
          
          {/* Mobile hero image with overlaid buttons - MOBILE ONLY */}
          <div className="md:hidden mt-2 relative">
            <img 
              src="/serenity-hero-extended.png" 
              alt="Art visualization preview" 
              className="w-full max-h-[300px] object-cover object-right"
            />
            {/* Buttons positioned on left side of image (wall area) - stacked vertically */}
            <div className="absolute left-3 top-4 flex flex-col gap-2">
              <a href="#/register" className="inline-flex items-center justify-center px-5 py-2.5 text-[13px] font-semibold text-white bg-[#1A2B3C] rounded-lg hover:bg-[#0F1D2A] transition-colors shadow-lg">
                Start Free
              </a>
              <a href="#how" className="inline-flex items-center justify-center px-5 py-2.5 text-[13px] font-semibold text-[#1A2B3C] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-lg">
                How It Works
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ------------- User Groups Section (Artists/Designers/Galleries) ------------- */

function EaselIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19l4-14h8l4 14" />
      <path d="M8 5h8" />
      <path d="M6 19h12" />
      <path d="M12 5v14" />
      <rect x="7" y="8" width="10" height="6" rx="1" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 8.7l-8.6-8.6c-.4-.4-1-.4-1.4 0L2.7 8.7c-.4.4-.4 1 0 1.4l8.6 8.6c.4.4 1 .4 1.4 0l8.6-8.6c.4-.4.4-1 0-1.4z" />
      <path d="M7.5 7.5L12 12" />
      <path d="M10.5 4.5l2 2" />
      <path d="M13.5 7.5l2 2" />
      <path d="M4.5 10.5l2 2" />
      <path d="M7.5 13.5l2 2" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function UserGroupsSection() {
  const groups = [
    {
      label: "For Artists",
      icon: <EaselIcon />,
      subtitle: "Give your clients the power to see your art in their own space.",
      bodyText: "Add a simple View in Your Room widget to your website and let buyers preview your artwork on their walls before they purchase. No more I am not sure how it will look, they see it instantly, true to size, in their home.\n\nWith premium room mockups and realistic visualizations, your artwork stops being just an image. It becomes part of their life. Increase trust, reduce hesitation, and convert more collectors with ease."
    },
    {
      label: "For Designers",
      icon: <RulerIcon />,
      subtitle: "Upload your client's wall photo and test artworks instantly.",
      bodyText: "No more guessing, see exactly how each piece will look in the actual space before making your recommendation. Try different sizes and artwork options in seconds.\n\nPerfect for interior designers and consultants who want to present polished concepts fast. Impress clients with professional mockups made in under three seconds."
    },
    {
      label: "For Galleries",
      icon: <GalleryIcon />,
      subtitle: "Bring your gallery experience online and open your doors to the world.",
      bodyText: "Traditional offline viewing is no longer enough. Create virtual exhibitions, let collectors preview artworks in curated interiors, and allow international buyers to engage with your collection from anywhere.\n\nStay ahead of the trend, offer a modern and immersive gallery experience without shipping a single piece. Present your artists work in rooms that elevate every collection."
    },
  ];

  return (
    <section className="mt-3 sm:mt-20 mb-6 sm:mb-20 bg-white">
      <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-10 items-stretch">
          {groups.map((g, i) => (
            <div 
              key={i} 
              className="bg-white rounded-xl sm:rounded-[22px] flex flex-col p-5 sm:p-8 lg:p-10"
              style={{
                border: '1px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.05)',
                minHeight: '100%'
              }}
            >
              <div className="flex justify-center mb-4 sm:mb-4">
                {g.icon}
              </div>
              <h3 className="text-xl sm:text-[24px] font-bold text-[var(--rv-primary)] text-center mb-3">
                {g.label}
              </h3>
              <div 
                className="mx-auto mb-6"
                style={{
                  width: '100px',
                  height: '3px',
                  background: 'rgba(212, 175, 55, 0.8)',
                  borderRadius: '3px'
                }}
              ></div>
              <p className="text-base font-semibold text-[var(--rv-primary)] mb-3 leading-snug">
                {g.subtitle}
              </p>
              <p className="text-base text-[#4B5563] leading-[1.55] whitespace-pre-line">
                {g.bodyText}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------- Simple Visualizer ------------- */

function SimpleVisualizer() {
  const [wallImage, setWallImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setWallImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rv-view active" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <div className="rv-visualizer-layout">
        <aside className="rv-toolbar-left">
          <h3>Tools</h3>
          <button className="rv-tool-btn">Move</button>
          <button className="rv-tool-btn">Resize</button>
          <button className="rv-tool-btn">Brightness</button>
          <button className="rv-tool-btn">Reset</button>
          <button className="rv-tool-btn">Before / After</button>
        </aside>

        <section className="rv-canvas-area">
          {!wallImage && (
            <label className="rv-upload-box">
              <input
                type="file"
                accept="image/*"
                className="rv-upload-input"
                onChange={handleFileChange}
              />
              <div className="rv-upload-content">
                <p className="rv-upload-title">Upload Your Wall</p>
                <p className="rv-upload-sub">
                  Click to upload or drag &amp; drop a photo here.
                </p>
              </div>
            </label>
          )}

          {wallImage && (
            <div className="rv-canvas-preview">
              <div className="rv-wall-preview">
                <img src={wallImage} alt="Wall preview" />
                <div className="rv-art-on-wall" />
              </div>
              <p className="rv-canvas-hint">
                Choose an artwork on the right to place it on your wall.
              </p>
            </div>
          )}
        </section>

        <aside className="rv-gallery-right">
          <h3>Artworks</h3>
          <div className="rv-art-list">
            <div className="rv-art-card">
              <div className="rv-art-thumb placeholder" style={{ width: '60px', height: '60px' }} />
              <div className="rv-art-info">
                <p className="rv-art-title">Abstract Energy #1</p>
                <p className="rv-art-meta">120 × 80 cm</p>
              </div>
            </div>
            <div className="rv-art-card">
              <div className="rv-art-thumb placeholder" style={{ width: '60px', height: '60px' }} />
              <div className="rv-art-info">
                <p className="rv-art-title">Good Vibes #3</p>
                <p className="rv-art-meta">100 × 70 cm</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="rv-bottom-bar">
        <button className="rv-btn-primary">Download Preview</button>
        <button className="rv-btn-secondary">Buy on Shopify</button>
      </footer>
    </div>
  );
}

/* ------------- Studio Header (shown when NOT in iframe) ------------- */

function StudioHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rv-neutral bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 md:h-24 items-center justify-between">
          <a href="#/" className="flex items-center">
            <img 
              src="/roomvibe-logo-transparent.png" 
              alt="RoomVibe" 
              className="h-12 sm:h-16 md:h-20 w-auto"
            />
          </a>
          <a
            href="#/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-[#264C61] text-white text-[13px] md:text-sm font-medium rounded-md md:rounded-lg hover:bg-[#1D3A4A] transition-colors min-h-[44px] sm:min-h-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------- Studio (Canvy-style editor) ------------- */

// Real-scale rendering: Standard room wall height is 270cm
// Formula: pxPerCm = canvasHeightPx / 270
const DEFAULT_WALL_HEIGHT_CM = 270;

// Global artwork scale reduction: makes artworks appear ~10% smaller relative to furniture
// This provides more natural proportions without changing the true-to-size logic
const GLOBAL_ARTWORK_SCALE_FACTOR = 0.90;

// Frame configuration system with 12 professional frame styles
type FrameConfig = {
  id: string;
  label: string;
  borderWidth: number;      // Frame border thickness in cm
  borderColor: string;       // Frame border color
  matWidth?: number;         // Optional mat width in cm (for mat frames)
  matColor?: string;         // Optional mat color
  gapWidth?: number;         // Optional gap width in cm (for floating frames)
  gapColor?: string;         // Optional gap/shadow color
  isFloating?: boolean;      // Special flag for floating frame style
  hasMat?: boolean;          // Special flag for mat frame style
};

const FRAME_STYLES: FrameConfig[] = [
  {
    id: "none",
    label: "None",
    borderWidth: 0,
    borderColor: "transparent",
  },
  {
    id: "slim-black",
    label: "Slim Black",
    borderWidth: 1.5,
    borderColor: "#1a1a1a",
  },
  {
    id: "gallery-white",
    label: "Gallery White",
    borderWidth: 2.5,
    borderColor: "#f8f9fa",
  },
  {
    id: "warm-oak",
    label: "Warm Oak",
    borderWidth: 3,
    borderColor: "#b8956a",
  },
  {
    id: "dark-walnut",
    label: "Dark Walnut",
    borderWidth: 3.5,
    borderColor: "#4a3528",
  },
  {
    id: "birch-thin",
    label: "Natural Birch Thin",
    borderWidth: 1.2,
    borderColor: "#e8dcc8",
  },
  {
    id: "bold-black",
    label: "Bold Black",
    borderWidth: 4,
    borderColor: "#0a0a0a",
  },
  {
    id: "soft-white",
    label: "Soft White",
    borderWidth: 2,
    borderColor: "#fefefe",
  },
  {
    id: "brushed-silver",
    label: "Brushed Silver",
    borderWidth: 2.5,
    borderColor: "#b8bdc4",
  },
  {
    id: "champagne-gold",
    label: "Champagne Gold",
    borderWidth: 2.5,
    borderColor: "#d4af6a",
  },
  {
    id: "floating-wood",
    label: "Floating Wood",
    borderWidth: 2.5,
    borderColor: "#a5845f",
    gapWidth: 0.5,
    gapColor: "#f8f9fa",
    isFloating: true,
  },
  {
    id: "black-with-white-mat",
    label: "Black Frame + White Mat",
    borderWidth: 1.5,
    borderColor: "#1a1a1a",
    matWidth: 5,
    matColor: "#ffffff",
    hasMat: true,
  },
];

// Helper to get frame config by ID
const getFrameConfig = (frameId: string): FrameConfig => {
  return FRAME_STYLES.find(f => f.id === frameId) || FRAME_STYLES[0];
};

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

function Studio() {
  const isInIframe = useIsInIframe();
  const { user } = useAuth();
  
  // Admin check - admins bypass ALL restrictions
  const isAdmin = user?.isAdmin || user?.role === 'admin';
  
  // Determine user's effective plan for artwork access
  const effectivePlan = (user?.effectivePlan || 'user') as PlanType;
  // Admin is never treated as free plan
  const isFreePlan = !isAdmin && effectivePlan === 'user';
  
  // Premium rooms access based on plan - admin always has access
  const planLimits = PLAN_LIMITS[effectivePlan];
  const hasPremiumRoomsAccess = isAdmin || planLimits.premiumRoomsAccess;
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState<string>("");
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureKey | null>(null);
  
  // Coming soon modal for premium rooms without images
  const [showComingSoonModal, setShowComingSoonModal] = useState<boolean>(false);
  
  // Category filter for premium rooms
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Filter rooms by plan tier:
  // - Admin: All rooms (no filtering)
  // - Designer/Gallery/All-Access: All rooms (premium access)
  // - Artist: Standard rooms (40 total - includes basicFree)
  // - Free/User: Basic only (10 rooms with basicFree: true)
  const filterRoomsByPlan = (rooms: typeof premiumRooms) => {
    if (isAdmin || hasPremiumRoomsAccess) {
      // Admin and premium users see all rooms
      return rooms;
    }
    if (effectivePlan === 'artist') {
      // Artist sees standard rooms (40 total - includes all basicFree rooms)
      return rooms.filter(room => room.standard === true);
    }
    // Free users see only basic rooms (10 with basicFree: true)
    return rooms.filter(room => room.basicFree === true);
  };
  
  // Filter rooms by selected category AND plan tier
  const roomsFilteredByPlan = filterRoomsByPlan(premiumRooms);
  
  // Derive categories dynamically from the filtered rooms (for Free users, only show categories with basic rooms)
  const availableCategories = Array.from(new Set(roomsFilteredByPlan.map(room => room.category)));
  const categories = ["all", ...availableCategories.sort()];
  
  const filteredPremiumRooms = selectedCategory === "all" 
    ? roomsFilteredByPlan 
    : roomsFilteredByPlan.filter(room => room.category === selectedCategory);
  
  // AI Suggested Rooms - will be computed after art is defined
  // (moved to later in the component where art is available)
  
  // Hide legacy presets for Free users - they should only see the 10 basic rooms from premiumRooms
  // Admin and paid users can see all presets
  const presetsForPlan = isAdmin || effectivePlan !== 'user' ? (presets as any[]) : [];
  const filteredPresets = selectedCategory === "all"
    ? presetsForPlan
    : presetsForPlan.filter((p: any) => p.category === selectedCategory);
  
  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'image' | 'pdf' | null>(null);
  
  // Export success modal state (shown for Free and Artist users only, never for admin)
  const [showExportSuccessModal, setShowExportSuccessModal] = useState<boolean>(false);
  const [exportSuccessType, setExportSuccessType] = useState<'image' | 'pdf'>('image');
  const isArtistPlan = !isAdmin && effectivePlan === 'artist';
  
  // Check if user has high-res export access - admin always has access
  const hasHighResExport = isAdmin || planLimits.highResExport;
  const hasPdfExport = isAdmin || planLimits.pdfExport;
  
  // Helper to show upgrade modal with correct recommended plan
  // Admin users NEVER see upgrade modals
  const showUpgradeFor = (feature: FeatureKey, customMessage?: string) => {
    // Admin bypasses all upgrade prompts
    if (isAdmin) return;
    
    const recommendedPlan = getRecommendedUpgradePlan(effectivePlan as PlanKey, feature);
    if (!recommendedPlan) {
      // User already has access (All-Access or Admin)
      return;
    }
    setUpgradeFeature(feature);
    setUpgradeModalMessage(customMessage || getUpgradeMessageForFeature(feature, recommendedPlan));
    setShowUpgradeModal(true);
  };
  
  // Placeholder artwork for free users - "Whispers of the Ring"
  const placeholderArtwork = (localArtworks as any[]).find((a: any) => a.id === 'whispers-of-the-ring-100-120-cm-roomvibe') || (localArtworks as any[])[0];
  const placeholderArtId = 'whispers-of-the-ring-100-120-cm-roomvibe';
  
  // Check URL params for widget mode or designer mode
  const getInitialState = (): { sceneId: string; isUploadMode: boolean; designerRoomImage: string | null } => {
    try {
      const hash = window.location.hash;
      const queryIndex = hash.indexOf('?');
      if (queryIndex !== -1) {
        const queryString = hash.substring(queryIndex + 1);
        const params = new URLSearchParams(queryString);
        
        // Designer mode: roomImage URL provided
        const roomImage = params.get('roomImage');
        const entry = params.get('entry');
        if (roomImage && entry === 'designer') {
          return { 
            sceneId: '', 
            isUploadMode: true, 
            designerRoomImage: decodeURIComponent(roomImage) 
          };
        }
        
        // Widget upload mode
        if (params.get('mode') === 'upload') {
          return { sceneId: '', isUploadMode: true, designerRoomImage: null };
        }
      }
    } catch (e) {
      console.warn('[Studio] Error reading URL params:', e);
    }
    // Default to first basic free room (Bathroom 7) instead of legacy preset
    const firstFreeRoom = premiumRooms.find(room => room.basicFree === true);
    return { 
      sceneId: '', 
      isUploadMode: false, 
      designerRoomImage: firstFreeRoom?.image || null 
    };
  };

  const initialState = getInitialState();
  const [sceneId, setSceneId] = useState<string>(initialState.sceneId);
  const [wallColor, setWallColor] = useState<string>("#f2f4f7");
  const [userPhoto, setUserPhoto] = useState<string | null>(initialState.designerRoomImage);
  const [isUploadMode, setIsUploadMode] = useState<boolean>(initialState.isUploadMode);

  // Artworks array - user's artworks + sample artworks
  const [artworksState, setArtworksState] = useState<any[]>(localArtworks as any[]);
  const [userArtworks, setUserArtworks] = useState<any[]>([]);
  const [hasLoadedUserArtworks, setHasLoadedUserArtworks] = useState<boolean>(false);
  const [artId, setArtId] = useState<string>("whispers-of-the-ring-100-120-cm-roomvibe");
  const artIdRef = useRef<string>(artId);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch user's artworks from API when logged in
  useEffect(() => {
    const fetchUserArtworks = async () => {
      if (!user) {
        setUserArtworks([]);
        setHasLoadedUserArtworks(true);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/artist/mine`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.artworks && data.artworks.length > 0) {
            // Transform image URLs to include API_URL if needed
            const transformedArtworks = data.artworks.map((artwork: any) => ({
              ...artwork,
              overlayImageUrl: artwork.overlayImageUrl?.startsWith('http') 
                ? artwork.overlayImageUrl 
                : `${API_URL}${artwork.overlayImageUrl}`
            }));
            setUserArtworks(transformedArtworks);
            
            // Set first user artwork as selected if user has artworks
            if (transformedArtworks.length > 0 && !isFreePlan) {
              setArtId(transformedArtworks[0].id);
            }
          }
        }
      } catch (error) {
        console.warn('[Studio] Failed to fetch user artworks:', error);
      } finally {
        setHasLoadedUserArtworks(true);
      }
    };
    
    fetchUserArtworks();
  }, [user]);
  
  // Combine user artworks (first) with sample artworks
  useEffect(() => {
    if (hasLoadedUserArtworks) {
      if (userArtworks.length > 0) {
        // User has uploaded artworks - show them first, then sample artworks
        setArtworksState([...userArtworks, ...(localArtworks as any[])]);
      } else {
        // No user artworks - show sample artworks
        setArtworksState(localArtworks as any[]);
      }
    }
  }, [userArtworks, hasLoadedUserArtworks]);
  
  useEffect(() => {
    const loadArtworkFromUrl = async () => {
      // Free users are restricted to placeholder artwork only
      // Skip URL-based artwork loading for free users
      if (isFreePlan) {
        return;
      }
      
      try {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex === -1) return;
        
        const queryString = hash.substring(queryIndex + 1);
        const params = new URLSearchParams(queryString);
        const artworkIdParam = params.get('artworkId');
        
        if (!artworkIdParam) return;
        
        const existsInLocal = (localArtworks as any[]).some((a: any) => a.id === artworkIdParam);
        if (existsInLocal) {
          setArtId(artworkIdParam);
          return;
        }
        
        const numericId = parseInt(artworkIdParam);
        if (!isNaN(numericId)) {
          setIsLoadingArtwork(true);
          try {
            // Use public artwork endpoint (no auth required for widget)
            const response = await fetch(`${API_URL}/api/artwork/${numericId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.artwork) {
                const dbArtwork = {
                  ...data.artwork,
                  overlayImageUrl: data.artwork.overlayImageUrl.startsWith('http') 
                    ? data.artwork.overlayImageUrl 
                    : `${API_URL}${data.artwork.overlayImageUrl}`
                };
                setArtworksState(prev => [dbArtwork, ...prev]);
                setArtId(dbArtwork.id);
              }
            }
          } catch (err) {
            console.warn('[Studio] Failed to fetch artwork from API:', err);
          } finally {
            setIsLoadingArtwork(false);
          }
        }
      } catch (e) {
        console.warn('[Studio] Error loading artwork from URL:', e);
      }
    };
    
    loadArtworkFromUrl();
  }, [isFreePlan]);
  
  // Enforce placeholder artwork for free users
  useEffect(() => {
    if (isFreePlan && artId !== placeholderArtId) {
      setArtId(placeholderArtId);
    }
  }, [isFreePlan, artId, placeholderArtId]);
  
  // For free users, always use placeholder artwork regardless of state
  const effectiveArtId = isFreePlan ? placeholderArtId : artId;
  const art = artworksState.find((a) => a.id === effectiveArtId);
  
  // AI Suggested Rooms - get top 3 rooms based on artwork tags, title keywords, or ID-based variation
  // useMemo ensures recalculation when artwork or filtered rooms change
  const aiSuggestedRooms = useMemo(() => {
    return getTopSuggestedRooms(art?.tags, roomsFilteredByPlan, 3, art?.title, art?.id);
  }, [art?.id, art?.tags, art?.title, roomsFilteredByPlan]);

  const [frameStyle, setFrameStyle] = useState<string>("none");
  
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [pxPerCm, setPxPerCm] = useState<number>(2); // pixels per centimeter ratio
  const [scale, setScale] = useState<number>(1.0); // artwork scale multiplier (1.0 = 100%)
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeCorner, setResizeCorner] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; startScale: number } | null>(null);
  
  // Selection state
  const [isArtworkSelected, setIsArtworkSelected] = useState<boolean>(false);
  
  // Pinch-to-zoom state
  const [isPinching, setIsPinching] = useState<boolean>(false);
  const pinchStartRef = useRef<{ distance: number; startScale: number } | null>(null);
  
  // Mobile touch direction detection - determines if touch is scroll (vertical) or drag (horizontal)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchDirectionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);
  const TOUCH_DIRECTION_THRESHOLD = 8; // pixels to determine direction

  // Track Studio visit on mount
  useEffect(() => {
    GA4Events.visitStudio();
  }, []);

  useEffect(() => {
    artIdRef.current = artId;
    
    // Track artwork change
    if (art) {
      GA4Events.changeArtwork(art.id);
    }
  }, [artId, art]);

  // Smart Scale: Apply intelligent sizing when room or artwork changes
  const [smartScaleEnabled, setSmartScaleEnabled] = useState<boolean>(true);

  // Get scaleFactor from active scene (FREE preset or Premium room via userPhoto)
  const getActiveScaleFactor = (): number => {
    // Check if we have a FREE scene selected
    if (scene?.scaleFactor) {
      return scene.scaleFactor;
    }
    // Check if we have a Premium room selected (userPhoto contains the image path)
    if (userPhoto && userPhoto.startsWith('/rooms/')) {
      const premiumRoom = premiumRooms.find(r => r.image === userPhoto);
      if (premiumRoom?.scaleFactor) {
        return premiumRoom.scaleFactor;
      }
    }
    // Default: no scaling adjustment
    return 1.0;
  };

  // Calculate px/cm ratio for true-to-size rendering
  // Uses canvas HEIGHT and standard wall height (270cm), then applies per-scene scaleFactor
  // Also applies GLOBAL_ARTWORK_SCALE_FACTOR for more natural proportions vs furniture
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvasHeightPx = canvasRef.current.clientHeight;
    const basePxPerCm = canvasHeightPx / DEFAULT_WALL_HEIGHT_CM;
    const sceneScale = getActiveScaleFactor();
    const ratio = basePxPerCm * sceneScale * GLOBAL_ARTWORK_SCALE_FACTOR;
    
    setPxPerCm(ratio);
    
    if (import.meta.env.DEV) {
      console.log(`[Real-Scale] canvasHeight=${canvasHeightPx}px, wallHeight=${DEFAULT_WALL_HEIGHT_CM}cm, sceneScale=${sceneScale}, globalScale=${GLOBAL_ARTWORK_SCALE_FACTOR}, pxPerCm=${ratio.toFixed(3)}`);
    }
  }, [sceneId, userPhoto, canvasRef.current?.clientHeight]);

  // Smart Scale: Apply intelligent sizing when room or artwork changes
  useEffect(() => {
    if (!smartScaleEnabled) return;
    if (!canvasRef.current) return;
    if (!art) return;
    if (pxPerCm <= 0) return;
    
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;
    
    if (canvasWidth === 0 || canvasHeight === 0) return;
    
    const currentRoom = userPhoto?.startsWith('/rooms/') 
      ? premiumRooms.find(r => r.image === userPhoto)
      : null;
    
    if (currentRoom && shouldUseSmartScale(currentRoom)) {
      const placement = getSmartScalePlacement(
        art.widthCm || 100,
        art.heightCm || 70,
        currentRoom,
        canvasWidth,
        canvasHeight,
        pxPerCm
      );
      
      setScale(placement.scale);
      setOffsetX(placement.offsetX);
      setOffsetY(placement.offsetY);
      
      if (import.meta.env.DEV) {
        console.log('[Smart Scale] Applied:', {
          room: currentRoom.id,
          artwork: art.id,
          scale: placement.scale.toFixed(2),
          offsetX: placement.offsetX,
          offsetY: placement.offsetY
        });
      }
    } else {
      setScale(1.0);
      setOffsetX(0);
      setOffsetY(0);
    }
  }, [art?.id, art?.widthCm, art?.heightCm, userPhoto, smartScaleEnabled, pxPerCm]);

  const fileRef = useRef<HTMLInputElement | null>(null);

  // In upload mode (empty sceneId), don't fall back to first preset - show upload prompt instead
  const scene: any = sceneId ? ((presets as any).find((p: any) => p.id === sceneId) || (presets as any)[0]) : null;
  const safe = scene?.safeArea || { x: 0.5, y: 0.4, w: 0.6, h: 0.5 };

  // Real-scale artwork dimensions in pixels (with scale multiplier)
  const artworkWidthCm = art?.widthCm || 100;
  const artworkHeightCm = art?.heightCm || 70;
  const baseArtworkWidthPx = artworkWidthCm * pxPerCm;
  const baseArtworkHeightPx = artworkHeightCm * pxPerCm;
  const artworkWidthPx = baseArtworkWidthPx * scale;
  const artworkHeightPx = baseArtworkHeightPx * scale;

  // Get frame configuration
  const frameConfig = getFrameConfig(frameStyle);
  
  // Calculate frame, mat, and gap dimensions in pixels
  const frameBorderPx = frameConfig.borderWidth * pxPerCm;
  const matWidthPx = (frameConfig.matWidth || 0) * pxPerCm;
  const gapWidthPx = (frameConfig.gapWidth || 0) * pxPerCm;
  
  // For mat frames: mat is an additional layer OUTSIDE the artwork (not a reduction)
  // For floating frames: gap is BETWEEN artwork and border
  // For basic frames: just the border
  
  // Total dimensions calculation:
  // - Basic frame: artwork + border * 2
  // - Floating frame: artwork + gap * 2 + border * 2
  // - Mat frame: artwork + mat * 2 + border * 2
  let totalWidthPx: number;
  let totalHeightPx: number;
  let totalFrameThicknessPx: number;
  
  if (frameConfig.hasMat) {
    // Mat frame: border + mat around artwork at full size
    totalFrameThicknessPx = frameBorderPx + matWidthPx;
    totalWidthPx = artworkWidthPx + totalFrameThicknessPx * 2;
    totalHeightPx = artworkHeightPx + totalFrameThicknessPx * 2;
  } else if (frameConfig.isFloating) {
    // Floating frame: border + gap around artwork
    totalFrameThicknessPx = frameBorderPx + gapWidthPx;
    totalWidthPx = artworkWidthPx + totalFrameThicknessPx * 2;
    totalHeightPx = artworkHeightPx + totalFrameThicknessPx * 2;
  } else {
    // Basic frame: just border
    totalFrameThicknessPx = frameBorderPx;
    totalWidthPx = artworkWidthPx + totalFrameThicknessPx * 2;
    totalHeightPx = artworkHeightPx + totalFrameThicknessPx * 2;
  }

  // Store latest values in refs for drag handlers
  const artworkWidthPxRef = useRef(artworkWidthPx);
  const artworkHeightPxRef = useRef(artworkHeightPx);
  const totalWidthPxRef = useRef(totalWidthPx);
  const totalHeightPxRef = useRef(totalHeightPx);
  const safeRef = useRef(safe);
  
  useEffect(() => {
    artworkWidthPxRef.current = artworkWidthPx;
    artworkHeightPxRef.current = artworkHeightPx;
    totalWidthPxRef.current = totalWidthPx;
    totalHeightPxRef.current = totalHeightPx;
    safeRef.current = safe;
  }, [artworkWidthPx, artworkHeightPx, totalWidthPx, totalHeightPx, safe]);

  // Re-clamp offsets when artwork size or frame changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;
    
    const padding = 20;
    const safeCenterX = safe.x * canvasWidth;
    const safeCenterY = safe.y * canvasHeight;
    
    // Calculate bounds: artwork (including frame) can move across entire wall
    const maxOffsetX = (canvasWidth - padding) - safeCenterX - totalWidthPx / 2;
    const minOffsetX = padding - safeCenterX + totalWidthPx / 2;
    const maxOffsetY = (canvasHeight - padding) - safeCenterY - totalHeightPx / 2;
    const minOffsetY = padding - safeCenterY + totalHeightPx / 2;
    
    // Clamp current offsets if they're out of bounds
    const clampedX = Math.max(minOffsetX, Math.min(maxOffsetX, offsetX));
    const clampedY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));
    
    if (clampedX !== offsetX || clampedY !== offsetY) {
      setOffsetX(clampedX);
      setOffsetY(clampedY);
    }
  }, [totalWidthPx, totalHeightPx, sceneId, frameStyle]);

  const dragAnimationRef = useRef<number | null>(null);
  const targetOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);
  
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX - offsetX, y: clientY - offsetY };
    lastDragPositionRef.current = { x: clientX, y: clientY };
    targetOffsetRef.current = { x: offsetX, y: offsetY };
    
    // For touch events, don't activate dragging immediately - wait to detect direction
    if ('touches' in e) {
      touchStartPosRef.current = { x: clientX, y: clientY };
      touchDirectionLockedRef.current = null;
      isDraggingRef.current = false; // Will be set to true once horizontal direction is confirmed
    } else {
      // Mouse events: activate drag immediately (desktop)
      isDraggingRef.current = true;
    }
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    const isTouch = 'touches' in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    // For touch events: detect direction before committing to drag
    if (isTouch) {
      // If already locked to vertical scroll, let it scroll
      if (touchDirectionLockedRef.current === 'vertical') {
        return;
      }
      
      // If direction not yet determined, detect it
      if (touchStartPosRef.current && !touchDirectionLockedRef.current) {
        const deltaX = Math.abs(clientX - touchStartPosRef.current.x);
        const deltaY = Math.abs(clientY - touchStartPosRef.current.y);
        
        // Wait until we have enough movement to determine direction
        if (deltaX < TOUCH_DIRECTION_THRESHOLD && deltaY < TOUCH_DIRECTION_THRESHOLD) {
          return; // Not enough movement yet
        }
        
        // Determine direction: vertical means scroll, horizontal means drag
        if (deltaY > deltaX) {
          // Vertical movement dominant → allow scroll, don't drag
          touchDirectionLockedRef.current = 'vertical';
          touchStartPosRef.current = null;
          dragStartRef.current = null;
          return; // Let browser handle scroll
        } else {
          // Horizontal movement dominant → activate drag and prevent scroll
          touchDirectionLockedRef.current = 'horizontal';
          isDraggingRef.current = true;
          e.preventDefault();
        }
      }
    }
    
    // Standard drag handling (for mouse or confirmed horizontal touch)
    if (!isDraggingRef.current || !dragStartRef.current || !canvasRef.current) return;
    e.preventDefault();
    
    // Apply small movement threshold to reduce jitter (1px minimum total movement)
    const lastPos = lastDragPositionRef.current;
    if (lastPos) {
      const totalMovement = Math.hypot(clientX - lastPos.x, clientY - lastPos.y);
      if (totalMovement < 1) return;
    }
    lastDragPositionRef.current = { x: clientX, y: clientY };
    
    const newOffsetX = clientX - dragStartRef.current.x;
    const newOffsetY = clientY - dragStartRef.current.y;
    
    // Measure actual canvas dimensions from DOM (responsive layout)
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;
    
    // Use full canvas as bounding box with small padding (20px)
    const padding = 20;
    const safeCenterX = safeRef.current.x * canvasWidth;
    const safeCenterY = safeRef.current.y * canvasHeight;
    
    // Calculate bounds: artwork (including frame) can move across entire wall
    const maxOffsetX = (canvasWidth - padding) - safeCenterX - totalWidthPxRef.current / 2;
    const minOffsetX = padding - safeCenterX + totalWidthPxRef.current / 2;
    const maxOffsetY = (canvasHeight - padding) - safeCenterY - totalHeightPxRef.current / 2;
    const minOffsetY = padding - safeCenterY + totalHeightPxRef.current / 2;
    
    const clampedX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX));
    const clampedY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY));
    
    // Store target position for smooth animation
    targetOffsetRef.current = { x: clampedX, y: clampedY };
    
    // Use requestAnimationFrame for smooth updates
    if (dragAnimationRef.current === null) {
      dragAnimationRef.current = requestAnimationFrame(() => {
        setOffsetX(targetOffsetRef.current.x);
        setOffsetY(targetOffsetRef.current.y);
        dragAnimationRef.current = null;
      });
    }
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    lastDragPositionRef.current = null;
    // Reset touch direction tracking
    touchStartPosRef.current = null;
    touchDirectionLockedRef.current = null;
    if (dragAnimationRef.current !== null) {
      cancelAnimationFrame(dragAnimationRef.current);
      dragAnimationRef.current = null;
    }
    // Apply final position
    setOffsetX(targetOffsetRef.current.x);
    setOffsetY(targetOffsetRef.current.y);
  };

  const resetPosition = () => {
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = { 
      x: clientX, 
      y: clientY, 
      startScale: scale 
    };
    setResizeCorner(corner);
    setIsResizing(true);
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing || !resizeStartRef.current || !resizeCorner || !canvasRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStartRef.current.x;
    const deltaY = clientY - resizeStartRef.current.y;
    
    // Calculate diagonal delta based on resize corner
    let diagonalDelta = 0;
    
    switch (resizeCorner) {
      case 'se': // Bottom-right: positive X and Y increase size
        diagonalDelta = (deltaX + deltaY) / Math.sqrt(2);
        break;
      case 'sw': // Bottom-left: negative X and positive Y increase size
        diagonalDelta = (-deltaX + deltaY) / Math.sqrt(2);
        break;
      case 'ne': // Top-right: positive X and negative Y increase size
        diagonalDelta = (deltaX - deltaY) / Math.sqrt(2);
        break;
      case 'nw': // Top-left: negative X and negative Y increase size
        diagonalDelta = (-deltaX - deltaY) / Math.sqrt(2);
        break;
    }
    
    // Convert pixel delta to scale change (sensitivity: 1px = 0.002 scale)
    const scaleChange = diagonalDelta * 0.002;
    let newScale = resizeStartRef.current.startScale + scaleChange;
    
    // Apply smart limits based on room type
    if (userPhoto) {
      // User-uploaded room: allow wider range (30% - 300%)
      newScale = Math.max(0.3, Math.min(3.0, newScale));
    } else {
      // Mockup rooms (room01-room10): limited range (70% - 130%)
      newScale = Math.max(0.7, Math.min(1.3, newScale));
    }
    
    setScale(newScale);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeCorner(null);
    resizeStartRef.current = null;
  };

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two-finger pinch detected
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      pinchStartRef.current = {
        distance,
        startScale: scale
      };
      setIsPinching(true);
    }
  };

  const handlePinchMove = (e: TouchEvent) => {
    if (!isPinching || !pinchStartRef.current || e.touches.length !== 2) return;
    e.preventDefault();
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    // Add slight damping for smoother pinch-to-zoom
    const scaleChange = distance / pinchStartRef.current.distance;
    const dampedScaleChange = 1 + (scaleChange - 1) * 0.85; // 15% damping
    let newScale = pinchStartRef.current.startScale * dampedScaleChange;
    
    // Apply smart limits based on room type
    if (userPhoto) {
      newScale = Math.max(0.3, Math.min(3.0, newScale));
    } else {
      newScale = Math.max(0.7, Math.min(1.3, newScale));
    }
    
    setScale(newScale);
  };

  const handlePinchEnd = () => {
    setIsPinching(false);
    pinchStartRef.current = null;
  };

  // Click artwork to select
  const handleArtworkClick = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length === 2) {
      // Don't select on pinch
      return;
    }
    setIsArtworkSelected(true);
  };

  // Click outside to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsArtworkSelected(false);
    }
  };

  // Export visualization to high-resolution image
  const exportToImage = async (highRes: boolean = false) => {
    if (!canvasRef.current || !art) return;
    
    // Check plan access for high-res (Designer+ only)
    if (highRes && !hasHighResExport) {
      showUpgradeFor('highResExport');
      return;
    }
    
    setIsExporting(true);
    setExportType('image');
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Get current canvas dimensions
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasWidth = canvasRect.width;
      const canvasHeight = canvasRect.height;
      const aspectRatio = canvasWidth / canvasHeight;
      
      // Set output resolution
      const targetSize = highRes ? 3000 : 1280;
      let outputWidth: number, outputHeight: number;
      
      if (aspectRatio > 1) {
        outputWidth = targetSize;
        outputHeight = Math.round(targetSize / aspectRatio);
      } else {
        outputHeight = targetSize;
        outputWidth = Math.round(targetSize * aspectRatio);
      }
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      // Scale factor for rendering
      const scaleFactor = outputWidth / canvasWidth;
      
      // Load and draw background image
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      const bgSrc = userPhoto || (scene?.photo || '');
      
      await new Promise<void>((resolve, reject) => {
        bgImage.onload = () => resolve();
        bgImage.onerror = () => reject(new Error('Failed to load background'));
        bgImage.src = bgSrc;
      });
      
      // Draw background to cover canvas
      const bgAspect = bgImage.width / bgImage.height;
      const canvasAspect = outputWidth / outputHeight;
      let drawWidth, drawHeight, drawX, drawY;
      
      if (bgAspect > canvasAspect) {
        drawHeight = outputHeight;
        drawWidth = drawHeight * bgAspect;
        drawX = (outputWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = outputWidth;
        drawHeight = drawWidth / bgAspect;
        drawX = 0;
        drawY = (outputHeight - drawHeight) / 2;
      }
      
      ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
      
      // Calculate artwork position and size at export resolution
      const scaledArtworkWidth = artworkWidthPx * scaleFactor;
      const scaledArtworkHeight = artworkHeightPx * scaleFactor;
      const scaledTotalWidth = totalWidthPx * scaleFactor;
      const scaledTotalHeight = totalHeightPx * scaleFactor;
      const scaledFrameBorder = frameBorderPx * scaleFactor;
      const scaledMatWidth = matWidthPx * scaleFactor;
      const scaledGapWidth = gapWidthPx * scaleFactor;
      
      // Position based on safe area + offset
      const centerX = (safe.x * outputWidth) + (offsetX * scaleFactor);
      const centerY = (safe.y * outputHeight) + (offsetY * scaleFactor);
      const frameX = centerX - scaledTotalWidth / 2;
      const frameY = centerY - scaledTotalHeight / 2;
      
      // Load artwork image
      const artImage = new Image();
      artImage.crossOrigin = 'anonymous';
      const artSrc = art.overlayImageUrl || art.imageUrl || '';
      
      await new Promise<void>((resolve, reject) => {
        artImage.onload = () => resolve();
        artImage.onerror = () => reject(new Error('Failed to load artwork'));
        artImage.src = artSrc;
      });
      
      // Draw frame and artwork
      const frameConfig = getFrameConfig(frameStyle);
      
      // Draw frame shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 30 * scaleFactor;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 15 * scaleFactor;
      ctx.fillStyle = frameConfig.borderColor || '#333';
      ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
      ctx.restore();
      
      if (frameConfig.hasMat) {
        // Draw frame border
        ctx.fillStyle = frameConfig.borderColor || '#333';
        ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
        
        // Draw mat
        ctx.fillStyle = frameConfig.matColor || '#f5f5f0';
        ctx.fillRect(
          frameX + scaledFrameBorder,
          frameY + scaledFrameBorder,
          scaledTotalWidth - scaledFrameBorder * 2,
          scaledTotalHeight - scaledFrameBorder * 2
        );
        
        // Draw artwork
        const artX = frameX + scaledFrameBorder + scaledMatWidth;
        const artY = frameY + scaledFrameBorder + scaledMatWidth;
        ctx.drawImage(artImage, artX, artY, scaledArtworkWidth, scaledArtworkHeight);
      } else if (frameConfig.isFloating) {
        // Floating frame
        ctx.fillStyle = frameConfig.borderColor || '#333';
        ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
        
        // Gap
        ctx.fillStyle = frameConfig.gapColor || '#fff';
        ctx.fillRect(
          frameX + scaledFrameBorder,
          frameY + scaledFrameBorder,
          scaledTotalWidth - scaledFrameBorder * 2,
          scaledTotalHeight - scaledFrameBorder * 2
        );
        
        // Artwork
        const artX = frameX + scaledFrameBorder + scaledGapWidth;
        const artY = frameY + scaledFrameBorder + scaledGapWidth;
        ctx.drawImage(artImage, artX, artY, scaledArtworkWidth, scaledArtworkHeight);
      } else if (frameConfig.borderWidth > 0) {
        // Standard frame
        ctx.fillStyle = frameConfig.borderColor || '#333';
        ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
        
        // Artwork
        const artX = frameX + scaledFrameBorder;
        const artY = frameY + scaledFrameBorder;
        ctx.drawImage(artImage, artX, artY, scaledArtworkWidth, scaledArtworkHeight);
      } else {
        // No frame
        ctx.drawImage(artImage, frameX, frameY, scaledArtworkWidth, scaledArtworkHeight);
      }
      
      // Add watermark for FREE users only (on regular download)
      if (!highRes && isFreePlan) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `bold ${Math.round(18 * scaleFactor)}px Inter, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        const watermarkText = 'RoomVibe – Upgrade for High-Res';
        const padding = 20 * scaleFactor;
        const textMetrics = ctx.measureText(watermarkText);
        
        // Background for watermark
        ctx.fillStyle = 'rgba(40, 53, 147, 0.9)';
        ctx.fillRect(
          outputWidth - textMetrics.width - padding * 2,
          outputHeight - 40 * scaleFactor,
          textMetrics.width + padding * 2,
          40 * scaleFactor
        );
        
        // Watermark text
        ctx.fillStyle = '#fff';
        ctx.fillText(watermarkText, outputWidth - padding, outputHeight - 12 * scaleFactor);
        ctx.restore();
      }
      
      // Download the image
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `roomvibe-${art.title?.replace(/\s+/g, '-').toLowerCase() || 'visualization'}-${highRes ? 'highres' : 'preview'}.png`;
      link.href = dataUrl;
      link.click();
      
      // Show success modal for Free and Artist users only (not for Designer/Gallery/Admin)
      if (isFreePlan || isArtistPlan) {
        setExportSuccessType('image');
        setShowExportSuccessModal(true);
      }
      
    } catch (err) {
      console.error('[Export] Failed to export image:', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Export visualization to PDF
  const exportToPdf = async () => {
    if (!canvasRef.current || !art) return;
    
    // Check plan access for PDF (Designer+ has PDF export)
    if (!hasPdfExport) {
      showUpgradeFor('pdfExport');
      return;
    }
    
    // Track PDF export with API for monthly limit enforcement
    try {
      const trackResponse = await fetch(`${API_URL}/api/exports/pdf/track`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!trackResponse.ok) {
        const errorData = await trackResponse.json();
        if (trackResponse.status === 403) {
          // Monthly limit reached - show upgrade to All-Access
          showUpgradeFor('unlimitedPDF', errorData.message);
          return;
        }
        // For other errors, log and continue
        console.warn('[Export] PDF tracking returned error:', errorData);
      }
    } catch (err) {
      console.warn('[Export] Could not track PDF export:', err);
      // Continue with export even if tracking fails
    }
    
    setIsExporting(true);
    setExportType('pdf');
    
    try {
      // Dynamic import jsPDF
      const { jsPDF } = await import('jspdf');
      
      // First generate high-res image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasWidth = canvasRect.width;
      const canvasHeight = canvasRect.height;
      const aspectRatio = canvasWidth / canvasHeight;
      
      const targetSize = 2400;
      let outputWidth: number, outputHeight: number;
      
      if (aspectRatio > 1) {
        outputWidth = targetSize;
        outputHeight = Math.round(targetSize / aspectRatio);
      } else {
        outputHeight = targetSize;
        outputWidth = Math.round(targetSize * aspectRatio);
      }
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      const scaleFactor = outputWidth / canvasWidth;
      
      // Load and draw background
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      const bgSrc = userPhoto || (scene?.photo || '');
      
      await new Promise<void>((resolve, reject) => {
        bgImage.onload = () => resolve();
        bgImage.onerror = () => reject(new Error('Failed to load background'));
        bgImage.src = bgSrc;
      });
      
      const bgAspect = bgImage.width / bgImage.height;
      const canvasAspect = outputWidth / outputHeight;
      let drawWidth, drawHeight, drawX, drawY;
      
      if (bgAspect > canvasAspect) {
        drawHeight = outputHeight;
        drawWidth = drawHeight * bgAspect;
        drawX = (outputWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = outputWidth;
        drawHeight = drawWidth / bgAspect;
        drawX = 0;
        drawY = (outputHeight - drawHeight) / 2;
      }
      
      ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
      
      // Calculate artwork position
      const scaledArtworkWidth = artworkWidthPx * scaleFactor;
      const scaledArtworkHeight = artworkHeightPx * scaleFactor;
      const scaledTotalWidth = totalWidthPx * scaleFactor;
      const scaledTotalHeight = totalHeightPx * scaleFactor;
      const scaledFrameBorder = frameBorderPx * scaleFactor;
      const scaledMatWidth = matWidthPx * scaleFactor;
      const scaledGapWidth = gapWidthPx * scaleFactor;
      
      const centerX = (safe.x * outputWidth) + (offsetX * scaleFactor);
      const centerY = (safe.y * outputHeight) + (offsetY * scaleFactor);
      const frameX = centerX - scaledTotalWidth / 2;
      const frameY = centerY - scaledTotalHeight / 2;
      
      // Load artwork
      const artImage = new Image();
      artImage.crossOrigin = 'anonymous';
      const artSrc = art.overlayImageUrl || art.imageUrl || '';
      
      await new Promise<void>((resolve, reject) => {
        artImage.onload = () => resolve();
        artImage.onerror = () => reject(new Error('Failed to load artwork'));
        artImage.src = artSrc;
      });
      
      // Draw frame and artwork (same logic as image export)
      const frameConfig = getFrameConfig(frameStyle);
      
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 30 * scaleFactor;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 15 * scaleFactor;
      ctx.fillStyle = frameConfig.borderColor || '#333';
      ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
      ctx.restore();
      
      if (frameConfig.hasMat) {
        ctx.fillStyle = frameConfig.borderColor || '#333';
        ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
        ctx.fillStyle = frameConfig.matColor || '#f5f5f0';
        ctx.fillRect(frameX + scaledFrameBorder, frameY + scaledFrameBorder, scaledTotalWidth - scaledFrameBorder * 2, scaledTotalHeight - scaledFrameBorder * 2);
        ctx.drawImage(artImage, frameX + scaledFrameBorder + scaledMatWidth, frameY + scaledFrameBorder + scaledMatWidth, scaledArtworkWidth, scaledArtworkHeight);
      } else if (frameConfig.isFloating) {
        ctx.fillStyle = frameConfig.borderColor || '#333';
        ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
        ctx.fillStyle = frameConfig.gapColor || '#fff';
        ctx.fillRect(frameX + scaledFrameBorder, frameY + scaledFrameBorder, scaledTotalWidth - scaledFrameBorder * 2, scaledTotalHeight - scaledFrameBorder * 2);
        ctx.drawImage(artImage, frameX + scaledFrameBorder + scaledGapWidth, frameY + scaledFrameBorder + scaledGapWidth, scaledArtworkWidth, scaledArtworkHeight);
      } else if (frameConfig.borderWidth > 0) {
        ctx.fillStyle = frameConfig.borderColor || '#333';
        ctx.fillRect(frameX, frameY, scaledTotalWidth, scaledTotalHeight);
        ctx.drawImage(artImage, frameX + scaledFrameBorder, frameY + scaledFrameBorder, scaledArtworkWidth, scaledArtworkHeight);
      } else {
        ctx.drawImage(artImage, frameX, frameY, scaledArtworkWidth, scaledArtworkHeight);
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: aspectRatio > 1 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      // Calculate image dimensions to fit page with margin
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2 - 15; // Extra space for caption
      
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = margin;
      
      // Add image to PDF
      pdf.addImage(dataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      
      // Add caption at bottom
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const caption = `${art.title || 'Artwork'} • ${Math.round(art.widthCm * scale)} × ${Math.round(art.heightCm * scale)} cm • RoomVibe Visualization`;
      pdf.text(caption, pageWidth / 2, imgY + imgHeight + 8, { align: 'center' });
      
      // Save PDF
      pdf.save(`roomvibe-${art.title?.replace(/\s+/g, '-').toLowerCase() || 'visualization'}.pdf`);
      
      // Note: PDF export is only available for Designer+ plans, so no success modal needed
      // (Designer and above users don't need upgrade encouragement)
      
    } catch (err) {
      console.error('[Export] Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  useEffect(() => {
    const options = { passive: false };
    
    // Drag and resize event listeners
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, options);
    window.addEventListener('touchend', handleDragEnd);
    
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove, options);
    window.addEventListener('touchend', handleResizeEnd);
    
    // Pinch-to-zoom event listeners
    window.addEventListener('touchmove', handlePinchMove, options);
    window.addEventListener('touchend', handlePinchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove, options as any);
      window.removeEventListener('touchend', handleDragEnd);
      
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove, options as any);
      window.removeEventListener('touchend', handleResizeEnd);
      
      window.removeEventListener('touchmove', handlePinchMove, options as any);
      window.removeEventListener('touchend', handlePinchEnd);
    };
  }, [isResizing, isPinching, userPhoto]);

  return (
    <main className="flex flex-col">
      {!isInIframe && <SiteHeader showPlanBadge={false} />}
      <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 lg:min-h-[calc(100vh-80px)] lg:flex lg:flex-col">
        <div className="mb-4 text-sm text-rv-textMuted">
          <span className="font-semibold text-rv-primary">RoomVibe Studio</span> · Upload a wall photo, pick a room preset, and see your art true-to-size.
        </div>
        <div className="grid grid-cols-12 gap-4 lg:gap-6 lg:flex-1">
          {/* Left: Scenes gallery - Shown last on mobile (order-3), first on desktop (lg:order-1) */}
          <aside className="order-3 lg:order-1 col-span-12 lg:col-span-3 rounded-rvLg border border-rv-neutral bg-white shadow-rvSoft p-4 h-auto lg:h-[calc(100vh-140px)] flex flex-col">
            {/* Fixed header section */}
            <div className="flex-shrink-0">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold text-rv-textMuted uppercase tracking-wide">Scenes</div>
                <a href="#home" className="text-xs font-medium text-rv-textMuted hover:text-rv-primary transition-colors">
                  Home
                </a>
              </div>
              
              {/* Category Filter Pills */}
              <div className="mb-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shadow-sm ${
                      selectedCategory === cat
                        ? "bg-[#264C61] text-white shadow-md"
                        : "bg-white text-[#264C61] border-2 border-[#264C61]/20 hover:border-[#264C61]/50 hover:bg-[#264C61]/5"
                    }`}
                  >
                    {cat === "all" ? "All" : getCategoryDisplayName(cat)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Scrollable room list */}
            <div className="flex-1 overflow-y-auto lg:overflow-y-auto overflow-x-hidden">
              {/* AI Suggested Rooms Section */}
              {selectedCategory === "all" && aiSuggestedRooms.length > 0 && (
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#C9A24A]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L14.09 8.26L22 9.27L16 14.14L18.18 21.02L12 17.77L5.82 21.02L8 14.14L2 9.27L9.91 8.26L12 2Z"/>
                    </svg>
                    <span className="text-[10px] font-semibold text-[#264C61] uppercase tracking-wide">AI Suggested Rooms</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 mb-2">Powered by RoomVibe AI</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {aiSuggestedRooms.map((room) => (
                      <button
                        key={`suggested-${room.id}`}
                        onClick={() => {
                          setUserPhoto(room.image);
                          setSceneId('');
                        }}
                        className="group relative overflow-hidden rounded-rvMd bg-white shadow-sm hover:shadow-md transition-all ring-1 ring-[#C9A24A]/30 hover:ring-[#C9A24A]"
                      >
                        <div 
                          className="h-14 w-full bg-cover bg-center bg-[#F7F3EE]"
                          style={{ backgroundImage: `url(${room.image})` }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Unified Room Grid - Free presets first, then premium rooms */}
              <div className="grid grid-cols-2 gap-2.5">
              {/* Free Presets */}
              {filteredPresets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setUserPhoto(null);
                    setSceneId(p.id);
                  }}
                  className={`group relative overflow-hidden rounded-rvMd border ${
                    sceneId === p.id ? "border-rv-primary ring-1 ring-rv-primary/30" : "border-rv-neutral hover:border-rv-primary/40"
                  } bg-white shadow-sm hover:shadow-md transition-all`}
                >
                  <img src={p.photo} alt={p.name} className="h-20 w-full object-cover" />
                </button>
              ))}
              
              {/* Rooms filtered by plan - users only see rooms they have access to */}
              {filteredPremiumRooms.map((room) => {
                // Rooms are now pre-filtered by plan, so no locking needed
                const isLocked = false;
                // Basic and standard rooms get clean thumbnails (no gold badges)
                const hasCleanThumbnail = room.basicFree === true || room.standard === true;
                
                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      if (isLocked) {
                        showUpgradeFor('premiumRooms');
                      } else {
                        setUserPhoto(room.image);
                        setSceneId('');
                      }
                    }}
                    className={`group relative overflow-hidden rounded-rvMd bg-white shadow-sm hover:shadow-md transition-all ${
                      isLocked ? "opacity-70" : ""
                    }`}
                    style={{ border: isLocked ? '1.5px solid #D8B46A' : '1px solid #DDE1E7' }}
                  >
                    <div 
                      className="h-20 w-full bg-cover bg-center bg-[#F7F3EE]"
                      style={{ backgroundImage: `url(${room.image})` }}
                    />
                    
                    {/* Premium star badge - hidden for basic and standard rooms */}
                    {!hasCleanThumbnail && (
                      <div className="absolute top-1.5 left-1.5">
                        <div className="bg-[#D8B46A] rounded-full p-1 shadow-sm">
                          <svg className="h-2 w-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Locked overlay with gold-styled lock */}
                    {isLocked && (
                      <div className="absolute top-1.5 right-1.5">
                        <div className="bg-[#D8B46A] rounded-full p-1 shadow-sm">
                          <svg className="h-2 w-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Room name label - hidden for basic and standard rooms (clean thumbnails) */}
                    {!hasCleanThumbnail && (
                      <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 text-[9px] font-medium ${
                        isLocked ? "bg-[#264C61]/80 text-white" : "bg-gradient-to-t from-[#D8B46A]/80 to-[#D8B46A]/60 text-white"
                      }`}>
                        {room.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Empty state when no rooms match filter */}
            {filteredPresets.length === 0 && filteredPremiumRooms.length === 0 && (
              <div className="py-8 text-center text-[11px] text-rv-textMuted">
                No rooms found in {getCategoryDisplayName(selectedCategory)}
              </div>
            )}
            
              {/* Upgrade button for Free and Artist users - shown under every category */}
              {!isAdmin && (isFreePlan || isArtistPlan) && (
                <div className="mt-3 mb-4">
                  <button
                    onClick={() => showUpgradeFor(isFreePlan ? 'standardRooms' : 'premiumRooms')}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-[#264C61] transition-all hover:bg-[rgba(38,76,97,0.06)]"
                    style={{ border: '1.5px solid #D8B46A' }}
                  >
                    {isFreePlan 
                      ? "Upgrade for More Rooms"
                      : "Unlock 100+ Premium Rooms → Upgrade"
                    }
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Center: Canvas - Shown first on mobile (order-1), middle on desktop (lg:order-2) */}
          <section className="order-1 lg:order-2 col-span-12 lg:col-span-6">
            <div className="rounded-rvLg border border-rv-neutral bg-white shadow-rvSoft">
              <div className="flex items-center justify-between border-b border-rv-neutral px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-rv-primary font-semibold">
                  <RoomIcon className="h-4 w-4" /> {userPhoto ? 'Your Wall' : scene?.name || 'Upload Your Wall'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-rvMd border border-rv-neutral bg-white px-3 py-1.5 text-xs font-medium text-rv-text hover:bg-rv-surface hover:border-rv-primary/30 transition-all"
                    onClick={() => fileRef.current?.click()}
                  >
                    Upload wall photo
                  </button>
                  {userPhoto && (
                    <button className="text-xs font-medium text-rv-textMuted hover:text-rv-primary transition-colors" onClick={() => setUserPhoto(null)}>
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = URL.createObjectURL(f);
                        setUserPhoto(url);
                        GA4Events.uploadWall();
                      }
                    }}
                  />
                </div>
              </div>

              <div 
                ref={canvasRef} 
                className="relative h-[400px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden rounded-b-rvLg"
                style={{ touchAction: 'pan-y' }}
                onClick={handleCanvasClick}
              >
                {userPhoto ? (
                  <img src={userPhoto} alt="Your wall" className="absolute inset-0 h-full w-full object-cover" style={{ pointerEvents: 'none' }} />
                ) : scene ? (
                  <img src={scene.photo} alt={scene.name} className="absolute inset-0 h-full w-full object-cover" style={{ pointerEvents: 'none' }} />
                ) : (
                  /* Upload mode: Show upload prompt when no room selected */
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-rv-surface to-white cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                  >
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rv-primary/10 flex items-center justify-center">
                        <svg className="w-10 h-10 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-rv-text mb-2">Upload your wall photo</h3>
                      <p className="text-rv-textMuted text-sm mb-6 max-w-xs mx-auto">
                        Take a photo of your wall and see how this artwork looks in your space
                      </p>
                      <button
                        className="px-6 py-3 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors shadow-rvSoft"
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      >
                        Choose Photo
                      </button>
                      <p className="text-rv-textMuted text-xs mt-4">
                        Or select a preset room from the panel below
                      </p>
                    </div>
                  </div>
                )}
                {/* Frame container - only show when there's a background (user photo or preset room) */}
                {(userPhoto || scene) && (
                <div
                  className={frameConfig.id === "none" ? "rounded-md shadow-2xl" : "shadow-2xl"}
                  style={{ 
                    position: "absolute",
                    left: `calc(${safe.x * 100}% + ${offsetX}px)`, 
                    top: `calc(${safe.y * 100}% + ${offsetY}px)`, 
                    transform: "translate(-50%, -50%)",
                    width: `${totalWidthPx}px`,
                    height: `${totalHeightPx}px`,
                    cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                    boxSizing: "border-box",
                    boxShadow: frameConfig.borderWidth >= 3 
                      ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                      : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    overflow: "visible",
                    outline: isArtworkSelected ? '3px solid rgba(40, 53, 147, 0.6)' : 'none',
                    outlineOffset: '4px',
                    transition: 'outline 0.15s ease-in-out',
                    touchAction: 'pan-y',
                  }}
                  onMouseDown={handleDragStart}
                  onTouchStart={(e) => {
                    handleTouchStart(e);
                    if (e.touches.length === 1) {
                      handleDragStart(e);
                    }
                  }}
                  onClick={handleArtworkClick}
                >
                  {/* Floating frame outer border */}
                  {frameConfig.isFloating && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderWidth: `${frameBorderPx}px`,
                        borderStyle: "solid",
                        borderColor: frameConfig.borderColor,
                        boxSizing: "border-box",
                        boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.15)', // Subtle depth
                      }}
                    />
                  )}
                  
                  {/* Mat frame structure */}
                  {frameConfig.hasMat ? (
                    <>
                      {/* Outer frame border */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderWidth: `${frameBorderPx}px`,
                          borderStyle: "solid",
                          borderColor: frameConfig.borderColor,
                          boxSizing: "border-box",
                        }}
                      />
                      {/* Mat layer */}
                      <div
                        style={{
                          position: "absolute",
                          inset: `${frameBorderPx}px`,
                          backgroundColor: frameConfig.matColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.08)', // Subtle mat depth
                        }}
                      >
                        {/* Artwork at actual size */}
                        <div className="overflow-hidden" style={{ width: `${artworkWidthPx}px`, height: `${artworkHeightPx}px` }}>
                          {art?.imageUrl || art?.overlayImageUrl ? (
                            <img 
                              src={art.overlayImageUrl || art.imageUrl} 
                              alt={art.title} 
                              style={{
                                width: `${artworkWidthPx}px`,
                                height: `${artworkHeightPx}px`,
                                display: "block",
                                objectFit: "cover"
                              }} 
                              draggable={false} 
                            />
                          ) : (
                            <div
                              style={{
                                width: `${artworkWidthPx}px`,
                                height: `${artworkHeightPx}px`,
                                background: "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </>
                  ) : frameConfig.isFloating ? (
                    /* Floating frame: gap + artwork */
                    <div
                      style={{
                        position: "absolute",
                        inset: `${frameBorderPx}px`,
                        backgroundColor: frameConfig.gapColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div className="overflow-hidden" style={{ width: `${artworkWidthPx}px`, height: `${artworkHeightPx}px`, margin: `${gapWidthPx}px` }}>
                        {art?.imageUrl || art?.overlayImageUrl ? (
                          <img 
                            src={art.overlayImageUrl || art.imageUrl} 
                            alt={art.title} 
                            style={{
                              width: `${artworkWidthPx}px`,
                              height: `${artworkHeightPx}px`,
                              display: "block",
                              objectFit: "cover"
                            }} 
                            draggable={false} 
                          />
                        ) : (
                          <div
                            style={{
                              width: `${artworkWidthPx}px`,
                              height: `${artworkHeightPx}px`,
                              background: "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Basic frame: border + artwork */
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderWidth: frameConfig.id === "none" ? 0 : `${frameBorderPx}px`,
                        borderStyle: frameConfig.id === "none" ? "none" : "solid",
                        borderColor: frameConfig.borderColor,
                        backgroundColor: "#f8fafc",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div className={frameConfig.id === "none" ? "overflow-hidden rounded-md" : "overflow-hidden"} style={{ width: `${artworkWidthPx}px`, height: `${artworkHeightPx}px` }}>
                        {art?.imageUrl || art?.overlayImageUrl ? (
                          <img 
                            src={art.overlayImageUrl || art.imageUrl} 
                            alt={art.title} 
                            style={{
                              width: `${artworkWidthPx}px`,
                              height: `${artworkHeightPx}px`,
                              display: "block",
                              objectFit: "cover"
                            }} 
                            draggable={false} 
                          />
                        ) : (
                          <div
                            style={{
                              width: `${artworkWidthPx}px`,
                              height: `${artworkHeightPx}px`,
                              background: "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Resize handles - visible only when selected */}
                  {isArtworkSelected && (
                    <>
                      {/* Top-left corner - outer div is touch target, inner div is visual */}
                      <div
                        className="absolute w-10 h-10 flex items-center justify-center cursor-nw-resize"
                        style={{ 
                          top: `-${totalFrameThicknessPx + 16}px`,
                          left: `-${totalFrameThicknessPx + 16}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                        onTouchStart={(e) => handleResizeStart(e, 'nw')}
                      >
                        <div className="w-3 h-3 bg-white border-2 border-rv-primary rounded-sm shadow-sm" />
                      </div>
                      
                      {/* Top-right corner */}
                      <div
                        className="absolute w-10 h-10 flex items-center justify-center cursor-ne-resize"
                        style={{ 
                          top: `-${totalFrameThicknessPx + 16}px`,
                          right: `-${totalFrameThicknessPx + 16}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                        onTouchStart={(e) => handleResizeStart(e, 'ne')}
                      >
                        <div className="w-3 h-3 bg-white border-2 border-rv-primary rounded-sm shadow-sm" />
                      </div>
                      
                      {/* Bottom-left corner */}
                      <div
                        className="absolute w-10 h-10 flex items-center justify-center cursor-sw-resize"
                        style={{ 
                          bottom: `-${totalFrameThicknessPx + 16}px`,
                          left: `-${totalFrameThicknessPx + 16}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                        onTouchStart={(e) => handleResizeStart(e, 'sw')}
                      >
                        <div className="w-3 h-3 bg-white border-2 border-rv-primary rounded-sm shadow-sm" />
                      </div>
                      
                      {/* Bottom-right corner */}
                      <div
                        className="absolute w-10 h-10 flex items-center justify-center cursor-se-resize"
                        style={{ 
                          bottom: `-${totalFrameThicknessPx + 16}px`,
                          right: `-${totalFrameThicknessPx + 16}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                        onTouchStart={(e) => handleResizeStart(e, 'se')}
                      >
                        <div className="w-3 h-3 bg-white border-2 border-rv-primary rounded-sm shadow-sm" />
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>
            </div>
          </section>

          {/* Right: Controls - Shown second on mobile (order-2), last on desktop (lg:order-3) */}
          <aside className="order-2 lg:order-3 col-span-12 lg:col-span-3 rounded-rvLg border border-rv-neutral bg-white shadow-rvSoft p-4 lg:p-5 min-h-[200px] h-auto lg:h-[calc(100vh-140px)] flex flex-col">
            {/* Scrollable settings section */}
            <div className="flex-1 overflow-y-auto lg:overflow-y-auto space-y-5 lg:pr-1">
              <div className="text-xs font-semibold text-rv-textMuted uppercase tracking-wide">Artwork</div>
            
            {/* Free users: Show limited artwork gallery with lock */}
            {isFreePlan ? (
              <div className="-mt-3">
                {/* Show only the first artwork for free users */}
                <div className="space-y-2">
                  {artworksState.slice(0, 1).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setArtId(a.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-rvMd border-2 transition-all text-left ${
                        artId === a.id
                          ? "border-rv-primary bg-rv-primary/5"
                          : "border-rv-neutral bg-white hover:bg-rv-surface"
                      }`}
                    >
                      <div className="w-12 h-12 rounded bg-rv-surface overflow-hidden flex-shrink-0">
                        <img 
                          src={a.overlayImageUrl} 
                          alt={a.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-rv-text truncate">{a.title}</p>
                        <p className="text-xs text-rv-textMuted">{a.widthCm} × {a.heightCm} cm</p>
                      </div>
                    </button>
                  ))}
                  
                  {/* Locked artworks indicator */}
                  {artworksState.length > 1 && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-rvMd border-2 border-dashed border-rv-neutral bg-rv-surface/50 hover:bg-rv-surface transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded bg-rv-neutral/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-rv-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-rv-primary">+{artworksState.length - 1} more artworks</p>
                        <p className="text-xs text-rv-textMuted">Upgrade to unlock all artworks</p>
                      </div>
                      <svg className="w-5 h-5 text-rv-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Paid users: Show artwork selector with user's artworks first */
              <div className="-mt-3 space-y-3">
                {/* Show prompt if logged in but no user artworks */}
                {user && userArtworks.length === 0 && hasLoadedUserArtworks && (
                  <div className="p-3 bg-rv-surface/50 rounded-rvMd border border-dashed border-rv-neutral">
                    <p className="text-sm text-rv-textMuted mb-2">
                      You don't have any artworks yet.
                    </p>
                    <a
                      href="#/dashboard"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-rv-primary hover:text-rv-primaryHover transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Go to Dashboard to upload
                    </a>
                  </div>
                )}
                
                {/* Artwork dropdown */}
                <select
                  className="w-full rounded-rvMd border border-rv-neutral px-3 py-2.5 text-sm font-medium text-rv-text bg-white focus:outline-none focus:ring-2 focus:ring-rv-primary/20 focus:border-rv-primary transition-all"
                  value={artId}
                  onChange={(e) => setArtId(e.target.value)}
                >
                  {/* User's artworks section */}
                  {userArtworks.length > 0 && (
                    <optgroup label="My Artworks">
                      {userArtworks.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {/* Sample artworks section */}
                  <optgroup label="Sample Artworks">
                    {(localArtworks as any[]).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            
            {art && art.widthCm && art.heightCm && (
              <div className="-mt-3 p-3 bg-rv-surface/50 rounded-rvMd">
                <div className="text-xs text-rv-textMuted">
                  Original: <span className="font-medium text-rv-text">{art.widthCm} × {art.heightCm} cm</span>
                </div>
                <div className="mt-1 text-xs text-rv-textMuted">
                  Display: <span className="font-medium text-rv-primary">{Math.round(art.widthCm * scale)} × {Math.round(art.heightCm * scale)} cm</span>
                </div>
              </div>
            )}
            

            <div>
              <div className="text-xs font-semibold text-rv-textMuted uppercase tracking-wide mb-3">Frame</div>
              <div className="grid grid-cols-2 gap-2.5 text-xs max-h-[240px] overflow-y-auto pr-1">
              {FRAME_STYLES.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setFrameStyle(frame.id)}
                  className={`rounded-rvMd border px-3 py-2.5 font-medium transition-all text-left min-h-[44px] flex items-center ${
                    frameStyle === frame.id
                      ? "border-rv-primary bg-rv-primary/5 text-rv-primary ring-1 ring-rv-primary/20"
                      : "border-rv-neutral bg-white text-rv-text hover:bg-rv-surface hover:border-rv-primary/30"
                  }`}
                >
                  {frame.label}
                </button>
              ))}
              </div>
            </div>

              <div className="pt-2 border-t border-rv-neutral/50">
                <button
                  onClick={resetPosition}
                  className="text-xs font-medium text-rv-textMuted hover:text-rv-primary transition-colors"
                >
                  Reset position & size
                </button>
              </div>
            </div>

            {/* Export Section - Pinned at bottom on desktop */}
            <div className="flex-shrink-0 pt-4 lg:pt-4 lg:border-t lg:border-rv-neutral/50 space-y-3">
              <div className="text-xs font-semibold text-rv-textMuted uppercase tracking-wide">Export</div>
              
              {/* Download Button (1200px) */}
              <div className="space-y-1">
                <button
                  onClick={() => exportToImage(false)}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-[#264C61] transition-all disabled:opacity-50 hover:bg-[rgba(38,76,97,0.06)]"
                  style={{ border: '1.5px solid #264C61' }}
                >
                  {isExporting && exportType === 'image' ? (
                    <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  Download
                </button>
                <p className="text-xs text-[#666] text-center">
                  (1200 px {!isFreePlan ? '· no watermark' : '· watermark on free plan'})
                </p>
              </div>
              
              {/* High-Resolution Download Button (3000px - Designer+) */}
              <div className="space-y-1">
                <button
                  onClick={() => exportToImage(true)}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-[#264C61] transition-all disabled:opacity-50 hover:bg-[rgba(38,76,97,0.06)]"
                  style={{ border: '1.5px solid #D8B46A' }}
                >
                  {isExporting && exportType === 'image' ? (
                    <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : !hasHighResExport ? (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  High-Resolution Download
                </button>
                <p className="text-xs text-[#666] text-center">
                  (3000 px · no watermark · Designer feature)
                </p>
              </div>
              
              {/* PDF Export - Styled Button */}
              <div className="space-y-1">
                <button
                  onClick={exportToPdf}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-[#264C61] transition-all disabled:opacity-50 hover:bg-[rgba(38,76,97,0.06)]"
                  style={{ border: '1.5px solid #D8B46A' }}
                >
                  {isExporting && exportType === 'pdf' ? (
                    <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : !hasPdfExport ? (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  PDF Export
                </button>
                <p className="text-xs text-[#666] text-center">
                  (Printer-ready quality)
                </p>
              </div>
              
              {/* Upgrade CTA for Free Users */}
              {isFreePlan && (
                <button
                  onClick={() => showUpgradeFor('watermarkRemoval')}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-[#264C61] transition-all hover:bg-[rgba(38,76,97,0.06)]"
                  style={{ border: '1.5px solid #D8B46A' }}
                >
                  Unlock High-Resolution Export → Upgrade
                </button>
              )}
              
              {/* Upgrade hint for Basic (Artist) users about High-Res */}
              {isArtistPlan && !hasHighResExport && (
                <button
                  onClick={() => showUpgradeFor('highResExport')}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-[#264C61] transition-all hover:bg-[rgba(38,76,97,0.06)]"
                  style={{ border: '1.5px solid #D8B46A' }}
                >
                  Unlock High-Resolution → Upgrade to Designer
                </button>
              )}
              
              {/* View & Buy Button - properly spaced below upgrade CTA */}
              {art && (
                <a
                  href={(art as any).buyUrl || (art as any).onlineStoreUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => GA4Events.buyClick((art as any).buyUrl || (art as any).onlineStoreUrl || "#")}
                  className="inline-flex w-full items-center justify-center rounded-rvMd bg-rv-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rv-primaryHover hover:shadow-md transition-all mt-2"
                >
                  View &amp; Buy
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
      
      {/* Upgrade Modal for Free Users */}
      {showUpgradeModal && (
        <UpgradePrompt
          variant="modal"
          message={upgradeModalMessage || "Unlock access to our full collection of sample artworks to see how different styles look in your space. Upgrade now to explore all artwork options!"}
          currentPlan={effectivePlan}
          suggestedPlan={upgradeFeature ? (getRecommendedUpgradePlan(effectivePlan as PlanKey, upgradeFeature) || 'artist') : (effectivePlan === 'user' ? 'artist' : 'designer')}
          onClose={() => {
            setShowUpgradeModal(false);
            setUpgradeModalMessage("");
            setUpgradeFeature(null);
          }}
        />
      )}
      
      {/* Coming Soon Modal for Premium Rooms */}
      {showComingSoonModal && (
        <ComingSoonModal
          onClose={() => setShowComingSoonModal(false)}
        />
      )}
      
      {/* Export Success Modal (for Free and Artist users only) */}
      <ExportSuccessModal
        isOpen={showExportSuccessModal}
        onClose={() => setShowExportSuccessModal(false)}
        onUpgrade={() => {
          setShowExportSuccessModal(false);
          window.location.hash = '#/pricing';
        }}
        currentPlan={effectivePlan}
        exportType={exportSuccessType}
      />
    </main>
  );
}


/* ------------- How it works ------------- */

function HowItWorksIcon({ type }: { type: 'upload' | 'add' | 'see' }) {
  if (type === 'upload') {
    return (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'add') {
    return (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" strokeLinecap="round" />
      <path d="M12 8h.01" strokeLinecap="round" />
      <path d="M9 9l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HowItWorks() {
  const steps = [
    { 
      icon: <HowItWorksIcon type="upload" />, 
      title: "Upload Your Space", 
      desc: "Take a quick photo of your wall, or upload one from your device. No measuring needed, just capture the space." 
    },
    { 
      icon: <HowItWorksIcon type="add" />, 
      title: "Add the Artwork", 
      desc: "Upload your artwork image, choose the size and frame, and place it on the wall in seconds. Test different pieces until the room feels just right." 
    },
    { 
      icon: <HowItWorksIcon type="see" />, 
      title: "See It. Feel It. Choose It.", 
      desc: "Compare options side by side, share realistic previews and make decisions with confidence. Buyers see exactly how the art fits the room before saying yes." 
    },
  ];
  
  return (
    <section id="how" className="py-8 sm:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((s, i) => (
            <div 
              key={i} 
              className={`bg-[#FAFAFA] rounded-xl sm:rounded-[16px] p-5 sm:p-8 text-center flex flex-col items-center gap-2 sm:gap-3 ${i === 0 ? 'mt-6 sm:mt-0' : ''}`}
            >
              <div className="w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-[#F0F0F0] flex items-center justify-center text-[#264C61]">
                <span className="scale-100">{s.icon}</span>
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-[#1A1A1A] tracking-tight">
                {s.title}
              </h3>
              <p className="text-sm lg:text-[15px] text-[#555] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------- Dashboard Videos Section ------------- */

function DashboardVideosSection() {
  const videos = [
    {
      title: "Artist Dashboard Overview",
      description: "See how artists manage their artworks and embed the visualization widget.",
      thumbnail: "/hero.png"
    },
    {
      title: "Designer Tools in Action",
      description: "Watch how designers upload client spaces and create stunning presentations.",
      thumbnail: "/hero.png"
    },
    {
      title: "Gallery Virtual Exhibitions",
      description: "Explore how galleries curate and publish online collections.",
      thumbnail: "/hero.png"
    },
  ];

  return (
    <section className="mt-8 sm:mt-0 py-8 sm:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-8 items-stretch">
          {videos.map((v, i) => (
            <div key={i} className="flex flex-col">
              {/* Thumbnail */}
              <div className="relative aspect-video max-h-[240px] sm:max-h-none rounded-xl sm:rounded-[16px] overflow-hidden bg-[#264C61]/10 group cursor-pointer shadow-md mb-3 sm:mb-4">
                <img 
                  src={v.thumbnail} 
                  alt={v.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#264C61]/40 flex items-center justify-center group-hover:bg-[#264C61]/50 transition-colors">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#264C61] ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7-11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Title */}
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-[#1A1A1A] mb-1 sm:mb-2 tracking-tight">
                {v.title}
              </h3>
              {/* Description */}
              <p className="text-sm lg:text-[15px] text-[#555] leading-relaxed">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------- Mid-Page CTA ------------- */

function MidPageCTA() {
  return (
    <section className="py-10 sm:py-16 bg-[#F9F9F9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--roomvibe-navy)] mb-2 sm:mb-3 tracking-tight">
          Ready to See Art in Your Space?
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-[#555] mb-4 sm:mb-6">
          Start Free and try RoomVibe in seconds.
        </p>
        <a href="#/register" className="btn-primary">
          Start Free
        </a>
      </div>
    </section>
  );
}

/* ------------- CTA Section (Legacy - kept for reference) ------------- */

function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#1A2240] tracking-tight mb-4">
          Ready to try it?
        </h2>
        <p className="text-base md:text-lg text-[#666] max-w-2xl mx-auto mb-8">
          Experience the future of art visualization with true-to-scale rendering.
        </p>
        <a href="#/studio" className="inline-flex items-center gap-2 rounded-md px-10 py-4 text-base font-semibold text-white bg-[#1A2240] hover:bg-[#121832] shadow-md transition-all">
          Open Studio →
        </a>
      </div>
    </section>
  );
}


/* ------------- Virtual Exhibition Room (MVP Placeholder) ------------- */

function VirtualExhibitionRoom() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/gallery\/exhibitions\/(\d+)/);
  const exhibitionId = match ? match[1] : null;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <SiteHeader showPlanBadge={false} />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#264C61] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Virtual Exhibition Room
          </h1>
          <p className="text-lg text-slate-600 mb-2">Exhibition ID: {exhibitionId}</p>
          <p className="text-slate-500 max-w-xl mx-auto">
            The virtual exhibition room experience is coming soon. You'll be able to walk through your collection in an immersive 3D environment.
          </p>
        </div>
        
        <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-100 mb-8">
          <h2 className="text-xl font-semibold text-[#264C61] mb-4">Coming Soon Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div>
                <h3 className="font-semibold text-[#264C61]">360° Gallery View</h3>
                <p className="text-sm text-slate-500">Walk through your exhibition in a virtual space</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <h3 className="font-semibold text-[#264C61]">Artwork Placement</h3>
                <p className="text-sm text-slate-500">Arrange artworks on virtual gallery walls</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <div>
                <h3 className="font-semibold text-[#264C61]">Share & Invite</h3>
                <p className="text-sm text-slate-500">Send virtual tour links to collectors</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <h3 className="font-semibold text-[#264C61]">Multi-device Support</h3>
                <p className="text-sm text-slate-500">View on desktop, tablet, or VR headset</p>
              </div>
            </div>
          </div>
        </div>
        
        <a
          href="#/dashboard/gallery"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Gallery Dashboard
        </a>
      </div>
    </div>
  );
}

/* ------------- Public Exhibition Page ------------- */

function PublicExhibitionPage() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/exhibitions\/(\d+)\/public/);
  const exhibitionId = match ? match[1] : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#264C61] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gallery Exhibition
          </h1>
          <p className="text-slate-500">
            Exhibition #{exhibitionId} - Public View
          </p>
        </div>
        
        <div className="p-8 bg-slate-50 rounded-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#264C61]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#264C61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#264C61] mb-2">Public Exhibition Coming Soon</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            This exhibition will be publicly viewable once the gallery curator publishes their collection.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <a href="#/" className="text-[#264C61] hover:underline font-medium">
            ← Back to RoomVibe
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------- Docs page (kodovi) ------------- */

function DocsPage() {
  return (
    <main>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold">Developer docs &amp; embed code</h1>
          <p className="mt-2 text-slate-600">
            Add RoomVibe to your website with a simple script tag or React component. Copy the snippets below and publish.
          </p>
        </div>
      </Container>
      <DocsEmbed />
    </main>
  );
}

function DocsEmbed() {
  const umd = `<div id="roomvibe-root"></div>
<script
  src="https://cdn.example.com/roomvibe.widget.umd.js"
  data-target="#roomvibe-root"
  data-mode="showcase"
  data-collection="originals"
  data-one-click-buy="true"
  defer></script>`;

  const react = `import { RoomVibe } from "@roomvibe/widget";

export default function Demo() {
  return (
    <RoomVibe
      mode="showcase"
      collection="originals"
      oneClickBuy
      onEvent={(e) => console.log('RV', e)}
    />
  );
}`;

  return (
    <section className="relative mt-8 mb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(1200px_500px_at_50%_0%,color-mix(in_oklab,var(--accent),white_85%),white)] p-8 sm:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold">Add RoomVibe to your site</h2>
            <p className="mt-2 text-slate-600">Pick one of the two options below.</p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <CodeCard title="UMD / Script Embed" code={umd} />
            <CodeCard title="React (ESM)" code={react} />
          </div>

          <div className="mx-auto mt-8 max-w-3xl text-sm text-slate-700">
            <h3 className="text-base font-semibold">Step-by-step</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                Create a placeholder container: <code className="rounded bg-slate-100 px-1">{'<div id="roomvibe-root"></div>'}</code>
              </li>
              <li>Add the script (UMD) or install the React package (ESM).</li>
              <li>
                Configure props: <code className="rounded bg-slate-100 px-1">mode</code>,{" "}
                <code className="rounded bg-slate-100 px-1">collection</code>,{" "}
                <code className="rounded bg-slate-100 px-1">oneClickBuy</code>.
              </li>
              <li>Publish and test. Open DevTools to watch onEvent logs.</li>
            </ol>

            <h4 className="mt-4 text-sm font-semibold">Shopify (quick note)</h4>
            <p className="mt-1">
              Online Store → Themes → Edit code → add the container + UMD script in the desired template/section. For app-block integration, we’ll ship a
              block later.
            </p>

            <div className="mt-4 text-sm text-slate-600">
              By embedding RoomVibe on a Shopify store, you also accept the{" "}
              <a className="text-rv-primary underline" href="https://www.shopify.com/legal/cookies" target="_blank" rel="noreferrer">
                Shopify Cookie Policy
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------- Privacy ------------- */

function PrivacyPage() {
  return (
    <main>
      <Container id="privacy">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold">Privacy Policy — RoomVibe (Short)</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: November 13, 2025</p>

          <div className="mt-6 grid gap-4 text-slate-700">
            <p>
              This short version applies to the RoomVibe widget/app, demo and embeds. For store cookies on Shopify, please refer to their Cookie Policy.
            </p>
            <p>Controller: Lumina Start j.d.o.o., Drašnička 6, 10000 Zagreb, Croatia · info@irenart.studio</p>
            <p>
              What we collect: (i) contact/leads you submit, (ii) display preferences you choose, (iii) technical logs for security and performance.
              Payments are processed by Shopify/ThriveCart and Stripe/PayPal — RoomVibe does not store payment data.
            </p>
            <p>Your rights (GDPR): access, rectification, erasure, restriction, portability, objection; and you can withdraw consent where applicable.</p>
            <p>
              Cookies: we use essential cookies/localStorage for widget functionality; analytics/marketing only with consent. Shopify stores use Shopify’s
              cookie framework.{" "}
              <a className="text-rv-primary underline" href="https://www.shopify.com/legal/cookies" target="_blank" rel="noreferrer">
                View Shopify Cookie Policy
              </a>
              .
            </p>
          </div>

          <div className="mt-8">
            <a href="#home" className="inline-flex items-center rounded-xl px-4 py-2 text-white hover:opacity-90" style={{ background: "var(--accent)" }}>
              ← Home
            </a>
          </div>
        </div>
      </Container>
    </main>
  );
}

/* ------------- Shared components ------------- */

function CodeCard({ title, code }: { title: string; code: string }) {
  const preRef = useRef<HTMLPreElement | null>(null);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-rv-primary">{title}</h3>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
            } catch (e) {
              const el = preRef.current;
              if (el) {
                const r = document.createRange();
                r.selectNodeContents(el);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(r);
                document.execCommand("copy");
                sel?.removeAllRanges();
              }
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
        >
          <CopyIcon className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <pre ref={preRef} className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}


/* ------------- Modal + icons ------------- */

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(96vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-500">Info</div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <span className="sr-only">Close</span> ×
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}
function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" className="fill-white" />
      <rect x="6" y="8" width="12" height="8" rx="2" className="fill-current text-rv-primary" />
    </svg>
  );
}
function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 3l1.8 3.9L18 9l-4.2 2.1L12 15l-1.8-3.9L6 9l4.2-2.1L12 3z" />
      <circle cx="19" cy="5" r="1" />
      <circle cx="5" cy="17" r="1" />
    </svg>
  );
}
function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  );
}
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function RoomIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M4 8l8-4 8 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}
function ArtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M9 18l-6-6 6-6" />
      <path d="M15 6l6 6-6 6" />
    </svg>
  );
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
