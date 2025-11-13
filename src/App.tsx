import React, { useMemo, useRef, useState } from "react";

/**
 * RoomVibe Landing — English only, turquoise accent.
 * Headline: "Visualize Art on Your Walls"
 * Subheadline: "Upload a photo of your wall, discover perfect artworks, and see them in true-to-size mockups"
 */

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      <TopNav />
      <main>
        <Hero />
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
      <SiteFooter />
    </div>
  );
}

function Container({ children, id }: { children: React.ReactNode; id?: string }) {
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
            <a href="#demo" className="hover:text-slate-700">Demo</a>
            <a href="#how" className="hover:text-slate-700">How it works</a>
            <a href="#pricing" className="hover:text-slate-700">Pricing</a>
            <a href="#docs" className="hover:text-slate-700">Docs</a>
            <a href="#faq" className="hover:text-slate-700">FAQ</a>
            <a
              href="#pricing"
              className="inline-flex items-center rounded-full px-4 py-2 text-white shadow-sm hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Get started
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
                <a onClick={() => setOpen(false)} href="#demo" className="py-2">Demo</a>
                <a onClick={() => setOpen(false)} href="#how" className="py-2">How it works</a>
                <a onClick={() => setOpen(false)} href="#pricing" className="py-2">Pricing</a>
                <a onClick={() => setOpen(false)} href="#docs" className="py-2">Docs</a>
                <a onClick={() => setOpen(false)} href="#faq" className="py-2">FAQ</a>
              </div>
            </div>
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-white"
              style={{ background: "var(--accent)" }}
            >
              Get started
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
            <SparkleIcon className="h-3.5 w-3.5" /> Try original art in your room
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-[color-mix(in_oklab,var(--accent),white_25%)]">
              Visualize Art on Your Walls
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-slate-600">
            Upload a photo of your wall, discover perfect artworks, and see them in true-to-size mockups.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-white shadow hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Try Live Demo <PlayIcon className="h-4 w-4" />
            </a>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Add to Website <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[960px] -translate-x-1/2"
            style={{ background: "radial-gradient(closest-side, color-mix(in_oklab,var(--accent),white_70%), transparent)" }}
          ></div>
        </div>
      </div>
    </Container>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

function LiveDemoMock() {
  const [room, setRoom] = useState<"Living" | "Hallway" | "Bedroom">("Living");
  const [wall, setWall] = useState("#f2f4f7");
  const [size, setSize] = useState<"80x60" | "100x70" | "150x100">("100x70");

  const artAspect = 100 / 70;
  const artWidthPct = useMemo(() => {
    switch (size) {
      case "80x60":
        return 28;
      case "100x70":
        return 36;
      case "150x100":
        return 48;
    }
  }, [size]);

  return (
    <Container id="demo">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl font-semibold">Live Demo (preview)</h2>
          <p className="mt-2 text-slate-600">Change room, wall color and artwork size to see the effect.</p>
          <div className="mt-6 grid gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Room preset</legend>
              <div className="flex flex-wrap gap-2">
                {["Living", "Hallway", "Bedroom"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoom(r as any)}
                    className={`rounded-lg border px-3 py-1.5 text-sm shadow-sm ${room === r ? "text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    style={room === r ? { background: "var(--accent)" } : {}}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Wall color</legend>
              <div className="flex items-center gap-3">
                <input
                  aria-label="Pick wall color"
                  type="color"
                  value={wall}
                  onChange={(e) => setWall(e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-md border border-slate-300 bg-white"
                />
                <div className="flex gap-2">
                  {["#f2f4f7", "#e2e8f0", "#e5e7eb", "#fef3c7", "#fef2f2", "#ecfeff"].map((c) => (
                    <button
                      key={c}
                      aria-label={`Set wall to ${c}`}
                      onClick={() => setWall(c)}
                      className="h-7 w-7 rounded-md border border-slate-200"
                      style={{ background: c }}
                    />
                  ))}
                  <button onClick={() => setWall("#f2f4f7")} className="rounded-md border border-slate-200 px-2 text-xs hover:bg-slate-50">
                    Reset
                  </button>
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Artwork size</legend>
              <div className="flex flex-wrap gap-2">
                {["80x60", "100x70", "150x100"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s as any)}
                    className={`rounded-lg border px-3 py-1.5 text-sm shadow-sm ${size === s ? "text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    style={size === s ? { background: "var(--accent)" } : {}}
                  >
                    {s}
                  </button>
                ))}
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
                Wall: <span className="font-mono text-xs">{wall.toUpperCase()}</span>
              </div>
            </div>
            <div className="relative h-80 w-full">
              <div className="absolute inset-0" style={{ background: wall }} />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.08))]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-md border-8 border-white shadow-xl" style={{ width: `${artWidthPct}%`, aspectRatio: `${artAspect}/1`, background: "#f8fafc" }}>
                  <div
                    className="h-full w-full"
                    style={{ background: "linear-gradient(135deg, color-mix(in_oklab,var(--accent),white_10%), color-mix(in_oklab,var(--accent),black_10%))" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              <div>Preview only · Sizes: 80×60 / 100×70 / 150×100 cm</div>
              <div>Powered by RoomVibe</div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Pick a room", desc: "Choose from presets like Living, Hallway or Bedroom.", icon: <HomeIcon className="h-5 w-5" /> },
    { title: "Adjust size & wall color", desc: "Keep aspect ratio realistic and match your palette.", icon: <RulerIcon className="h-5 w-5" /> },
    { title: "Embed on your site", desc: "Drop a script tag or use our React component.", icon: <CodeIcon className="h-5 w-5" /> },
  ];
  return (
    <Container id="how">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="mt-2 text-slate-600">RoomVibe is a lightweight, embeddable widget for visualizing original art in real rooms.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--accent)" }}>
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
      features: ["1 room preset (Living)", "Up to 5 artworks", "Up to 2 sizes per artwork", "6 wall color swatches", "Designer Mode: —"],
      cta: "Start Free",
    },
    {
      name: "Basic",
      price: "€9 / mo",
      highlight: true,
      features: ["3 room presets", "Up to 50 artworks", "Up to 5 sizes per artwork", "Swatches + color picker", "Designer Mode enabled (width input)"],
      cta: "Choose Basic",
    },
    {
      name: "Designer Pro",
      price: "€29 / mo",
      highlight: false,
      features: ["Unlimited room presets", "Unlimited artworks", "Unlimited sizes per artwork", "Unlimited palettes", "Designer Mode advanced (ruler + cm/in)"],
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
          <div key={t.name} className={`relative rounded-2xl border p-6 shadow-sm ${t.highlight ? "border-slate-900 bg-gradient-to-b from-white to-slate-50" : "border-slate-200 bg-white"}`}>
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
              href="#docs"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-white hover:opacity-90"
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
    <Container id="docs">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">Add RoomVibe to your site</h2>
        <p className="mt-2 text-slate-600">Pick one of the two options below.</p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <CodeCard title="UMD / Script Embed" code={umd} />
        <CodeCard title="React (ESM)" code={react} />
      </div>
      <div className="mt-6 text-sm text-slate-600">
        By embedding RoomVibe on a Shopify store, you also accept the{" "}
        <a className="text-slate-900 underline" href="https://www.shopify.com/legal/cookies" target="_blank" rel="noreferrer">
          Shopify Cookie Policy
        </a>.
      </div>
    </Container>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Does RoomVibe store payment details?",
      a: "No. Checkout runs on Shopify/ThriveCart and their processors (Stripe/PayPal).",
    },
    {
      q: "Can I customize the widget styling?",
      a: "Yes. We ship one modern visual style by default. You can tweak spacing, typography and a single accent color in code.",
    },
    {
      q: "Is there a free plan?",
      a: "Yes. Free includes 1 room preset, 5 artworks and 2 sizes per artwork.",
    },
  ];
  return (
    <Container id="faq">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <p className="mt-2 text-slate-600">Quick answers to common questions.</p>
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
    <footer className="mt-16 border-t border-slate-200 bg-white/60">
      <Container>
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Logo className="h-5 w-5" /> RoomVibe
            </div>
            <p className="mt-3 text-sm text-slate-600">Lightweight, embeddable widget to visualize original art in real rooms.</p>
          </div>
          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a href="#demo" className="hover:text-slate-900">
                  Live Demo
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-slate-900">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#docs" className="hover:text-slate-900">
                  Docs / Embed
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a href="#/privacy" className="hover:text-slate-900">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://www.shopify.com/legal/cookies" target="_blank" rel="noreferrer" className="hover:text-slate-900">
                  Shopify Cookie Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>info@irenart.studio</li>
              <li>Lumina Start j.d.o.o., Drašnička 6, 10000 Zagreb</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 py-6 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} RoomVibe. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#home" className="hover:text-slate-700">
              Back to top
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// --- Privacy Page (short) ---
function PrivacyPage() {
  return (
    <main>
      <Container id="privacy">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold">Privacy Policy — RoomVibe (Short)</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: November 12, 2025</p>

          <div className="mt-6 grid gap-4 text-slate-700">
            <p>
              This short version applies to the RoomVibe widget/app, demo and embeds. For store cookies on Shopify, please refer to their Cookie Policy.
            </p>
            <p>Controller: Lumina Start j.d.o.o., Drašnička 6, 10000 Zagreb, Croatia · info@irenart.studio</p>
            <p>
              What we collect: (i) contact/leads you submit, (ii) display preferences you choose, (iii) technical logs for security and performance. Payments
              are processed by Shopify/ThriveCart and Stripe/PayPal — RoomVibe does not store payment data.
            </p>
            <p>
              Your rights (GDPR): access, rectification, erasure, restriction, portability, objection; and you can withdraw consent where applicable.
            </p>
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

// Icons (inline)
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
