# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application featuring a Canvy-style three-panel editor for visualizing artwork in room environments, plus a marketing landing page. Built with React 18, TypeScript, Vite, and Tailwind CSS.

**Current State**: Full Studio app + Landing page with Shopify integration  
**Last Updated**: November 13, 2025

## Recent Changes
- **November 13, 2025: Studio Mode Deployed! 🎨**
  - **NEW: Three-Panel Canvy Layout** (#/studio route)
    - Left panel: 10 room preset thumbnails
    - Center: Canvas with room + wall recolor + artwork overlay
    - Right: Artwork selector, size controls, frame placeholders
  - **NEW: 10 Room Presets** with PNG alpha masks for wall recoloring
  - **NEW: Wall Recolor System** - Color overlay via PNG masks (only affects wall area)
  - **NEW: Photo Upload** - Users can upload their own wall photos
  - **NEW: Shopify Integration** - Auto-fetch artworks from collection
  - **NEW: Navigation** - "Studio" link + "Try Studio" button in header
  - **Updated Hero** - "Open Studio ▶" button replaces "Try Live Demo"
  - Fixed missing icons (UploadIcon, InfoIcon, HomeIcon, CopyIcon)
  - Build successful: 185 KB JS (56 KB gzipped)
  - Deployed with autoscale configuration

## Project Architecture

### Structure
```
roomvibe/
├── public/
│   └── presets/        # Studio room presets (NEW)
│       ├── room-01.png ... room-10.png  # 10 room photos
│       └── mask-01.png ... mask-10.png  # 10 PNG alpha masks
├── src/
│   ├── App.tsx         # Main app with routing (1231 lines)
│   ├── main.tsx        # React entry point
│   ├── index.css       # Global styles with Tailwind + CSS variables
│   ├── shopify.ts      # Shopify Storefront API integration
│   └── data/
│       ├── artworks.json  # Local artwork catalog
│       └── presets.json   # Studio room preset config (NEW)
├── vite.config.ts      # Vite config (port 5000, allowedHosts)
├── tailwind.config.js  # Tailwind CSS config
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

### Key Components & Features

#### 0. Hash Routing (NEW)
- `/` or `#home` - Landing page (default)
- `#/studio` - Studio mode (three-panel editor)
- `#/privacy` - Privacy policy page

#### 1. TopNav (Updated)
- Sticky header with backdrop blur
- Mobile hamburger menu
- Navigation links: Demo, How it works, Pricing, Docs, **Studio** (new)
- **"Try Studio"** CTA button (turquoise, replaced "Get started")

#### 2. Hero Section (Updated)
- **Uppercase title**: "VISUALIZE ART ON YOUR WALLS"
- Subheadline with value proposition
- Two CTA buttons: **"Open Studio ▶"** (new) and "Add to Website →"

#### 3. LiveDemoMock (Enhanced)
- **Photo Upload Button** - Users can upload their wall photo
- **Room Presets** - Living room, Hallway, Bedroom buttons
- **Wall Color Picker** - Hidden when user uploads photo
- **Custom Artwork Size** - Free text input with lock ratio toggle
- **Artwork Size Display** - Shows dimensions in cm
- **Info Modal** - Explains true-to-size calculation

#### 4. HowItWorks
- 3-step process with icons
- Steps: Pick a room, Customize size/frame, Get instant preview

#### 5. Pricing
- 3 pricing tiers: Starter, Professional, Enterprise
- Feature comparison table
- "Choose plan" CTA buttons

#### 6. DocsEmbed
- Soft background panel (new design)
- Step-by-step integration guide
- Code examples with syntax highlighting
- Copy button for code snippets

#### 7. FAQ (Enhanced)
- **10 detailed questions** (increased from 6)
- Accordion interface with ChevronDown icons
- Topics: embedding, customization, pricing, technical details

#### 8. SiteFooter (Enhanced)
- **Turquoise background** with white text
- **Newsletter Form** - Email signup with submit button
- **Contact Form** - Name, email, message with send button
- Product links, Legal links, Contact info
- Copyright notice

#### 9. Privacy Page
- Accessible via #/privacy hash route
- Short GDPR-compliant privacy policy
- Controller info: Lumina Start j.d.o.o., Zagreb

#### 10. Studio Mode (NEW - Main Feature! 🎨)
**Three-Panel Canvy-Style Layout** accessible via #/studio

**Left Panel: Scene Browser (col-span-3)**
- Grid of 10 room preset thumbnails
- Click to switch scenes
- Active scene highlighted with border
- Each preset shows preview image + name
- "Home" link to return to landing page

**Center Panel: Canvas (col-span-6)**
- Large canvas (560px height) with selected room photo
- **Wall Recolor System**:
  - PNG alpha mask overlay (only colors wall area, preserves furniture)
  - Color picker to change wall color
  - Mask uses CSS `mask-image` property
- **User Photo Upload**:
  - "Upload wall photo" button
  - Replaces preset with user's own wall
  - Wall color picker hidden when photo uploaded
  - "Remove photo" option to restore preset
- **Artwork Overlay**:
  - Centered in safe area (defined per preset)
  - True-to-scale sizing based on dimensions
  - White frame border with shadow
  - Draggable preview (future: drag to reposition)

**Right Panel: Controls (col-span-3)**
- **Artwork Selector**:
  - Dropdown with all artworks
  - Loads from local catalog or Shopify API
  - Shows artwork title
- **Size Controls**:
  - Width/Height inputs (numeric)
  - cm/in unit selector with conversion
  - Lock ratio toggle (maintains aspect ratio)
  - Quick pick buttons: 80×60, 100×70, 150×100 cm
- **Frame Options** (placeholder for Pro):
  - None, Slim, Gallery (buttons disabled)
- **Help Text**:
  - Deep link hint (#/studio)
  - Shopify integration instructions

**Technical Implementation**:
- Room presets in `src/data/presets.json` with:
  - `id`, `name`, `photo`, `mask` paths
  - `safeArea` object: `{x, y, w, h}` (normalized 0-1 coordinates)
- Wall recolor uses CSS mask with alpha channel PNG
- Artwork size calculated: `artWidthPct = f(widthCm, safeArea.w)`
- Aspect ratio: `widthCm / heightCm`
- Safe area defines max canvas region for artwork

### Theme & Styling
- **Primary Color**: Turquoise/Cyan (`--accent: #06B6D4`)
- **Secondary Color**: Light Cyan (`--accent-2: #22D3EE`)
- **Text**: Slate gray (`#0F172A`)
- **Background**: Gradient from slate-50 to white
- **Footer**: Turquoise background with white text

### All Icons (Inline SVG)
- Logo, MenuIcon, SparkleIcon, PlayIcon, ArrowRightIcon
- RoomIcon, RulerIcon, CodeIcon, CheckIcon, ChevronDown
- **UploadIcon** (new), **InfoIcon** (new), **HomeIcon** (new), **CopyIcon** (new)

### Dependencies
- **React** 18.2.0 - UI library
- **React DOM** 18.2.0 - React renderer
- **TypeScript** 5.0.2 - Type safety
- **Vite** 4.4.0 - Build tool and dev server
- **Tailwind CSS** 3.3.3 - Utility-first CSS
- **PostCSS** 8.4.24 + **Autoprefixer** 10.4.14 - CSS processing
- **@vitejs/plugin-react** 4.x - Vite React support

### Scripts
- `npm run dev` - Development server on 0.0.0.0:5000
- `npm run build` - Production build (tsc + vite build)
- `npm run start` - Preview production build (uses $PORT)
- `npm run preview` - Preview production build

### Build Output (Updated with Studio)
```
dist/index.html         0.81 kB │ gzip:  0.43 kB
dist/assets/index.css  19.74 kB │ gzip:  4.53 kB
dist/assets/index.js  185.73 kB │ gzip: 56.79 kB
Total gzipped: ~62 KB (+4 KB for Studio features)
```

### Deployment Configuration
- **Target**: Autoscale (Node.js)
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Port**: Uses $PORT environment variable (5000 default)
- **Allowed Hosts**: app.roomvibe.app, .replit.dev, .repl.co

### Vite Configuration
```typescript
{
  server: { host: '0.0.0.0', port: 5000 },
  preview: { 
    host: '0.0.0.0', 
    port: 5000,
    allowedHosts: ['app.roomvibe.app', '.replit.dev', '.repl.co']
  }
}
```

## Key Features Summary

### Studio Mode (Canvy-Inspired)
1. **Three-Panel Layout** - Professional editor interface
2. **10 Room Presets** - Living rooms, hallways, bedrooms with realistic photos
3. **Wall Recolor** - PNG alpha masks isolate wall area for color changes
4. **Photo Upload** - Users can upload their actual wall photos
5. **True-to-Scale Sizing** - Artwork dimensions in cm/in with ratio lock
6. **Shopify Integration** - Auto-fetch products from collection

### Landing Page
1. **Hero Section** - Uppercase title, gradient background, Studio CTA
2. **Live Demo** - Quick preview with 3 room presets
3. **Pricing** - Free, Basic €9, Designer Pro €29
4. **FAQ** - 10 detailed questions
5. **Newsletter + Contact Forms** - Lead capture in turquoise footer

### Technical Excellence
1. **Hash Routing** - SPA navigation without page reload
2. **CSS Masking** - Advanced wall recolor technique
3. **File Upload** - FileReader API for instant preview
4. **Responsive Design** - Mobile-first with Tailwind
5. **TypeScript** - Full type safety
6. **Shopify API** - Storefront GraphQL integration

## Development Notes
- Server runs on port 5000 (Replit requirement for webview)
- Uses Node.js 20 with npm
- Hot module replacement enabled in dev mode
- All icons are inline SVG components (no external library)
- Responsive design with mobile-first approach
- SEO-friendly structure with semantic HTML
- Forms use localStorage for demo (not connected to backend)
- Photo upload displays preview but doesn't persist

## Shopify Integration Setup

### Option 1: Local Catalog (Fastest)
1. Edit `src/data/artworks.json`
2. Replace `imageUrl` with Shopify CDN URLs:
   - Go to Shopify Products → Image → "Copy link"
3. Set `widthCm` and `heightCm` for each artwork
4. Both Studio and Landing will use this catalog

### Option 2: Auto-Fetch from Shopify (Production)
Add these environment variables in Replit Secrets:
```
VITE_SHOPIFY_DOMAIN=irenart.studio
VITE_SHOPIFY_STOREFRONT_TOKEN=your-public-token
VITE_ROOMVIBE_COLLECTION_HANDLE=originals
```

**Optional Metafields** (for default sizes):
- Namespace: `roomvibe`
- Keys: `width_cm`, `height_cm`

The app will fetch products automatically on load!

## Production Readiness
- ✅ TypeScript compilation passes
- ✅ Vite build successful (62 KB gzipped)
- ✅ All icons implemented
- ✅ Studio mode fully functional
- ✅ 10 room presets with masks
- ✅ Deployment config correct (autoscale)
- ✅ Custom domain support (app.roomvibe.app)
- ✅ Mobile responsive
- ✅ GDPR privacy policy included
- ✅ Shopify integration ready
- 🟡 Forms are demo-only (need backend integration)
- 🟡 Room presets are placeholders (need real photos)

## Next Steps for Production
1. **Replace placeholder room photos** with real photography + masks
2. **Connect newsletter** to MailerLite (need API key)
3. **Connect contact form** to EmailJS or backend
4. **Add real artworks** to Shopify catalog
5. **Set Shopify env vars** for auto-fetch
6. **Add analytics** (Google Analytics, Plausible)
7. **Add error tracking** (Sentry, LogRocket)
8. **Frame rendering** (Pro feature - add visual frames)
9. **A4 calibration** (true-to-size accuracy feature)
