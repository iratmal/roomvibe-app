import React, { useRef, useState, useEffect } from "react";
import localArtworks from "./data/artworks.json";
import presets from "./data/presets.json";
import { fetchCollectionArtworks, type ShopifyArtwork } from "./shopify";

/**
 * RoomVibe — Studio + Landing (hladno plava tema)
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

export default function App() {
  const hash = useHashRoute();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900 font-body">
      <TopNav />
      {hash === "#/privacy" ? (
        <PrivacyPage />
      ) : hash === "#/studio" ? (
        <Studio />
      ) : (
        <main>
          <Hero />
          <SectionDivider />
          <ShowcaseCarousel />
          <SectionDivider />
          <LiveDemoMock />
          <SectionDivider />
          <HowItWorks />
          <SectionDivider />
          <Pricing />
          <SectionDivider />
          <DocsEmbed />
          <SectionDivider />
          <FAQ />
        </main>
      )}
      <SiteFooter />
    </div>
  );
}

function Container({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

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
            <a href="#docs" className="hover:text-slate-700">
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
              <div className="flex gap-4">
                <a
                  onClick={() => setOpen(false)}
                  href="#demo"
                  className="py-2"
                >
                  Demo
                </a>
                <a
                  onClick={() => setOpen(false)}
                  href="#how"
                  className="py-2"
                >
                  How it works
                </a>
                <a
                  onClick={() => setOpen(false)}
                  href="#pricing"
                  className="py-2"
                >
                  Pricing
                </a>
                <a
                  onClick={() => setOpen(false)}
                  href="#docs"
                  className="py-2"
                >
                  Docs
                </a>
                <a
                  onClick={() => setOpen(false)}
                  href="#/studio"
                  className="py-2"
                >
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

function Hero() {
  return (
    <Container id="home">
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-3xl py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            <SparkleIcon className="h-3.5 w-3.5" /> Try original art in your
            room
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-black font-display">
            Visualize art on your walls
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-slate-600">
            Upload a photo of your wall, discover perfect artworks, and see them
            in true-to-size mockups.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#/studio"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-black shadow hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Open Studio <PlayIcon className="h-4 w-4" />
            </a>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-black shadow-sm hover:bg-slate-50"
            >
              Add to Website <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Hladno plavi soft gradient u pozadini */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[#8BADE5] opacity-25 blur-3xl" />
            <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-[#C4D8FF] opacity-30 blur-3xl" />
            <div
              className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
              style={{ background: "var(--accent)" }}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}

function ShowcaseCarousel() {
  const [idx, setIdx] = useState(0);
  const [artIdx, setArtIdx] = useState(0);
  const [arts, setArts] = useState<ShopifyArtwork[]>(
    localArtworks as unknown as ShopifyArtwork[]
  );

  useEffect(() => {
    const handle = (import.meta as any).env.VITE_ROOMVIBE_COLLECTION_HANDLE;
    if (!handle) return;
    fetchCollectionArtworks(handle, 48)
      .then((res) => {
        if (Array.isArray(res) && res.length) setArts(res);
      })
      .catch(() => {});
  }, []);

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

  const widthCm = 120;
  const heightCm = 90;
  const artWidthPct = Math.max(25, Math.min(safe.w * 100, 0.35 * widthCm + 8));
  const aspect = Math.max(0.2, Math.min(5, widthCm / Math.max(1, heightCm)));

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm">
            <div className="font-medium">Showcase</div>
            <div className="text-slate-500">Rooms &amp; Art cycling</div>
          </div>
          <div className="relative h-[500px] overflow-hidden rounded-b-3xl">
            <img
              src={scene?.photo}
              alt={scene?.name || "Room"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${safe.x * 100}%`,
                top: `${safe.y * 100}%`,
                width: `${artWidthPct}%`,
              }}
            >
              <div
                className="overflow-hidden rounded-md border-8 border-white shadow-2xl"
                style={{
                  aspectRatio: `${aspect}/1`,
                  background: "#f8fafc",
                }}
              >
                {art?.imageUrl ? (
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
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
    <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

// --- Studio (Canvy-inspired layout) ---
function Studio() {
  const [sceneId, setSceneId] = useState<string>(
    (presets as any)[0]?.id || ""
  );
  const [wallColor, setWallColor] = useState<string>("#f2f4f7");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const [artworksState, setArtworksState] = useState<ShopifyArtwork[]>(
    localArtworks as unknown as ShopifyArtwork[]
  );
  const [artId, setArtId] = useState<string>(artworksState[0]?.id || "");
  const art = artworksState.find((a) => a.id === artId);

  const [sizeUnit, setSizeUnit] = useState<"cm" | "in">("cm");
  const [wVal, setWVal] = useState<number>(100);
  const [hVal, setHVal] = useState<number>(70);
  const [lockR, setLockR] = useState<boolean>(true);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handle = (import.meta as any).env.VITE_ROOMVIBE_COLLECTION_HANDLE;
    if (!handle) return;
    fetchCollectionArtworks(handle, 24)
      .then((res) => {
        if (Array.isArray(res) && res.length) {
          setArtworksState(res);
          setArtId(res[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const scene: any =
    (presets as any).find((p: any) => p.id === sceneId) || (presets as any)[0];
  const safe = scene?.safeArea || { x: 0.5, y: 0.4, w: 0.6, h: 0.5 };

  const widthCm = sizeUnit === "cm" ? wVal : wVal * 2.54;
  const heightCm = sizeUnit === "cm" ? hVal : hVal * 2.54;
  const artWidthPct = Math.max(
    18,
    Math.min(safe.w * 100, 0.24 * widthCm + 12)
  );
  const aspect = Math.max(0.2, Math.min(5, widthCm / Math.max(1, heightCm)));

  function quickPick(w: number, h: number) {
    if (sizeUnit === "in") {
      w = +(w / 2.54).toFixed(1);
      h = +(h / 2.54).toFixed(1);
    }
    setWVal(w);
    setHVal(h);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Scenes gallery */}
        <aside className="col-span-12 md:col-span-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 md:h-[78vh] md:overflow-auto">
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
                <img
                  src={p.photo}
                  alt={p.name}
                  className="h-24 w-full object-cover"
                />
                <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-[var(--accent)] rounded-xl transition" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-[10px] text-white">
                  {p.name}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Canvas */}
        <section className="col-span-12 md:col-span-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <RoomIcon className="h-4 w-4" /> {scene?.name}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-slate-500">
                {!userPhoto && <span>Wall:</span>}
                {!userPhoto && (
                  <input
                    type="color"
                    value={wallColor}
                    onChange={(e) => setWallColor(e.target.value)}
                    className="h-6 w-10 rounded border border-slate-300"
                  />
                )}
                <button
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload wall photo
                </button>
                {userPhoto && (
                  <button
                    className="text-xs underline"
                    onClick={() => setUserPhoto(null)}
                  >
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

            <div className="relative h-[560px] w-full overflow-hidden rounded-b-2xl">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Your wall"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <img
                  src={scene.photo}
                  alt={scene.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {!userPhoto && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: wallColor,
                    WebkitMaskImage: `url(${scene.mask})` as any,
                    maskImage: `url(${scene.mask})` as any,
                    WebkitMaskSize: "cover",
                    maskSize: "cover",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    opacity: 0.9,
                  }}
                />
              )}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${safe.x * 100}%`,
                  top: `${safe.y * 100}%`,
                  width: `${artWidthPct}%`,
                }}
              >
                <div
                  className="overflow-hidden rounded-md border-8 border-white shadow-2xl"
                  style={{
                    aspectRatio: `${aspect}/1`,
                    background: "#f8fafc",
                  }}
                >
                  {art?.imageUrl ? (
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
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
        </section>

        {/* Right: Controls */}
        <aside className="col-span-12 md:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 md:h-[78vh] md:overflow-auto">
          <div className="text-sm font-semibold">Artwork</div>
          <div className="mt-2 flex items-center gap-2">
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

          <div className="mt-4 text-sm font-semibold">Size</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-700">Width</label>
            <input
              type="number"
              min={1}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={wVal}
              onChange={(e) => {
                const v = Math.max(1, +e.target.value || 1);
                if (lockR) {
                  const ratio = heightCm / Math.max(1, widthCm);
                  setWVal(v);
                  setHVal(Math.max(1, +(v * ratio).toFixed(1)));
                } else {
                  setWVal(v);
                }
              }}
            />
            <label className="text-xs text-slate-700 ml-2">Height</label>
            <input
              type="number"
              min={1}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={hVal}
              onChange={(e) => {
                const v = Math.max(1, +e.target.value || 1);
                if (lockR) {
                  const ratio = widthCm / Math.max(1, heightCm);
                  setHVal(v);
                  setWVal(Math.max(1, +(v * ratio).toFixed(1)));
                } else {
                  setHVal(v);
                }
              }}
            />
            <select
              className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={sizeUnit}
              onChange={(e) => {
                const val = e.target.value as "cm" | "in";
                if (val === "in" && sizeUnit === "cm") {
                  setWVal(+(wVal / 2.54).toFixed(1));
                  setHVal(+(hVal / 2.54).toFixed(1));
                } else if (val === "cm" && sizeUnit === "in") {
                  setWVal(+(wVal * 2.54).toFixed(1));
                  setHVal(+(hVal * 2.54).toFixed(1));
                }
                setSizeUnit(val);
              }}
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
            <label className="ml-2 inline-flex items-center gap-1 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={lockR}
                onChange={(e) => setLockR(e.target.checked)}
              />
              Lock ratio
            </label>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            Quick picks:
            {[
              [80, 60],
              [100, 70],
              [150, 100],
            ].map(([w, h]) => (
              <button
                key={`${w}x${h}`}
                onClick={() => quickPick(w, h)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50"
              >
                {w}×{h} cm
              </button>
            ))}
          </div>

          <div className="mt-6 text-base font-semibold">Frame (Pro)</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            {["None", "Slim", "Gallery"].map((o) => (
              <button
                key={o}
                className="rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                {o}
              </button>
            ))}
          </div>

          {/* BUY BUTTON ZA STUDIO */}
          {art?.onlineStoreUrl && (
            <div className="mt-6">
              <a
                href={art.onlineStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-black shadow hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                View &amp; Buy on Shopify
              </a>
              <p className="mt-2 text-xs text-slate-600">
                Opens the product page on your Shopify store in a new tab.
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-2 text-xs text-slate-600">
            <div>
              Use <b>#/studio</b> to deep-link this editor.
            </div>
            <div>
              Replace placeholders in{" "}
              <code>src/data/artworks.json</code> with Shopify CDN URLs, or set
              env vars to fetch automatically.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- Live Demo (simple) ---
function LiveDemoMock() {
  const [room, setRoom] = useState<"Living" | "Hallway" | "Bedroom">("Living");
  const [wall, setWall] = useState("#f2f4f7");
  const [sizeUnit, setSizeUnit] = useState<"cm" | "in">("cm");
  const [widthVal, setWidthVal] = useState<number>(100);
  const [heightVal, setHeightVal] = useState<number>(70);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [showSizingInfo, setShowSizingInfo] = useState(false);
  const [artworks, setArtworks] = useState<ShopifyArtwork[]>(
    localArtworks as unknown as ShopifyArtwork[]
  );
  const [selectedArtId, setSelectedArtId] = useState<string>(
    artworks[0]?.id || ""
  );
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handle = (import.meta as any).env.VITE_ROOMVIBE_COLLECTION_HANDLE;
    if (!handle) return;
    fetchCollectionArtworks(handle, 24)
      .then((res) => {
        if (Array.isArray(res) && res.length) {
          setArtworks(res);
          setSelectedArtId(res[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const selectedArtwork = artworks.find((a) => a.id === selectedArtId);

  const widthCm = sizeUnit === "cm" ? widthVal : widthVal * 2.54;
  const heightCm = sizeUnit === "cm" ? heightVal : heightVal * 2.54;

  const artWidthPct = Math.max(18, Math.min(60, 0.24 * widthCm + 12));
  const artAspect = Math.max(
    0.2,
    Math.min(5, widthCm / Math.max(1, heightCm))
  );

  function applyQuickPick(w: number, h: number) {
    if (sizeUnit === "in") {
      w = +(w / 2.54).toFixed(1);
      h = +(h / 2.54).toFixed(1);
    }
    setWidthVal(w);
    setHeightVal(h);
  }

  return (
    <Container id="demo">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl font-semibold">Live Demo (preview)</h2>
          <p className="mt-2 text-slate-600">
            Change room, pick an artwork, set custom size, tweak wall color, or
            upload your wall photo.
          </p>
          <div className="mt-6 grid gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Artwork
              </legend>
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
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Room preset
              </legend>
              <div className="flex flex-wrap gap-2">
                {["Living", "Hallway", "Bedroom"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoom(r as any)}
                    className={`rounded-lg border px-3 py-1.5 text-sm shadow-sm ${
                      room === r
                        ? "text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    style={
                      room === r ? { background: "var(--accent)" } : undefined
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Your wall
              </legend>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
                  onClick={() => fileRef.current?.click()}
                >
                  <UploadIcon className="h-4 w-4" /> Upload your wall photo
                </button>
                {userPhoto && (
                  <button
                    className="text-xs underline text-slate-700"
                    onClick={() => setUserPhoto(null)}
                  >
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
                <span className="text-xs text-slate-500">
                  Images stay local in your browser — not uploaded.
                </span>
              </div>
            </fieldset>

            {!userPhoto && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  Wall color
                </legend>
                <div className="flex items-center gap-3">
                  <input
                    aria-label="Pick wall color"
                    type="color"
                    value={wall}
                    onChange={(e) => setWall(e.target.value)}
                    className="h-9 w-16 cursor-pointer rounded-md border border-slate-300 bg-white"
                  />
                  <button
                    onClick={() => setWall("#f2f4f7")}
                    className="rounded-md border border-slate-200 px-2 text-xs hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Artwork size
              </legend>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-700">Width</label>
                <input
                  type="number"
                  min={1}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={widthVal}
                  onChange={(e) => {
                    const v = Math.max(1, +e.target.value || 1);
                    if (lockRatio) {
                      const ratio = heightVal / Math.max(1, widthVal);
                      setWidthVal(v);
                      setHeightVal(Math.max(1, +(v * ratio).toFixed(1)));
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
                    if (lockRatio) {
                      const ratio = widthVal / Math.max(1, heightVal);
                      setHeightVal(v);
                      setWidthVal(Math.max(1, +(v * ratio).toFixed(1)));
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
                  <input
                    type="checkbox"
                    checked={lockRatio}
                    onChange={(e) => setLockRatio(e.target.checked)}
                  />
                  Lock ratio
                </label>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                Quick picks:
                {[
                  [80, 60],
                  [100, 70],
                  [150, 100],
                ].map(([w, h]) => (
                  <button
                    key={`${w}x${h}`}
                    onClick={() => applyQuickPick(w, h)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50"
                  >
                    {w}×{h} cm
                  </button>
                ))}
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
                    Wall:{" "}
                    <span className="font-mono text-xs">
                      {wall.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="relative h-80 w-full">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Your wall"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: wall }}
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.08))]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div
                  className="overflow-hidden rounded-md border-8 border-white shadow-xl"
                  style={{
                    width: `${artWidthPct}%`,
                    aspectRatio: `${artAspect}/1`,
                    background: "#f8fafc",
                  }}
                >
                  {selectedArtwork?.imageUrl ? (
                    <img
                      src={selectedArtwork.imageUrl}
                      alt={selectedArtwork.title}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
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

            {/* DONJI RED — PREVIEW INFO + BUY BUTTON */}
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Preview only · Size: {widthVal}×{heightVal} {sizeUnit}
              </div>
              <div className="flex items-center gap-3">
                {selectedArtwork?.onlineStoreUrl && (
                  <a
                    href={selectedArtwork.onlineStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-black shadow hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                  >
                    View &amp; Buy on Shopify
                  </a>
                )}
                <span className="text-[11px] text-slate-500">
                  Powered by RoomVibe
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSizingInfo && (
        <Modal onClose={() => setShowSizingInfo(false)}>
          <div className="text-sm text-slate-700">
            <h3 className="text-lg font-semibold">How true-to-size works</h3>
            <p className="mt-2">
              For accurate scale, we’ll add a quick one-time calibration in the
              full app:
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                <b>Reference object:</b> Place a standard A4 paper (210 × 297
                mm) or a credit card on the wall and take a photo.
              </li>
              <li>
                <b>Calibrate:</b> Mark the reference corners in the photo. We
                compute the pixel-to-cm ratio and perspective.
              </li>
              <li>
                <b>Verify:</b> Enter the artwork size (e.g., 100 × 70 cm). The
                mockup snaps to the exact scale on your wall photo.
              </li>
            </ol>
            <p className="mt-3">
              Your photo stays local in the browser during preview. For embeds,
              merchants can opt-in to store a copy with consent.
            </p>
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

function HowItWorks() {
  const steps = [
    {
      title: "Pick a room",
      desc: "Choose from presets or upload your own wall.",
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      title: "Adjust size & wall color",
      desc: "Use cm/in, lock ratio, and recolor walls via mask.",
      icon: <RulerIcon className="h-5 w-5" />,
    },
    {
      title: "Embed on your site",
      desc: "Drop a script tag or use our React component.",
      icon: <CodeIcon className="h-5 w-5" />,
    },
  ];
  return (
    <Container id="how">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="mt-2 text-slate-600">
          RoomVibe is a lightweight, embeddable widget for visualizing original
          art in real rooms.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: "var(--accent)" }}
            >
              {s.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "€0 / mo",
      highlight: false,
      features: [
        "1 room preset (Living)",
        "Up to 5 artworks",
        "Up to 2 sizes per artwork",
        "Color picker (no upload)",
        "Designer Mode: —",
      ],
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
        <p className="mt-2 text-slate-600">
          Simple plans that scale with your gallery.
        </p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border p-6 shadow-sm ${
              t.highlight
                ? "border-slate-900 bg-gradient-to-b from-white to-slate-50"
                : "border-slate-200 bg-white"
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
    <section id="docs" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(1200px_500px_at_50%_0%,color-mix(in_oklab,var(--accent),white_85%),white)] p-8 sm:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold">Add RoomVibe to your site</h2>
            <p className="mt-2 text-slate-600">
              Pick one of the two options below.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <CodeCard title="UMD / Script Embed" code={umd} />
            <CodeCard title="React (ESM)" code={react} />
          </div>

          <div className="mx-auto mt-8 max-w-3xl text-sm text-slate-700">
            <h3 className="text-base font-semibold">Step-by-step</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                Create a placeholder container:{" "}
                <code className="rounded bg-slate-100 px-1">
                  {"<div id=\"roomvibe-root\"></div>"}
                </code>
              </li>
              <li>
                Add the script (UMD) or install the React package (ESM).
              </li>
              <li>
                Configure props:{" "}
                <code className="rounded bg-slate-100 px-1">mode</code>,{" "}
                <code className="rounded bg-slate-100 px-1">collection</code>,{" "}
                <code className="rounded bg-slate-100 px-1">oneClickBuy</code>.
              </li>
              <li>
                Publish and test. Open DevTools to watch{" "}
                <code className="rounded bg-slate-100 px-1">onEvent</code> logs.
              </li>
            </ol>

            <h4 className="mt-4 text-sm font-semibold">Shopify (quick note)</h4>
            <p className="mt-1">
              Online Store → Themes → Edit code → add the container + UMD script
              in the desired template/section. For app-block integration, we’ll
              ship a block later.
            </p>

            <div className="mt-4 text-sm text-slate-600">
              By embedding RoomVibe on a Shopify store, you also accept the{" "}
              <a
                className="text-slate-900 underline"
                href="https://www.shopify.com/legal/cookies"
                target="_blank"
                rel="noreferrer"
              >
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

function FAQ() {
  const faqs = [
    {
      q: "Does RoomVibe store payment details?",
      a: "No. Checkout runs on Shopify/ThriveCart and their processors (Stripe/PayPal). RoomVibe never stores or processes card data directly.",
    },
    {
      q: "How do true-to-size mockups work?",
      a: "We add a fast calibration step with a reference (A4 paper or credit card). You mark its corners; we compute pixel-to-cm ratio and perspective so your artwork snaps to exact scale. The demo uses a visual-only approximation.",
    },
    {
      q: "Can I upload my own room photos?",
      a: "Yes. In the demo your photo stays local in the browser (no upload). In the Pro plan, merchants can enable uploads with consent and store room photos to reuse across products.",
    },
    {
      q: "Can I customize the widget styling?",
      a: "Yes. The default style is minimal and modern. You can override accent color, spacing and typography tokens. React users can pass custom classNames or wrap with styled containers.",
    },
    {
      q: "What plans are available?",
      a: "Free (1 preset, 5 artworks), Basic €9/mo (10 presets, 50 artworks, designer mode), Designer Pro €29/mo (unlimited everything + advanced designer tools).",
    },
    {
      q: "What counts as an 'artwork'?",
      a: "An artwork entry represents one piece (original or print) and its available sizes/aspect ratios. Each entry can define multiple sizes, frames, and finish options in Pro.",
    },
    {
      q: "How do I embed on Shopify?",
      a: "Add a div container in the template/section and paste the UMD script. For Online Store 2.0, you can also add a custom liquid section. An official app-block is on the roadmap.",
    },
    {
      q: "Is my data GDPR-compliant?",
      a: "Yes. We only collect the minimal data needed for functionality and analytics (with consent). Payments are handled by Stripe/PayPal. You can request deletion at any time via our privacy page.",
    },
    {
      q: "Will it slow down my site?",
      a: "RoomVibe is lightweight and loads on demand. The widget hydrates when visible and defers heavy work. You can lazy-load room presets and gallery images as users interact.",
    },
    {
      q: "Do you support frames and matting?",
      a: "Designer Pro includes frame styles and mat boundaries with inner window measurements. You can preview frame widths and paper borders around the artwork.",
    },
  ];
  return (
    <Container id="faq">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <p className="mt-2 text-slate-600">
          Deep-dive answers about how RoomVibe works.
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {faqs.map((f, i) => (
          <details key={i} className="group open:rounded-2xl">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-slate-900">
                {f.q}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-4 text-sm text-slate-600">{f.a}</div>
          </details>
        ))}
      </div>
    </Container>
  );
}

// --- Privacy (short) ---
function PrivacyPage() {
  return (
    <main>
      <Container id="privacy">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold">Privacy Policy — RoomVibe (Short)</h1>
          <p className="mt-2 text-sm text-slate-500">
            Last updated: November 13, 2025
          </p>

          <div className="mt-6 grid gap-4 text-slate-700">
            <p>
              This short version applies to the RoomVibe widget/app, demo and
              embeds. For store cookies on Shopify, please refer to their Cookie
              Policy.
            </p>
            <p>
              Controller: Lumina Start j.d.o.o., Drašnička 6, 10000 Zagreb,
              Croatia · info@irenart.studio
            </p>
            <p>
              What we collect: (i) contact/leads you submit, (ii) display
              preferences you choose, (iii) technical logs for security and
              performance. Payments are processed by Shopify/ThriveCart and
              Stripe/PayPal — RoomVibe does not store payment data.
            </p>
            <p>
              Your rights (GDPR): access, rectification, erasure, restriction,
              portability, objection; and you can withdraw consent where
              applicable.
            </p>
            <p>
              Cookies: we use essential cookies/localStorage for widget
              functionality; analytics/marketing only with consent. Shopify
              stores use Shopify’s cookie framework.{" "}
              <a
                className="text-slate-900 underline"
                href="https://www.shopify.com/legal/cookies"
                target="_blank"
                rel="noreferrer"
              >
                View Shopify Cookie Policy
              </a>
              .
            </p>
          </div>

          <div className="mt-8">
            <a
              href="#home"
              className="inline-flex items-center rounded-xl px-4 py-2 text-white hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              ← Home
            </a>
          </div>
        </div>
      </Container>
    </main>
  );
}

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
      <pre
        ref={preRef}
        className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SiteFooter() {
  const [nlEmail, setNlEmail] = useState("");
  const [nlMsg, setNlMsg] = useState<string | null>(null);

  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [cStatus, setCStatus] = useState<string | null>(null);

  function validEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail(nlEmail)) {
      setNlMsg("Please enter a valid email.");
      return;
    }
    try {
      const key = "rv_newsletter";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({ email: nlEmail, ts: Date.now() });
      localStorage.setItem(key, JSON.stringify(list));
      setNlEmail("");
      setNlMsg(
        "Thanks! You’re subscribed. We’ll send art tips and early room presets."
      );
    } catch {
      setNlMsg("Saved locally. We’ll wire this to MailerLite/Shopify next.");
    }
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cName || !validEmail(cEmail) || !cMsg) {
      setCStatus("Please fill in all fields with a valid email.");
      return;
    }
    try {
      const key = "rv_inquiries";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({ name: cName, email: cEmail, message: cMsg, ts: Date.now() });
      localStorage.setItem(key, JSON.stringify(list));
      setCName("");
      setCEmail("");
      setCMsg("");
      setCStatus(
        "Thanks! Your message is saved locally. We’ll reach you shortly."
      );
    } catch {
      setCStatus("Saved locally. We’ll wire this to MailerLite/Shopify next.");
    }
  }

  return (
    <footer className="mt-16 bg-[#EAF2FF] text-black">
      <Container>
        <div className="grid gap-10 py-14 lg:grid-cols-3">
          {/* Logo + linkovi */}
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Logo className="h-5 w-5" /> RoomVibe
            </div>
            <p className="mt-3 text-sm leading-6 text-black/80">
              Visualize art on your walls. Upload a wall photo, try sizes, embed
              on your site.
            </p>
            <ul className="mt-4 space-y-1 text-sm leading-6 text-black/80">
              <li>
                <a
                  href="#/studio"
                  className="underline-offset-2 hover:underline"
                >
                  Studio
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="underline-offset-2 hover:underline"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#/privacy"
                  className="underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.shopify.com/legal/cookies"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  Shopify Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div className="text-sm font-semibold">Newsletter</div>
            <p className="mt-2 text-sm leading-6 text-black/80">
              Join for presets, launch updates, and art-fit tips.
            </p>
            <form className="mt-4 flex gap-2" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-black/60 outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
            {nlMsg && (
              <div className="mt-2 text-xs text-black/80">{nlMsg}</div>
            )}
          </div>

          {/* Kontakt forma */}
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <p className="mt-2 text-sm leading-6 text-black/80">
              Have a question? Send us a message.
            </p>
            <form className="mt-4 grid gap-2" onSubmit={handleContactSubmit}>
              <input
                type="text"
                placeholder="Your name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-black/60 outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-black/60 outline-none"
                required
              />
              <textarea
                placeholder="How can we help?"
                value={cMsg}
                onChange={(e) => setCMsg(e.target.value)}
                rows={3}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-black/60 outline-none"
                required
              />
              <button
                type="submit"
                className="mt-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
              >
                Send
              </button>
            </form>
            {cStatus && (
              <div className="mt-2 text-xs text-black/80">{cStatus}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 py-6 text-xs text-black/70 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} RoomVibe. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#home" className="underline-offset-2 hover:underline">
              Back to top
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// ---- Modal + Icons ----
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(96vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Info
          </div>
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
