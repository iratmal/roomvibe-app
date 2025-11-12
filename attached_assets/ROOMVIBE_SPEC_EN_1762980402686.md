# ROOMVIBE — Product Spec + Replit AI Build Brief (EN)
**Version:** 1.0 • **Date:** 2025‑11‑12 • **Language:** EN  
This is a **single file** you can drop into Replit or hand to a developer. It contains a copy‑paste **Replit AI Prompt** and the full product specification for the **RoomVibe** widget + demo app.

---

## 0) Replit AI Prompt — copy/paste this to start the build

**You are Replit AI. Build an embeddable React widget called “RoomVibe” with a demo site, using TypeScript, React, Vite, and Tailwind.**  
Follow the steps and acceptance tests below. Keep the UI modern, minimal, and conversion‑oriented.

### Build Requirements (Do this now)
1) **Scaffold** a React + TypeScript + Vite project. Add Tailwind (base/components/utilities) and a `themes.css` file with CSS variables.  
2) Create a **RoomVibe widget** that can be used in two ways:  
   - **UMD** build mounted via `<script>` and `window.RoomVibe.mount(el, options)`  
   - **ESM** build exported as `<RoomVibe />` React component  
3) Implement **MVP features**:  
   - 3 room presets: *Living*, *Hallway*, *Bedroom* (use royalty‑free placeholders in `/public/rooms/`).  
   - Artwork selection from `artworks.json` (id, title, image, ratio, sizes, frameOptions, price, checkout).  
   - Size & frame selection; **realistic scaling** (maintain aspect ratio).  
   - **Wall color** picker + predefined swatches.  
   - **Buy now** CTA → direct to Shopify/ThriveCart checkout (template + params).  
   - **Email me this** → simple MailerLite POST (no PII stored beyond what’s submitted).  
   - **Copy share link** → serialize state in URL query params.  
   - **Designer Mode** toggle → numeric width input (e.g., 100 cm) and finer scaling UI.  
4) Add **three conversion‑tested themes** (CSS variables on `:root`):  
   - **Azure (blue)** — `--primary:#2563EB; --accent:#60A5FA; --bg:#FFFFFF; --surface:#F8FAFC; --text:#0F172A; --success:#16A34A; --warn:#F59E0B; --error:#EF4444`  
   - **Royal (purple)** — `--primary:#7C3AED; --accent:#A78BFA; --bg:#FFFFFF; --surface:#F8FAFC; --text:#111827; --success:#16A34A; --warn:#F59E0B; --error:#EF4444`  
   - **Sunset (orange)** — `--primary:#F97316; --accent:#FB923C; --bg:#FFFFFF; --surface:#FFF7ED; --text:#0F172A; --success:#16A34A; --warn:#F59E0B; --error:#EF4444`  
   Switch via prop/attribute `theme="azure|royal|sunset"`.
5) Build a **modern Pricing component** (2–3 plans, middle highlighted). **No duplicate logos**.  
6) Implement **analytics events** and expose a hook: `window.onRoomVibeEvent?.(payload)` for:  
   `rv_view`, `rv_art_select`, `rv_size_change`, `rv_wall_color_change`, `rv_buy_click`, `rv_email_submit`, `rv_share_copy`, `rv_designer_mode_toggle`.  
7) Ship **UMD + ESM outputs**, a **demo page**, and a sample **artworks.json**. Keep initial bundle **< 120 kB gzip**.  
8) Prioritize **accessibility** (focus states, contrast, ARIA labels) and **performance** (Lighthouse ≥ 90).

### Example Embeds
**UMD / HTML:**
```html
<div id="roomvibe-root"></div>
<script
  src="https://cdn.example.com/roomvibe.widget.umd.js"
  data-target="#roomvibe-root"
  data-mode="showcase"           <!-- showcase | designer -->
  data-collection="originals"
  data-theme="azure"             <!-- azure | royal | sunset -->
  data-one-click-buy="true"
  data-checkout-type="shopify"   <!-- shopify | thrivecart -->
  data-checkout-link-template="https://yourshop.com/cart/..."
  defer></script>
```
**React ESM:**
```tsx
import { RoomVibe } from "@roomvibe/widget";

export default function Demo() {
  return (
    <RoomVibe
      mode="showcase"
      collection="originals"
      theme="azure"
      oneClickBuy
      checkoutType="shopify"
      checkoutLinkTemplate="https://yourshop.com/cart/..."
      onEvent={(e) => console.log("RV event:", e)}
    />
  );
}
```

### Acceptance Tests (Definition of Done)
- 3 rooms, 5+ artworks, size & wall‑color selection work; aspect ratio preserved.  
- **1‑click Buy** opens correct Shopify/ThriveCart checkout URL with params.  
- MailerLite receives leads with tags: `roomvibe`, `art:<id>`, `theme:<name>`.  
- New **Pricing** component is clean, modern, and has **no duplicate logo**.  
- Themes switch via prop/attribute and retain contrast (AA).  
- Widget works via `<script>` (UMD) **and** as React component (ESM).  
- Lighthouse **Performance/Best Practices/A11y/SEO ≥ 90** on the demo page.

### Deliverables
- UMD + ESM builds, demo page, `artworks.json`, minimal docs (embed, props, events, themes, troubleshooting).  
- Project structure similar to the tree shown in section **16** below.

---

## 1) App Idea / Summary
**RoomVibe** is a lightweight, embeddable widget that lets visitors **try original artworks and prints in room presets** (choose size, frame, wall color) and **buy** quickly.  
- **Owner (Irena):** primary CTA **“Buy now – 1 click”** → direct Shopify/ThriveCart checkout.  
- **Others:** simple embed (`<script>` tag / React component).  
- **Designers:** **Designer Mode** with precise scaling and **share link**.

**Goal:** increase conversion and usability with a modern UI (no duplicate logos), clear flows, and three conversion‑friendly color themes.

---

## 2) Business Goals
- Lift **conversion** via try‑in‑room + strong **Buy now** CTA.  
- Capture warm leads in **MailerLite** (tagged by artwork/theme).  
- Empower **interior designers** (precision + shareable previews).  
- Prepare for **pricing plans** (Free / Designer Pro / Studio).

---

## 3) Personas
- **Shopper/Visitor:** wants a quick visual fit and easy checkout.  
- **Interior Designer:** needs precise dimensions and a shareable link.  
- **Owner (Irena):** wants 1‑click purchase and easy embedding.

---

## 4) Scope (MVP)

### 4.1 Viewer & Controls
- 3 room presets: **Living**, **Hallway**, **Bedroom** (in `/public/rooms/`).  
- Artwork selection (from `artworks.json`), **sizes**, **frame options**.  
- **Wall color**: picker + swatches.  
- **Realistic scaling** with aspect ratio maintained.  
- CTAs: **Buy now**, **Email me this** (MailerLite), **Copy link**.

### 4.2 Themes (Branding System)
CSS variables on `:root`:
- **Azure (blue)** — `--primary:#2563EB; --accent:#60A5FA; --bg:#FFFFFF; --surface:#F8FAFC; --text:#0F172A; --success:#16A34A; --warn:#F59E0B; --error:#EF4444`
- **Royal (purple)** — `--primary:#7C3AED; --accent:#A78BFA; --bg:#FFFFFF; --surface:#F8FAFC; --text:#111827; --success:#16A34A; --warn:#F59E0B; --error:#EF4444`
- **Sunset (orange)** — `--primary:#F97316; --accent:#FB923C; --bg:#FFFFFF; --surface:#FFF7ED; --text:#0F172A; --success:#16A34A; --warn:#F59E0B; --error:#EF4444`

Switch with `theme="azure|royal|sunset"`.

### 4.3 Pricing Component (redesign)
- Modern 2–3 tier layout, clean typography, middle plan highlighted. **No duplicate logos**.

### 4.4 Embed & Configuration
- **UMD `<script>`** + **React component**.  
- Configuration via `data-*` attributes (non‑dev) or React props (dev).

### 4.5 Integrations (MVP)
- **Checkout:**  
  - Originals → **Shopify direct checkout link** (1‑click).  
  - Prints → **ThriveCart checkout link**.  
- **MailerLite**: simple form POST (lead capture + tags).  
- **E‑invoicing** occurs on the shop side; document “Payment paid” webhook expectations (out of widget).

### 4.6 Analytics (events)
- Events: `rv_view`, `rv_art_select`, `rv_size_change`, `rv_wall_color_change`, `rv_buy_click`, `rv_email_submit`, `rv_share_copy`, `rv_designer_mode_toggle`.  
- Hook: `window.onRoomVibeEvent?.(payload)`.

---

## 5) User Flows

### 5.1 Owner 1‑Click Buy
1. Owner embeds widget with `oneClickBuy=true` and `checkoutType="shopify|thrivecart"`.  
2. Visitor selects artwork/size.  
3. **Buy now** → opens appropriate checkout with prefilled params.  
4. Payment completes; e‑invoicing happens via the shop integration.

### 5.2 Standard Visitor
1. Opens widget.  
2. Changes room, wall color, size, frame.  
3. **Buy now** → checkout.  
4. Optional: **Email me this**, **Copy link**.

### 5.3 Designer
1. Toggles **Designer Mode**.  
2. Inputs precise width (e.g., 100 cm).  
3. Generates a **share link** with fixed settings.  
4. (v2: upload room photo + scale calibration).

---

## 6) Tech Stack
- **Frontend:** TypeScript + React + Tailwind.  
- **Build:** Vite; output **UMD** and **ESM** bundles.  
- **No backend** (MVP) beyond public APIs/static JSON.  
- **Performance:** initial bundle < 120 kB gzip, LCP < 1.5s, Lighthouse ≥ 90.  
- **A11y:** focus/ARIA/contrast.

---

## 7) Embed Examples
(See **0) Replit AI Prompt** for exact code snippets.)

---

## 8) Data & Integrations

### 8.1 `artworks.json` Sample
```json
[
  {
    "id": "gv-2025-001",
    "title": "Good Vibes #1",
    "image": "/art/gv-2025-001.jpg",
    "ratio": 1.43,
    "sizes": ["80x60", "100x70", "150x100"],
    "frameOptions": ["none", "black", "white", "oak"],
    "price": 1200,
    "checkout": {
      "type": "shopify",
      "template": "https://yourshop.com/cart/..."
    },
    "tags": ["original", "good-vibes"]
  },
  {
    "id": "pr-2025-021",
    "title": "Print — Soft Neutrals",
    "image": "/art/pr-2025-021.jpg",
    "ratio": 1.25,
    "sizes": ["30x24", "40x32", "60x48"],
    "frameOptions": ["none", "black", "white", "oak"],
    "price": 129,
    "checkout": {
      "type": "thrivecart",
      "template": "https://checkout.thrivecart.com/your-offer/?size={{size}}&art={{id}}"
    },
    "tags": ["print", "soft-neutrals"]
  }
]
```

### 8.2 MailerLite — lead capture
- Implement a simple POST to a form endpoint.  
- Tags: `roomvibe`, `art:<id>`, `theme:<name>`.

---

## 9) UI/UX Guidelines
- Minimal, airy layout; **no duplicate logo** inside the widget.  
- **Primary CTA** dominates (conversion > ornamental visuals).  
- **Pricing**: 2–3 tiers; highlight the middle plan.  
- Subtle micro‑interactions (hover, fade).  
- Mobile‑first; responsive canvas.

---

## 10) Security & Quality
- Use **read‑only** Storefront tokens if any.  
- Don’t store PII in localStorage (only harmless preferences like theme/room).  
- Add error boundaries + fallback UI (e.g., static JSON).

---

## 11) Analytics Payload (Example)
```json
{
  "type": "rv_buy_click",
  "artId": "gv-2025-001",
  "size": "100x70",
  "theme": "azure",
  "mode": "showcase",
  "ts": 1731435600000
}
```

---

## 12) Definition of Done (MVP)
- Try‑in‑room with **3 rooms** and **5+ artworks**; size & wall color work.  
- **1‑click Buy** opens the correct checkout with parameters.  
- **MailerLite** receives leads with tags.  
- **Pricing** is **modern** and has **no duplicate logo**.  
- Themes switch by prop/attribute and pass contrast checks.  
- Works both via **`<script>`** (UMD) and **React** (ESM).  
- Lighthouse Performance/Best Practices/A11y/SEO **≥ 90** (demo).

---

## 13) Roadmap (post‑MVP)
- **v1.1:** wall photo upload + scale calibration (A4 sheet 21 cm).  
- **v1.2:** “client PDF” export for designers (dimensions, links).  
- **v2:** pricing plans + affiliate; advanced metrics dashboard.

---

## 14) Risks & Mitigations
- **Scale accuracy:** add calibration in v1.1 (A4/metre reference).  
- **Checkout varieties:** standardize a `checkoutLinkTemplate` per product type.  
- **Performance:** avoid heavy libs; lazy‑load rooms/art images.

---

## 15) Deliverables
- Repository with **UMD + ESM** builds.  
- **Demo** page (embed showcase).  
- `artworks.json` sample + Shopify mapping notes.  
- **Docs**: embed, config, events, themes, troubleshooting.

---

## 16) Suggested Project Structure
```
roomvibe/
├─ public/
│  ├─ rooms/           # room images (living.jpg, hallway.jpg, bedroom.jpg)
│  └─ art/             # artwork images
├─ src/
│  ├─ widget/          # core widget logic & UI
│  ├─ demo/            # demo app
│  ├─ themes.css       # CSS variables for themes
│  ├─ index.tsx        # demo entry
│  └─ lib/             # helpers (analytics, mailerlite, checkout)
├─ artworks.json       # sample data
├─ index.html          # demo host
├─ package.json
├─ vite.config.ts
└─ README.md
```

---

## 17) `package.json` Guidance
```json
{
  "name": "roomvibe",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "build:umd": "vite build --config vite.config.umd.ts"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vite": "^5.0.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.19"
  }
}
```

---

## 18) Tailwind Setup (short)
- `tailwind.config.js` with `content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"]`  
- `src/index.css` imports `@tailwind base; @tailwind components; @tailwind utilities;` and `themes.css`.

---

## 19) Minimal UMD API
Global: `window.RoomVibe.mount(el, options)` and `window.RoomVibe.unmount(el)`.  
`options` mirror the React props (mode, collection, theme, oneClickBuy, checkoutType, checkoutLinkTemplate, onEvent).

---

## 20) Development Notes
- Keep **aspect ratio** during scaling; show a small ruler or dimension hint.  
- **Wall color** only affects the background “wall,” not the artwork image.  
- **Share link**: serialize state, e.g., `?art=gv-2025-001&size=100x70&theme=azure&room=living&frame=oak&designer=1`.

---

## 21) Demo Assets Licensing
Use royalty‑free room images or generate generic mockups; include **only** allowed assets.

---

## 22) Owner/Brand Defaults (for demo)
- Brand name: **IrenArt Studio** (do **not** render duplicate logos inside the widget).  
- Primary checkout: **Shopify** (originals) and **ThriveCart** (prints).  
- Email capture via **MailerLite** (tags by artwork/theme).

---

**End of specification.**
