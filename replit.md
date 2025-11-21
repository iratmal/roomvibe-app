# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application offering a Canvy-style three-panel editor for visualizing artwork in room environments, complemented by a marketing landing page. Its primary purpose is to allow users to visualize how artworks would look on their walls, with features such as wall recoloring and true-to-scale sizing. The project aims to provide a modern, user-friendly experience for art visualization and is ready for integration with e-commerce platforms like Shopify.

## Recent Changes (November 21, 2025)
**FINAL Studio Bug Fixes & Production Deployment:**
- Fixed **Bug 1 (Size auto-population)**: Dimension fields now automatically populate from artwork metadata when selection changes. Effect depends solely on `artId` to prevent overwriting during cm↔in unit toggles. ✅
- Fixed **Bug 2 (Buy button)**: "View & Buy on Shopify" button now consistently uses correct `buyUrl` from enriched data by using LOCAL artworks.json as the authoritative data source instead of Shopify API merge. Removed collection mismatch issue where env variable was calling "roomvibe-studio" collection instead of "all-products" + "original-artwork-2" collections. ✅
- Fixed **Bug 3 (Frame functionality)**: Implemented working Frame selector with None (8px white border), Slim (2px black - thinner), and Gallery (20px dark + shadow - thicker) options that apply visual CSS styling to artwork preview. ✅
- **Root cause analysis**: Shopify merge was fetching "roomvibe-studio" demo collection (env variable), but local artworks.json contains 30 artworks from TWO different collections: "all-products" (20 artworks) + "original-artwork-2" (10 artworks including Sandy, Light My Fire). Merge couldn't find handle matches, so Size defaulted to 100x70 and buyUrl pointed to wrong products.
- **Solution**: Removed all Shopify `fetchCollectionArtworks` merge logic from Studio, ShowcaseCarousel, and LiveDemoMock. Now using LOCAL artworks.json as single source of truth with all enriched data (widthCm, heightCm, buyUrl, imageUrl).
- **Production readiness**: Gated console.log debugging behind `import.meta.env.DEV` flag to prevent logging in production builds.
- **Deployment configured**: Autoscale deployment with `npm run build` (TypeScript compile + Vite bundle) and `npm start` (Express server serving dist/ folder on port 5000).

**Automatic Artwork Enrichment System:**
- Replaced 5 demo artworks with **30 real artworks** from irenart.studio Shopify store.
- Implemented **automatic artwork enrichment pipeline**:
  - `fetchProductByHandle()` in `src/shopify.ts`: Fetches individual product details (title, imageUrl, description) from Shopify Storefront API with dual env support (browser + Node.js).
  - `scripts/enrichArtworks.ts`: Automated script that fetches all 30 artworks from Shopify and extracts dimensions from product titles using regex (`(\d+)\s*x\s*(\d+)\s*cm`).
  - `npm run enrich`: Command to re-run enrichment and update `src/data/artworks.json` with fresh Shopify data.
- **Handle-based merging**: Studio, Showcase, and LiveDemoMock now merge Shopify API data with enriched local data:
  - Preserves `widthCm`, `heightCm`, `buyUrl` from `artworks.json`.
  - Gets fresh `imageUrl` and `title` from Shopify GraphQL.
  - Uses product `handle` (not GraphQL ID) for consistent artwork identification.
- **True-to-scale sizing**: Studio auto-populates artwork dimensions when selection changes via `useEffect` hook.
- **buyUrl system**: "View & Buy on Shopify" button now links to real irenart.studio product pages.
- **All 30 artworks successfully enriched** with Shopify CDN imageUrl and accurate real-world dimensions extracted from product data.

**UI Modernization Completed:**
- Added new `.rv-*` CSS system (navy/electric-blue/purple/gold palette) alongside existing Tailwind utilities for flexible modern styling.
- Modernized landing page Hero section with `.rv-hero` layout and mockup card featuring gradient artwork.
- Updated "How It Works" section with `.rv-step-card` components showing numbered badges (1, 2, 3).
- Applied modern button styles (`.rv-btn-primary` electric blue, `.rv-btn-secondary` outline).
- Created new **Simple Visualizer** route (`#/simple`) with toolbar + canvas + gallery layout using modern `.rv-*` styles.
- Fixed critical rendering issues:
  - Removed static HTML from `index.html` (was preventing React from rendering).
  - Added `@tailwind` directives to `index.css` (Tailwind wasn't generating classes).
  - Removed undefined `font-body` class and set Poppins globally on body element.
  - Added `--accent` CSS variable for compatibility with existing components.
- **All existing functionality preserved**: Studio, Shopify integration, presets, wall masking, true-to-scale sizing.

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS, featuring a **Blue (#8BADE5)** color scheme and Poppins typography.

**UI/UX Decisions:**
- **Color Scheme**: Primary color is Blue (#8BADE5) with black text for contrast.
- **Typography**: Poppins sans-serif for all text, with an increased base font size of 19px for readability.
- **Background**: Canva-style mesh background with blurred shapes for modern depth.
- **Layout**: Three-panel Canvy-style editor for the studio mode, accessible via `#/studio`.
- **Responsive Design**: Mobile-first approach using Tailwind CSS.
- **Iconography**: All icons are inline SVG components.
- **Clean Embedding**: Both TopNav and SiteFooter are conditionally hidden on the `#/studio` route for iframe embedding in Shopify, showing only the pure Studio UI (scene browser, canvas, controls).

**Technical Implementations & Feature Specifications:**
- **Hash Routing**: `/` (landing page), `#/studio` (editor), `#/privacy` (privacy policy).
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Grid of 10 room preset thumbnails with active scene highlighting.
    - **Center Panel (Canvas)**: Displays selected room photo.
        - **Wall Recolor System**: Uses PNG alpha masks to isolate and recolor wall areas via CSS `mask-image`.
        - **User Photo Upload**: Allows users to upload their own wall photos, disabling the wall color picker.
        - **Artwork Overlay**: Displays artwork centered in a preset `safeArea` with true-to-scale sizing.
    - **Right Panel (Controls)**:
        - **Artwork Selector**: Dropdown to select artworks from a local catalog or Shopify.
        - **Size Controls**: Numeric inputs for width/height (cm/in), lock ratio toggle, and quick-pick size buttons.
        - **Frame Options**: Placeholder for future frame selection.
- **Landing Page Components**:
    - **TopNav**: Sticky header with navigation links and a "Try Studio" CTA.
    - **Hero Section**: "Visualize art on your walls" title with CTA buttons.
    - **Showcase Carousel**: Auto-rotating preview of rooms and artworks, cycling every 3 seconds.
    - **Live Demo Mock**: Includes photo upload, room presets, wall color picker, and artwork size display.
    - **How It Works, Pricing, DocsEmbed, FAQ sections**.
    - **SiteFooter**: Contains newsletter and contact forms (demo-only functionality).
- **System Design Choices**:
    - **Project Structure**: Organized with `public/`, `src/`, and configuration files.
    - **Data Management**: Room presets defined in `src/data/presets.json` with `id`, `name`, `photo`, `mask` paths, and `safeArea` coordinates.
    - **Deployment**: Configured for Autoscale with `npm run build` and `npm start` commands, running an Express server (`server.js`) to serve static files.

## External Dependencies
- **React**: UI library.
- **React DOM**: React renderer.
- **TypeScript**: For type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS & Autoprefixer**: CSS processing.
- **@vitejs/plugin-react**: Vite plugin for React support.
- **Shopify Storefront API**: Integration for fetching artworks from Shopify collections. (Requires `VITE_SHOPIFY_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN`, `VITE_ROOMVIBE_COLLECTION_HANDLE` environment variables).
- **Node.js**: Runtime environment.
- **npm**: Package manager.
- **Express**: Node.js web application framework used in `server.js` for serving the production build.