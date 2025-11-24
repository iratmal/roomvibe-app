import React, { useEffect, useRef, useState } from "react";
import localArtworks from "./data/artworks.json";
import presets from "./data/presets.json";
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
import ProjectDetail from "./components/dashboards/ProjectDetail";
import CollectionDetail from "./components/dashboards/CollectionDetail";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";
import UploadConsent from "./components/legal/UploadConsent";
import { initGA4, resetGA4, GA4Events } from "./utils/analytics";
import { initHotjar, resetHotjar } from "./utils/hotjar";

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
      {normalizedHash !== "#/studio" && normalizedHash !== "#/simple" && !isDashboardRoute && normalizedHash !== "#/login" && normalizedHash !== "#/register" && normalizedHash !== "#/privacy" && normalizedHash !== "#/terms" && normalizedHash !== "#/upload-consent" && <TopNav />}
      {normalizedHash === "#/privacy" ? (
        <PrivacyPolicy />
      ) : normalizedHash === "#/terms" ? (
        <TermsOfService />
      ) : normalizedHash === "#/upload-consent" ? (
        <UploadConsent />
      ) : normalizedHash === "#/studio" ? (
        <Studio />
      ) : normalizedHash === "#/simple" ? (
        <SimpleVisualizer />
      ) : normalizedHash === "#/docs" ? (
        <DocsPage />
      ) : normalizedHash === "#/login" ? (
        <AuthPage mode="login" />
      ) : normalizedHash === "#/register" ? (
        <AuthPage mode="register" />
      ) : normalizedHash.startsWith("#/dashboard/designer/project/") ? (
        <ProjectDetail />
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
      {normalizedHash !== "#/studio" && normalizedHash !== "#/simple" && !isDashboardRoute && normalizedHash !== "#/login" && normalizedHash !== "#/register" && normalizedHash !== "#/privacy" && normalizedHash !== "#/terms" && normalizedHash !== "#/upload-consent" && <SiteFooter />}
      <CookieConsentBanner />
    </div>
  );
}

/* ------------- Auth & Dashboard Components ------------- */

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [currentMode, setCurrentMode] = useState(mode);

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

function DashboardRouter() {
  const { user, loading, effectiveRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rv-textMuted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  switch (effectiveRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'artist':
      return <ArtistDashboard />;
    case 'designer':
      return <DesignerDashboard />;
    case 'gallery':
      return <GalleryDashboard />;
    case 'user':
    default:
      return <UserDashboard />;
  }
}

function RoleDashboardRouter({ requiredRole }: { requiredRole: string }) {
  const { user, loading, impersonatedRole, setImpersonation } = useAuth();

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
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rv-textMuted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  const isAdmin = user.role === 'admin';
  const hasAccess = user.role === requiredRole || isAdmin;

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
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-rv-neutral">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="#home" className="flex items-center gap-2 font-bold text-rv-primary text-lg">
            <Logo className="h-6 w-6 text-rv-primary" /> <span>RoomVibe</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#how" className="text-rv-text hover:text-rv-primary transition-colors">
              How it works
            </a>
            <a href="#/studio" className="text-rv-text hover:text-rv-primary transition-colors">
              Studio
            </a>
            {user ? (
              <>
                <a href="#/dashboard" className="text-rv-text hover:text-rv-primary transition-colors">
                  Dashboard
                </a>
                <span className="text-xs text-rv-textMuted">({user.role})</span>
              </>
            ) : (
              <>
                <a href="#/login" className="text-rv-text hover:text-rv-primary transition-colors">
                  Login
                </a>
                <a
                  href="#/register"
                  className="inline-flex items-center rounded-rvMd px-5 py-2.5 text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated"
                >
                  Sign Up
                </a>
              </>
            )}
          </nav>
          <button
            aria-label="Open menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-rvSm border border-rv-neutral text-rv-primary hover:bg-rv-surface transition-colors"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-rv-neutral bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2 font-medium">
                <a onClick={() => setOpen(false)} href="#how" className="py-2 text-rv-text hover:text-rv-primary transition-colors">
                  How it works
                </a>
                <a onClick={() => setOpen(false)} href="#/studio" className="py-2 text-rv-text hover:text-rv-primary transition-colors">
                  Studio
                </a>
                {user ? (
                  <a onClick={() => setOpen(false)} href="#/dashboard" className="py-2 text-rv-text hover:text-rv-primary transition-colors">
                    Dashboard
                  </a>
                ) : (
                  <a onClick={() => setOpen(false)} href="#/login" className="py-2 text-rv-text hover:text-rv-primary transition-colors">
                    Login
                  </a>
                )}
              </div>
            </div>
            {user ? (
              <div className="mt-3 text-xs text-rv-textMuted">Logged in as {user.role}</div>
            ) : (
              <a
                href="#/register"
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-rvMd px-5 py-2.5 text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
              >
                Sign Up
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------- HOMEPAGE ------------- */

function HomePage() {
  return (
    <main>
      <Hero />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <CTASection />
    </main>
  );
}

/* ------------- Hero ------------- */

function Hero() {
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <section id="home" className="py-6">
      <div className="mx-auto px-6" style={{ maxWidth: '1100px' }}>
        <div className="hidden md:block" style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
          <div className="relative">
            <picture>
              <source srcSet="/desktop_optimized.webp" type="image/webp" />
              <img
                src="/roomvibe-hero-desktop.jpg"
                alt="RoomVibe – visualize art on your walls"
                className="block w-full h-auto"
              />
            </picture>
            
            {/* Clickable overlay button positioned over the graphic button in the hero image */}
            <button
              onClick={() => navigate('/studio')}
              aria-label="Start Visualizing"
              className="absolute cursor-pointer bg-transparent border-0 hover:bg-white/5 transition-colors"
              style={{
                bottom: '15%',
                left: '12%',
                width: '260px',
                height: '64px',
                zIndex: 2,
              }}
            />
          </div>
        </div>
        
        {/* Mobile version (no scaling) */}
        <div className="md:hidden relative">
          <picture>
            <source srcSet="/desktop_optimized.webp" type="image/webp" />
            <img
              src="/roomvibe-hero-desktop.jpg"
              alt="RoomVibe – visualize art on your walls"
              className="block w-full h-auto"
            />
          </picture>
          
          <button
            onClick={() => navigate('/studio')}
            aria-label="Start Visualizing"
            className="absolute cursor-pointer bg-transparent border-0 hover:bg-white/5 transition-colors"
            style={{
              bottom: '15%',
              left: '12%',
              width: '260px',
              height: '64px',
              zIndex: 2,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-rv-neutral to-transparent" />
    </div>
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
        <div className="flex h-14 items-center justify-between">
          <a href="#/" className="flex items-center gap-2 text-lg font-bold text-rv-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rv-primary text-white text-xs font-bold">
              RV
            </div>
            <span>RoomVibe</span>
          </a>
          <a
            href="#/"
            className="text-sm font-semibold text-rv-text hover:text-rv-primary transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------- Studio (Canvy-style editor) ------------- */

// Real wall height in centimeters for each room preset
const ROOM_WALL_HEIGHTS_CM: Record<string, number> = {
  room01: 270,
  room02: 270,
  room03: 270,
  room04: 250, // Corrected for true-to-scale proportions with furniture
  room05: 270,
  room06: 270,
  room07: 270,
  room08: 270,
  room09: 270,
  room10: 270,
};

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

function Studio() {
  const isInIframe = useIsInIframe();
  const [sceneId, setSceneId] = useState<string>((presets as any)[0]?.id || "");
  const [wallColor, setWallColor] = useState<string>("#f2f4f7");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const [artworksState, setArtworksState] = useState<any[]>(localArtworks as any);
  const [artId, setArtId] = useState<string>("light-my-fire-140-70-cm-roomvibe");
  const artIdRef = useRef<string>(artId);
  const art = artworksState.find((a) => a.id === artId);

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

  // Track Studio visit on mount
  useEffect(() => {
    GA4Events.visitStudio();
  }, []);

  useEffect(() => {
    artIdRef.current = artId;
    // Reset scale to 100% when artwork changes
    setScale(1.0);
    
    // Track artwork change
    if (art) {
      GA4Events.changeArtwork(art.id, art.title);
    }
  }, [artId, art]);

  // Calculate px/cm ratio based on canvas height and room wall height
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const wallHeightCm = ROOM_WALL_HEIGHTS_CM[sceneId] || 270;
    const wallPxHeight = canvasRef.current.clientHeight;
    const ratio = wallPxHeight / wallHeightCm;
    
    setPxPerCm(ratio);
    
    if (import.meta.env.DEV) {
      console.log(`[Real-Scale] Room ${sceneId}: ${wallHeightCm}cm wall = ${wallPxHeight}px, ratio = ${ratio.toFixed(2)} px/cm`);
    }
  }, [sceneId, canvasRef.current?.clientHeight]);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const scene: any = (presets as any).find((p: any) => p.id === sceneId) || (presets as any)[0];
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

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX - offsetX, y: clientY - offsetY };
    isDraggingRef.current = true;
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current || !canvasRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
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
    
    setOffsetX(clampedX);
    setOffsetY(clampedY);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
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
    
    const scaleChange = distance / pinchStartRef.current.distance;
    let newScale = pinchStartRef.current.startScale * scaleChange;
    
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
  }, [isResizing, isPinching]);

  return (
    <main>
      {!isInIframe && <StudioHeader />}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 text-sm text-rv-textMuted">
          <span className="font-semibold text-rv-primary">RoomVibe Studio</span> · Upload a wall photo, pick a room preset, and see your art true-to-size.
        </div>
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Left: Scenes gallery */}
          <aside className="col-span-12 lg:col-span-3 rounded-rvLg border border-rv-neutral bg-white shadow-rvSoft p-3 lg:p-4 h-auto lg:h-[78vh] overflow-auto">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-rv-primary">Scenes</div>
              <a href="#home" className="text-xs font-semibold text-rv-primary hover:text-rv-primaryHover underline">
                Home
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(presets as any).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSceneId(p.id)}
                  className={`group relative overflow-hidden rounded-rvMd border-2 ${
                    sceneId === p.id ? "border-rv-primary" : "border-rv-neutral"
                  } bg-white shadow-sm hover:shadow-rvSoft transition-all`}
                >
                  <img src={p.photo} alt={p.name} className="h-24 w-full object-cover" />
                  <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-rv-primary rounded-rvMd transition-all" />
                  <div className="absolute bottom-0 left-0 right-0 bg-rv-primary/80 px-2 py-1 text-[10px] text-white font-semibold">{p.name}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Center: Canvas */}
          <section className="col-span-12 lg:col-span-6">
            <div className="rounded-rvLg border border-rv-neutral bg-white shadow-rvSoft">
              <div className="flex items-center justify-between border-b border-rv-neutral px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-rv-primary font-semibold">
                  <RoomIcon className="h-4 w-4" /> {scene?.name}
                </div>
                <div className="flex items-center gap-3 text-rv-textMuted">
                  <button
                    className="rounded-rvMd border-2 border-rv-neutral bg-white px-3 py-1.5 text-xs font-semibold text-rv-text hover:bg-rv-surface transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    Upload wall photo
                  </button>
                  {userPhoto && (
                    <button className="text-xs font-semibold text-rv-primary hover:text-rv-primaryHover underline transition-colors" onClick={() => setUserPhoto(null)}>
                      Remove photo
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
                className="relative h-[560px] w-full overflow-hidden rounded-b-rvLg"
                onClick={handleCanvasClick}
              >
                {userPhoto ? (
                  <img src={userPhoto} alt="Your wall" className="absolute inset-0 h-full w-full object-cover" style={{ pointerEvents: 'none' }} />
                ) : (
                  <img src={scene.photo} alt={scene.name} className="absolute inset-0 h-full w-full object-cover" style={{ pointerEvents: 'none' }} />
                )}
                {/* Frame container */}
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
                    transition: 'outline 0.15s ease-in-out, width 0.12s ease-out, height 0.12s ease-out',
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
                      {/* Top-left corner */}
                      <div
                        className="absolute w-7 h-7 bg-white border-3 border-rv-primary rounded-full hover:bg-rv-primary hover:scale-110 transition-all shadow-md cursor-nw-resize flex items-center justify-center"
                        style={{ 
                          top: `-${totalFrameThicknessPx + 10}px`,
                          left: `-${totalFrameThicknessPx + 10}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                        onTouchStart={(e) => handleResizeStart(e, 'nw')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-rv-primary hover:text-white transition-colors">
                          <path d="M15 9l-6 6m0-4l4-4" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      
                      {/* Top-right corner */}
                      <div
                        className="absolute w-7 h-7 bg-white border-3 border-rv-primary rounded-full hover:bg-rv-primary hover:scale-110 transition-all shadow-md cursor-ne-resize flex items-center justify-center"
                        style={{ 
                          top: `-${totalFrameThicknessPx + 10}px`,
                          right: `-${totalFrameThicknessPx + 10}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                        onTouchStart={(e) => handleResizeStart(e, 'ne')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-rv-primary hover:text-white transition-colors">
                          <path d="M9 9l6 6m-4 0l4-4" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      
                      {/* Bottom-left corner */}
                      <div
                        className="absolute w-7 h-7 bg-white border-3 border-rv-primary rounded-full hover:bg-rv-primary hover:scale-110 transition-all shadow-md cursor-sw-resize flex items-center justify-center"
                        style={{ 
                          bottom: `-${totalFrameThicknessPx + 10}px`,
                          left: `-${totalFrameThicknessPx + 10}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                        onTouchStart={(e) => handleResizeStart(e, 'sw')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-rv-primary hover:text-white transition-colors">
                          <path d="M15 15l-6-6m4 0l-4 4" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      
                      {/* Bottom-right corner */}
                      <div
                        className="absolute w-7 h-7 bg-white border-3 border-rv-primary rounded-full hover:bg-rv-primary hover:scale-110 transition-all shadow-md cursor-se-resize flex items-center justify-center"
                        style={{ 
                          bottom: `-${totalFrameThicknessPx + 10}px`,
                          right: `-${totalFrameThicknessPx + 10}px`,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'se')}
                        onTouchStart={(e) => handleResizeStart(e, 'se')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-rv-primary hover:text-white transition-colors">
                          <path d="M9 15l6-6m0 4l-4 4" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Right: Controls */}
          <aside className="col-span-12 lg:col-span-3 rounded-rvLg border border-rv-neutral bg-white shadow-rvSoft p-4 lg:p-5 h-auto lg:h-[78vh] overflow-auto">
            <div className="text-sm font-bold text-rv-primary">Artwork</div>
            <div className="mt-3 flex items-center gap-2">
              <select
                className="w-full rounded-rvMd border-2 border-rv-neutral px-3 py-2 text-sm font-medium text-rv-text focus:outline-none focus:ring-2 focus:ring-rv-primary transition-all"
                value={artId}
                onChange={(e) => setArtId(e.target.value)}
              >
                {artworksState.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            {art && art.widthCm && art.heightCm && (
              <>
                <div className="mt-2 text-xs text-rv-textMuted font-medium">
                  Real size: {art.widthCm} × {art.heightCm} cm
                </div>
                <div className="mt-1 text-xs text-rv-primary font-semibold">
                  Current size: {Math.round(art.widthCm * scale)} × {Math.round(art.heightCm * scale)} cm
                </div>
              </>
            )}

            <div className="mt-6 text-sm font-bold text-rv-primary">Frame</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs max-h-[280px] overflow-y-auto pr-1">
              {FRAME_STYLES.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setFrameStyle(frame.id)}
                  className={`rounded-rvMd border-2 px-2 py-2 font-semibold transition-all text-left ${
                    frameStyle === frame.id
                      ? "border-rv-primary bg-rv-primary text-white shadow-sm"
                      : "border-rv-neutral bg-white text-rv-text hover:bg-rv-surface"
                  }`}
                >
                  {frame.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <button
                onClick={resetPosition}
                className="text-xs font-semibold text-rv-primary hover:text-rv-primaryHover underline transition-colors"
              >
                Reset position
              </button>
            </div>

            {art && (
              <a
                href={(art as any).buyUrl || (art as any).onlineStoreUrl || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={() => GA4Events.buyClick(art.id, art.title, (art as any).buyUrl || (art as any).onlineStoreUrl || "#")}
                className="mt-6 inline-flex w-full items-center justify-center rounded-rvLg bg-rv-primary px-4 py-3 text-sm font-bold text-white shadow-rvSoft hover:bg-rv-primaryHover hover:shadow-rvElevated transition-all"
              >
                View &amp; Buy
              </a>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}


/* ------------- How it works ------------- */

function HowItWorks() {
  const steps = [
    {
      icon: <RoomIcon />,
      title: "Pick a room",
      desc: "Choose from presets or upload your own wall.",
    },
    {
      icon: <ArtIcon />,
      title: "Select artwork",
      desc: "Browse paintings and instantly preview them.",
    },
    {
      icon: <RulerIcon />,
      title: "True-to-size",
      desc: "Artwork is scaled accurately to your wall.",
    },
  ];
  return (
    <Container id="how">
      <div className="py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-rv-primary font-display">How it works</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-rvLg bg-rv-primary/5 text-rv-primary">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-rv-primary">{s.title}</h3>
              <p className="text-rv-textMuted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

/* ------------- CTA Section ------------- */

function CTASection() {
  return (
    <Container>
      <div className="py-20 text-center space-y-8">
        <h2 className="text-3xl font-bold md:text-4xl text-rv-primary font-display">Ready to try it?</h2>
        <p className="text-lg text-rv-textMuted max-w-2xl mx-auto">Experience the future of art visualization with true-to-scale rendering.</p>
        <div>
          <a
            href="#/studio"
            className="inline-flex items-center gap-3 rounded-rvLg px-8 py-3.5 text-lg font-semibold text-white bg-rv-primary hover:bg-rv-primaryHover shadow-rvSoft hover:shadow-rvElevated transition-all"
          >
            Open Studio →
          </a>
        </div>
      </div>
    </Container>
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
              <a className="text-slate-900 underline" href="https://www.shopify.com/legal/cookies" target="_blank" rel="noreferrer">
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
              <a className="text-slate-900 underline" href="https://www.shopify.com/legal/cookies" target="_blank" rel="noreferrer">
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
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
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

function SiteFooter() {
  const { resetConsent } = useCookieConsent();

  return (
    <footer className="mt-20 border-t border-rv-neutral bg-white">
      <Container>
        <div className="flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-rv-textMuted font-medium">
            © 2025 RoomVibe. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium">
            <a href="#/studio" className="text-rv-text hover:text-rv-primary transition-colors">
              Studio
            </a>
            <a href="#/privacy" className="text-rv-text hover:text-rv-primary transition-colors">
              Privacy
            </a>
            <a href="#/terms" className="text-rv-text hover:text-rv-primary transition-colors">
              Terms
            </a>
            <a href="#/upload-consent" className="text-rv-text hover:text-rv-primary transition-colors">
              Upload Consent
            </a>
            <button
              onClick={resetConsent}
              className="text-rv-primary hover:text-rv-primaryHover font-semibold underline transition-colors"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </Container>
    </footer>
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
      <rect x="6" y="8" width="12" height="8" rx="2" className="fill-current text-slate-900" />
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
function RulerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M3 17l11-11 4 4L7 21H3v-4z" />
      <path d="M14 6l4 4" />
      <path d="M12 8l2 2" />
      <path d="M10 10l2 2" />
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
