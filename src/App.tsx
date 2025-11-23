import React, { useEffect, useRef, useState } from "react";
import localArtworks from "./data/artworks.json";
import presets from "./data/presets.json";

/**
 * RoomVibe — App + Landing + Studio
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
  const hash = useHashRoute();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      {hash !== "#/studio" && hash !== "#/simple" && <TopNav />}
      {hash === "#/privacy" ? (
        <PrivacyPage />
      ) : hash === "#/studio" ? (
        <Studio />
      ) : hash === "#/simple" ? (
        <SimpleVisualizer />
      ) : hash === "#/docs" ? (
        <DocsPage />
      ) : (
        <HomePage />
      )}
      {hash !== "#/studio" && hash !== "#/simple" && <SiteFooter />}
    </div>
  );
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
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="#home" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6" /> <span>RoomVibe</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#demo" className="hover:text-slate-700">
              Demo
            </a>
            <a href="#how" className="hover:text-slate-700">
              How it works
            </a>
            <a href="#pricing" className="hover:text-slate-700">
              Pricing
            </a>
            <a href="#/docs" className="hover:text-slate-700">
              Docs
            </a>
            <a href="#/studio" className="hover:text-slate-700">
              Studio
            </a>
            <a
              href="#/studio"
              className="inline-flex items-center rounded-full px-4 py-2 text-black shadow-sm hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Try Studio
            </a>
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
                <a onClick={() => setOpen(false)} href="#demo" className="py-1">
                  Demo
                </a>
                <a onClick={() => setOpen(false)} href="#how" className="py-1">
                  How it works
                </a>
                <a onClick={() => setOpen(false)} href="#pricing" className="py-1">
                  Pricing
                </a>
                <a onClick={() => setOpen(false)} href="#/docs" className="py-1">
                  Docs
                </a>
                <a onClick={() => setOpen(false)} href="#/studio" className="py-1">
                  Studio
                </a>
              </div>
            </div>
            <a
              href="#/studio"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-black"
              style={{ background: "var(--accent)" }}
            >
              Try Studio
            </a>
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
      <ShowcaseCarousel />
      <SectionDivider />
      <LiveDemoMock />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <WhyArtistsLove />
      <SectionDivider />
      <PerfectFor />
      <SectionDivider />
      <Pricing />
      <SectionDivider />
      <FAQ />
    </main>
  );
}

/* ------------- Hero ------------- */

function Hero() {
  return (
    <Container id="home">
      <div className="rv-hero">
        <div className="rv-hero-text">
          <h1>Visualize Art on Your Walls.</h1>
          <p>
            Upload a photo of your wall, discover perfect artworks, and see them in true-to-size mockups before you buy.
          </p>
          <div className="flex gap-3">
            <a href="#/studio" className="rv-btn-primary">
              Open Studio
            </a>
            <a href="#/docs" className="rv-btn-secondary">
              Add to Website
            </a>
          </div>
        </div>
        <div className="rv-hero-mockup">
          <div className="rv-hero-mockup-card">
            <div className="rv-hero-wall">
              <div className="rv-hero-art" />
            </div>
          </div>
          <span className="rv-hero-caption">
            Preview art in your space in seconds.
          </span>
        </div>
      </div>
    </Container>
  );
}

/* ------------- Showcase carousel ------------- */

function ShowcaseCarousel() {
  const [idx, setIdx] = useState(0);
  const [artIdx, setArtIdx] = useState(0);
  const arts = localArtworks as any[];

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % (presets as any).length);
      setArtIdx((v) => (v + 1) % Math.max(1, arts.length));
    }, 3000);
    return () => clearInterval(t);
  }, [arts.length]);

  const scene: any = (presets as any)[idx];
  const art = arts[artIdx] || arts[0];
  const safe = scene?.safeArea || { x: 0.5, y: 0.38, w: 0.62, h: 0.48 };

  const widthCm = art?.widthCm || 120;
  const heightCm = art?.heightCm || 90;
  const artWidthPct = Math.max(25, Math.min(safe.w * 100, 0.35 * widthCm + 8));
  const aspect = Math.max(0.2, Math.min(5, widthCm / Math.max(1, heightCm)));

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm">
            <div className="font-medium">Showcase</div>
            <div className="text-slate-500">Rooms &amp; art cycling</div>
          </div>
          <div className="relative h-[480px] overflow-hidden rounded-b-3xl">
            <img src={scene?.photo} alt={scene?.name || "Room"} className="absolute inset-0 h-full w-full object-cover" />
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${safe.x * 100}%`, top: `${safe.y * 100}%`, width: `${artWidthPct}%` }}
            >
              <div
                className="overflow-hidden rounded-md border-8 border-white shadow-2xl"
                style={{
                  aspectRatio: `${aspect}/1`,
                  background: "#f8fafc",
                }}
              >
                {art?.imageUrl || art?.overlayImageUrl ? (
                  <img src={art.overlayImageUrl || art.imageUrl} alt={art.title} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
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
                    width: `${artworkWidthPx}px`,
                    height: `${artworkHeightPx}px`,
                    borderStyle: frameStyle === "None" ? "none" : "solid",
                    borderWidth: frameStyle === "None" ? 0 : `${frameThicknessPx}px`,
                    borderColor: frameStyle === "Slim" ? "#1a1a1a" : "#2d2d2d",
                    background: "#f8fafc",
                    cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                    boxShadow:
                      frameStyle === "Gallery"
                        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                        : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    overflow: "visible", // Allow resize handle to be visible
                  }}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                >
                  <div className="overflow-hidden rounded-md" style={{ width: "100%", height: "100%" }}>
                    {art?.imageUrl || art?.overlayImageUrl ? (
                      <img 
                        src={art.overlayImageUrl || art.imageUrl} 
                        alt={art.title} 
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                          objectFit: "cover"
                        }} 
                        draggable={false} 
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
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

/* ------------- Live demo on homepage ------------- */

function LiveDemoMock() {
  const [room, setRoom] = useState<"Living" | "Hallway" | "Bedroom">("Living");
  const [wall, setWall] = useState("#f2f4f7");
  const [sizeUnit, setSizeUnit] = useState<"cm" | "in">("cm");
  const [widthVal, setWidthVal] = useState<number>(100);
  const [heightVal, setHeightVal] = useState<number>(70);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [showSizingInfo, setShowSizingInfo] = useState(false);
  const artworks = localArtworks as any[];
  const [selectedArtId, setSelectedArtId] = useState<string>(localArtworks[0]?.id || "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const selectedArtwork = artworks.find((a) => a.id === selectedArtId);

  const widthCm = sizeUnit === "cm" ? widthVal : widthVal * 2.54;
  const heightCm = sizeUnit === "cm" ? heightVal : heightVal * 2.54;

  const artWidthPct = Math.max(18, Math.min(60, 0.24 * widthCm + 12));
  const artAspect = Math.max(0.2, Math.min(5, widthCm / Math.max(1, heightCm)));

  return (
    <Container id="demo">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl font-semibold">Live demo (preview)</h2>
          <p className="mt-2 text-slate-600">
            Change room, pick an artwork, set size, or upload your wall photo – exactly what your visitors will do.
          </p>
          <div className="mt-6 grid gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Artwork</legend>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={selectedArtId}
                  onChange={(e) => setSelectedArtId(e.target.value)}
                >
                  {artworks.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Room preset</legend>
              <div className="flex flex-wrap gap-2">
                {["Living", "Hallway", "Bedroom"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoom(r as any)}
                    className={`rounded-lg border px-3 py-1.5 text-sm shadow-sm ${
                      room === r ? "text-white" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    style={room === r ? { background: "var(--accent)" } : {}}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Your wall</legend>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
                  onClick={() => fileRef.current?.click()}
                >
                  <UploadIcon className="h-4 w-4" /> Upload your wall photo
                </button>
                {userPhoto && (
                  <button className="text-xs underline text-slate-700" onClick={() => setUserPhoto(null)}>
                    Remove photo
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setUserPhoto(url);
                    }
                  }}
                />
                <span className="text-xs text-slate-500">Images stay local in your browser — not uploaded.</span>
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Artwork size</legend>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-700">Width</label>
                <input
                  type="number"
                  min={1}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={widthVal}
                  onChange={(e) => {
                    const v = Math.max(1, +e.target.value || 1);
                    const currentWidthCm = sizeUnit === "cm" ? widthVal : widthVal * 2.54;
                    const currentHeightCm = sizeUnit === "cm" ? heightVal : heightVal * 2.54;

                    if (lockRatio) {
                      const ratio = currentHeightCm / Math.max(1, currentWidthCm);
                      const newWidth = v;
                      const newHeight = +(newWidth * ratio).toFixed(1);
                      setWidthVal(v);
                      setHeightVal(newHeight);
                    } else {
                      setWidthVal(v);
                    }
                  }}
                />
                <label className="text-xs text-slate-700 ml-2">Height</label>
                <input
                  type="number"
                  min={1}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={heightVal}
                  onChange={(e) => {
                    const v = Math.max(1, +e.target.value || 1);
                    const currentWidthCm = sizeUnit === "cm" ? widthVal : widthVal * 2.54;
                    const currentHeightCm = sizeUnit === "cm" ? heightVal : heightVal * 2.54;

                    if (lockRatio) {
                      const ratio = currentWidthCm / Math.max(1, currentHeightCm);
                      const newHeight = v;
                      const newWidth = +(newHeight * ratio).toFixed(1);
                      setHeightVal(v);
                      setWidthVal(newWidth);
                    } else {
                      setHeightVal(v);
                    }
                  }}
                />
                <select
                  className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={sizeUnit}
                  onChange={(e) => {
                    const val = e.target.value as "cm" | "in";
                    if (val === "in" && sizeUnit === "cm") {
                      setWidthVal(+(widthVal / 2.54).toFixed(1));
                      setHeightVal(+(heightVal / 2.54).toFixed(1));
                    } else if (val === "cm" && sizeUnit === "in") {
                      setWidthVal(+(widthVal * 2.54).toFixed(1));
                      setHeightVal(+(heightVal * 2.54).toFixed(1));
                    }
                    setSizeUnit(val);
                  }}
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
                <label className="ml-2 inline-flex items-center gap-1 text-xs text-slate-700">
                  <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
                  Lock ratio
                </label>
              </div>
              <div className="mt-2">
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm hover:bg-slate-50"
                  onClick={() => setShowSizingInfo(true)}
                  title="How true-to-size works"
                >
                  <InfoIcon className="h-3.5 w-3.5" /> How true-to-size works
                </button>
              </div>
            </fieldset>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <RoomIcon className="h-4 w-4" /> {room} room
              </div>
              <div className="text-slate-500">
                {userPhoto ? (
                  <span>Custom wall photo</span>
                ) : (
                  <>
                    Wall: <span className="font-mono text-xs">{wall.toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="relative h-80 w-full">
              {userPhoto ? (
                <img src={userPhoto} alt="Your wall" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: wall }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.08))]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div
                  className="overflow-hidden rounded-md border-8 border-white shadow-xl"
                  style={{ width: `${artWidthPct}%`, aspectRatio: `${artAspect}/1`, background: "#f8fafc" }}
                >
                  {selectedArtwork?.imageUrl || selectedArtwork?.overlayImageUrl ? (
                    <img src={selectedArtwork.overlayImageUrl || selectedArtwork.imageUrl} alt={selectedArtwork.title} className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              <div>
                Preview only · Size: {widthVal}×{heightVal} {sizeUnit}
              </div>
              <div className="flex items-center gap-3">
                <span>Powered by RoomVibe</span>
                {selectedArtwork && (
                  <a
                    href={(selectedArtwork as any).onlineStoreUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-900 hover:bg-slate-50"
                  >
                    View &amp; Buy
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSizingInfo && (
        <Modal onClose={() => setShowSizingInfo(false)}>
          <div className="text-sm text-slate-700">
            <h3 className="text-lg font-semibold">How true-to-size works</h3>
            <p className="mt-2">For accurate scale, we’ll add a quick one-time calibration in the full app:</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                <b>Reference object:</b> Place a standard A4 paper (210 × 297 mm) or a credit card on the wall and take a photo.
              </li>
              <li>
                <b>Calibrate:</b> Mark the reference corners in the photo. We compute the pixel-to-cm ratio and perspective.
              </li>
              <li>
                <b>Verify:</b> Enter the artwork size (e.g., 100 × 70 cm). The mockup snaps to the exact scale on your wall photo.
              </li>
            </ol>
            <p className="mt-3">Your photo stays local in the browser during preview. For embeds, merchants can opt-in to store a copy with consent.</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowSizingInfo(false)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Container>
  );
}

/* ------------- How it works ------------- */

function HowItWorks() {
  const steps = [
    {
      title: "Pick a room",
      desc: "Choose from presets or upload your own wall photo.",
    },
    {
      title: "Adjust artwork size",
      desc: "Use cm/in units, lock aspect ratio for true-to-scale visualization.",
    },
    {
      title: "Embed on your site",
      desc: "Drop in the RoomVibe widget so visitors can try art live.",
    },
  ];
  return (
    <Container id="how">
      <div className="rv-section">
        <h2>How it works</h2>
        <p className="mt-2 text-slate-600">
          RoomVibe is a lightweight, embeddable widget for visualizing original art in real rooms — for you and your collectors.
        </p>
        <div className="rv-steps">
          {steps.map((s, i) => (
            <div key={i} className="rv-step-card">
              <span className="rv-step-number">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

/* ------------- Why artists love RoomVibe ------------- */

function WhyArtistsLove() {
  const items = [
    {
      title: "Instant mockups",
      text: "Create beautiful room previews in seconds — no Photoshop, no manual cropping.",
    },
    {
      title: "Sell more originals",
      text: "Buyers see your art on their own wall, true-to-size, which increases confidence and conversions.",
    },
    {
      title: "Designer-friendly",
      text: "Interior designers can plan placements for clients and share interactive previews.",
    },
  ];

  return (
    <Container>
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-2xl font-semibold">Why artists love RoomVibe</h2>
          <p className="mt-2 text-slate-600">
            RoomVibe turns your artwork into a visual experience. Show collectors exactly how a piece will feel in their space — before you ship it.
          </p>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div
                  className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "var(--accent-soft)" }}
                >
                  <CheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-sm text-slate-600">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">For collectors</div>
          <h3 className="mt-3 text-lg font-semibold">“I can finally see if a piece truly fits my home.”</h3>
          <p className="mt-2 text-sm text-slate-600">
            Buyers can upload a photo of their living room, hallway or bedroom and instantly see how your work looks on their wall. No guessing, no
            measuring tape drama — just clarity.
          </p>
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Perfect for:
            <ul className="mt-1 list-disc pl-4 space-y-1">
              <li>Large statement pieces that are hard to imagine in a room</li>
              <li>High-end collectors who want to be sure before investing</li>
              <li>Designers presenting options to their clients</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}

/* ------------- Perfect for... ------------- */

function PerfectFor() {
  const cards = [
    {
      title: "Artists & galleries",
      text: "Showcase originals and prints in real interiors, embed the Studio on your site and let buyers try art on their walls.",
    },
    {
      title: "Interior designers",
      text: "Plan art placement in client homes or projects and export reference screenshots for presentations.",
    },
    {
      title: "Online art buyers",
      text: "Upload a wall photo, test different pieces and sizes, and buy directly from the artist with confidence.",
    },
  ];

  return (
    <Container>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">Perfect for artists, galleries &amp; designers</h2>
        <p className="mt-2 text-slate-600">
          One tool that works for original art, limited prints and high-end interior projects.
        </p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="text-sm font-semibold">{c.title}</div>
            <p className="mt-2 text-slate-600">{c.text}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

/* ------------- Pricing ------------- */

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "€0 / mo",
      highlight: false,
      features: ["1 room preset (Living)", "Up to 5 artworks", "Up to 2 sizes per artwork", "Color picker (no upload)", "Designer Mode: —"],
      cta: "Start Free",
    },
    {
      name: "Basic",
      price: "€9 / mo",
      highlight: true,
      features: [
        "10 room presets",
        "Up to 50 artworks",
        "Up to 5 sizes per artwork",
        "Swatches + color picker",
        "Designer Mode enabled (width input)",
      ],
      cta: "Choose Basic",
    },
    {
      name: "Designer Pro",
      price: "€29 / mo",
      highlight: false,
      features: [
        "Unlimited room presets",
        "Unlimited artworks",
        "Unlimited sizes per artwork",
        "Unlimited palettes",
        "Designer Mode advanced (ruler + cm/in)",
      ],
      cta: "Go Pro",
    },
  ];
  return (
    <Container id="pricing">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <p className="mt-2 text-slate-600">Simple plans that scale with your gallery.</p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-6 shadow-sm ${
              t.highlight ? "border-slate-900 bg-gradient-to-b from-white to-slate-50" : "border-slate-200 bg-white"
            }`}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium shadow-sm">
                Recommended
              </div>
            )}
            <div className="text-sm text-slate-500">{t.name}</div>
            <div className="mt-1 text-3xl font-semibold">{t.price}</div>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#/studio"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-black hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              {t.cta}
            </a>
          </div>
        ))}
      </div>
    </Container>
  );
}

/* ------------- FAQ (kraća verzija) ------------- */

function FAQ() {
  const faqs = [
    {
      q: "How do I add RoomVibe to my website?",
      a: "Use the Docs page to copy a small script tag or React component. Paste it into your site template, connect your artworks, and you’re live.",
    },
    {
      q: "How does true-to-size sizing work?",
      a: "In the full app we’ll add a calibration step with A4 paper or a credit card. We then compute pixel-to-centimeter ratio so artwork snaps to exact size.",
    },
    {
      q: "Do you store photos of my walls?",
      a: "In the demo, photos stay only in your browser. In Pro, merchants can choose to store photos with visitor consent, for reuse across products.",
    },
    {
      q: "Can I sell my art through RoomVibe?",
      a: "Yes. RoomVibe connects to Shopify or your existing checkout. Buyers preview art in the widget and finish payment in your store.",
    },
  ];
  return (
    <Container id="faq">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <p className="mt-2 text-slate-600">Quick answers to the most common questions.</p>
      </div>
      <div className="mx-auto mt-6 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {faqs.map((f, i) => (
          <details key={i} className="group open:rounded-2xl">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-slate-900">{f.q}</span>
              <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-4 text-sm text-slate-600">{f.a}</div>
          </details>
        ))}
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
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Logo className="h-5 w-5" /> RoomVibe
            </div>
            <p className="text-sm text-black/80">
              Visualize art on your walls. Upload a wall photo, try sizes, and embed the experience on your site.
            </p>
          </div>
          <div className="flex gap-8 text-sm">
            <div className="space-y-1">
              <div className="font-semibold">Product</div>
              <a href="#/studio" className="block hover:underline underline-offset-2">
                Studio
              </a>
              <a href="#pricing" className="block hover:underline underline-offset-2">
                Pricing
              </a>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Company</div>
              <a href="#/privacy" className="block hover:underline underline-offset-2">
                Privacy
              </a>
              <a href="#/docs" className="block hover:underline underline-offset-2">
                Docs
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-black/10 py-4 text-xs text-black/70">
          <div>© 2025 RoomVibe. All rights reserved.</div>
          <a href="#home" className="hover:underline underline-offset-2">
            Back to top
          </a>
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
