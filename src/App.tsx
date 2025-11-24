import React, { useEffect, useRef, useState } from "react";
import localArtworks from "./data/artworks.json";
import presets from "./data/presets.json";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserDashboard } from "./components/dashboards/UserDashboard";
import { ArtistDashboard } from "./components/dashboards/ArtistDashboard";
import { DesignerDashboard } from "./components/dashboards/DesignerDashboard";
import { GalleryDashboard } from "./components/dashboards/GalleryDashboard";
import { AdminDashboard } from "./components/dashboards/AdminDashboard";

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
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const hash = useHashRoute();
  const isDashboardRoute = hash.startsWith("#/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      {hash !== "#/studio" && hash !== "#/simple" && !isDashboardRoute && hash !== "#/login" && hash !== "#/register" && <TopNav />}
      {hash === "#/privacy" ? (
        <PrivacyPage />
      ) : hash === "#/studio" ? (
        <Studio />
      ) : hash === "#/simple" ? (
        <SimpleVisualizer />
      ) : hash === "#/docs" ? (
        <DocsPage />
      ) : hash === "#/login" ? (
        <AuthPage mode="login" />
      ) : hash === "#/register" ? (
        <AuthPage mode="register" />
      ) : hash === "#/dashboard/artist" ? (
        <RoleDashboardRouter requiredRole="artist" />
      ) : hash === "#/dashboard/designer" ? (
        <RoleDashboardRouter requiredRole="designer" />
      ) : hash === "#/dashboard/gallery" ? (
        <RoleDashboardRouter requiredRole="gallery" />
      ) : hash === "#/dashboard" ? (
        <DashboardRouter />
      ) : (
        <HomePage />
      )}
      {hash !== "#/studio" && hash !== "#/simple" && !isDashboardRoute && hash !== "#/login" && hash !== "#/register" && <SiteFooter />}
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
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
          <p className="text-slate-600">Loading dashboard...</p>
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
  const { user, loading, impersonatedRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  const isAdmin = user.role === 'admin';
  const hasAccess = user.role === requiredRole || (isAdmin && impersonatedRole === requiredRole);

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
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="#home" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6" /> <span>RoomVibe</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="hover:text-slate-700">
              How it works
            </a>
            <a href="#/studio" className="hover:text-slate-700">
              Studio
            </a>
            {user ? (
              <>
                <a href="#/dashboard" className="hover:text-slate-700">
                  Dashboard
                </a>
                <span className="text-xs text-slate-500">({user.role})</span>
              </>
            ) : (
              <>
                <a href="#/login" className="hover:text-slate-700">
                  Login
                </a>
                <a
                  href="#/register"
                  className="inline-flex items-center rounded-full px-4 py-2 text-black shadow-sm hover:opacity-90"
                  style={{ background: "var(--accent)" }}
                >
                  Sign Up
                </a>
              </>
            )}
          </nav>
          <button
            aria-label="Open menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <a onClick={() => setOpen(false)} href="#how" className="py-1">
                  How it works
                </a>
                <a onClick={() => setOpen(false)} href="#/studio" className="py-1">
                  Studio
                </a>
                {user ? (
                  <a onClick={() => setOpen(false)} href="#/dashboard" className="py-1">
                    Dashboard
                  </a>
                ) : (
                  <a onClick={() => setOpen(false)} href="#/login" className="py-1">
                    Login
                  </a>
                )}
              </div>
            </div>
            {user ? (
              <div className="mt-3 text-xs text-slate-500">Logged in as {user.role}</div>
            ) : (
              <a
                href="#/register"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-black"
                style={{ background: "var(--accent)" }}
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
    <div className="mx-auto my-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <a href="#/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--rv-navy)] text-white text-xs">
              RV
            </div>
            <span>RoomVibe</span>
          </a>
          <a
            href="#/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
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
  room04: 270,
  room05: 270,
  room06: 270,
  room07: 270,
  room08: 270,
  room09: 270,
  room10: 270,
};

// Frame thickness in centimeters (added OUTSIDE the artwork)
const FRAME_THICKNESS_CM: Record<string, number> = {
  None: 0,
  Slim: 3,
  Gallery: 8,
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

  const [frameStyle, setFrameStyle] = useState<"None" | "Slim" | "Gallery">("None");
  
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [pxPerCm, setPxPerCm] = useState<number>(2); // pixels per centimeter ratio
  const [scale, setScale] = useState<number>(1.0); // artwork scale multiplier (1.0 = 100%)
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeStartRef = useRef<{ x: number; y: number; startScale: number } | null>(null);

  useEffect(() => {
    artIdRef.current = artId;
    // Reset scale to 100% when artwork changes
    setScale(1.0);
  }, [artId]);

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

  // Frame thickness in pixels (added OUTSIDE the artwork at fixed physical size)
  const frameThicknessCm = FRAME_THICKNESS_CM[frameStyle] || 0;
  const frameThicknessPx = frameThicknessCm * pxPerCm; // Fixed physical size (NOT scaled)

  // Total dimensions including frame
  const totalWidthPx = artworkWidthPx + frameThicknessPx * 2;
  const totalHeightPx = artworkHeightPx + frameThicknessPx * 2;

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

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = { 
      x: clientX, 
      y: clientY, 
      startScale: scale 
    };
    setIsResizing(true);
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing || !resizeStartRef.current || !canvasRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStartRef.current.x;
    const deltaY = clientY - resizeStartRef.current.y;
    
    // Project delta onto SE diagonal (45-degree resize handle)
    const diagonalDelta = (deltaX + deltaY) / Math.sqrt(2);
    
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
    resizeStartRef.current = null;
  };

  useEffect(() => {
    const options = { passive: false };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, options);
    window.addEventListener('touchend', handleDragEnd);
    
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove, options);
    window.addEventListener('touchend', handleResizeEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove, options as any);
      window.removeEventListener('touchend', handleDragEnd);
      
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove, options as any);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing]);

  return (
    <main>
      {!isInIframe && <StudioHeader />}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 text-sm text-slate-600">
          <span className="font-medium">RoomVibe Studio</span> · Upload a wall photo, pick a room preset, and see your art true-to-size.
        </div>
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Left: Scenes gallery */}
          <aside className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-3 lg:p-4 h-auto lg:h-[78vh] overflow-auto">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Scenes</div>
              <a href="#home" className="text-xs underline">
                Home
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(presets as any).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSceneId(p.id)}
                  className={`group relative overflow-hidden rounded-xl border ${
                    sceneId === p.id ? "border-slate-900" : "border-slate-200"
                  } bg-white`}
                >
                  <img src={p.photo} alt={p.name} className="h-24 w-full object-cover" />
                  <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-[var(--accent)] rounded-xl transition" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-[10px] text-white">{p.name}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Center: Canvas */}
          <section className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <RoomIcon className="h-4 w-4" /> {scene?.name}
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                    onClick={() => fileRef.current?.click()}
                  >
                    Upload wall photo
                  </button>
                  {userPhoto && (
                    <button className="text-xs underline" onClick={() => setUserPhoto(null)}>
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
                      }
                    }}
                  />
                </div>
              </div>

              <div ref={canvasRef} className="relative h-[560px] w-full overflow-hidden rounded-b-2xl">
                {userPhoto ? (
                  <img src={userPhoto} alt="Your wall" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <img src={scene.photo} alt={scene.name} className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div
                  className="rounded-md shadow-2xl"
                  style={{ 
                    position: "absolute",
                    left: `calc(${safe.x * 100}% + ${offsetX}px)`, 
                    top: `calc(${safe.y * 100}% + ${offsetY}px)`, 
                    transform: "translate(-50%, -50%)",
                    width: `${totalWidthPx}px`,
                    height: `${totalHeightPx}px`,
                    borderStyle: frameStyle === "None" ? "none" : "solid",
                    borderWidth: frameStyle === "None" ? 0 : `${frameThicknessPx}px`,
                    borderColor: frameStyle === "Slim" ? "#1a1a1a" : "#2d2d2d",
                    background: "#f8fafc",
                    cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                    boxSizing: "border-box",
                    boxShadow:
                      frameStyle === "Gallery"
                        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                        : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    overflow: "visible",
                  }}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                >
                  <div className="overflow-hidden rounded-md" style={{ width: `${artworkWidthPx}px`, height: `${artworkHeightPx}px` }}>
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
                          background:
                            "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))",
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Resize handle */}
                  <div
                    className="absolute w-6 h-6 bg-white border-2 border-slate-400 rounded-tl-md hover:bg-slate-100 hover:border-slate-600 transition-colors"
                    style={{ 
                      bottom: `-${frameThicknessPx}px`,
                      right: `-${frameThicknessPx}px`,
                      cursor: 'se-resize',
                    }}
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-slate-600">
                      <path d="M9 15l6-6m0 4l-4 4" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Controls */}
          <aside className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 lg:p-5 h-auto lg:h-[78vh] overflow-auto">
            <div className="text-sm font-semibold">Artwork</div>
            <div className="mt-3 flex items-center gap-2">
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
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
              <div className="mt-2 text-xs text-slate-500">
                Real size: {art.widthCm} × {art.heightCm} cm
              </div>
            )}

            <div className="mt-6 text-sm font-semibold">Frame</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {(["None", "Slim", "Gallery"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setFrameStyle(o)}
                  className={`rounded-md border px-2 py-1 transition ${
                    frameStyle === o
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <button
                onClick={resetPosition}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Reset position
              </button>
            </div>

            {art && (
              <a
                href={(art as any).buyUrl || (art as any).onlineStoreUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
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
      <div className="py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center text-[var(--accent)]">
                {s.icon}
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="text-slate-600">{s.desc}</p>
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
      <div className="py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold md:text-4xl">Ready to try it?</h2>
        <div>
          <a
            href="#/studio"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-lg font-medium text-black shadow-md hover:opacity-90 transition-opacity"
            style={{ background: "var(--accent)" }}
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
  return (
    <footer className="mt-16 bg-[var(--footer-bg)] text-black">
      <Container>
        <div className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-black/70">
            © 2025 RoomVibe. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#/studio" className="hover:underline underline-offset-2">
              Studio
            </a>
            <a href="#/privacy" className="hover:underline underline-offset-2">
              Privacy
            </a>
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
