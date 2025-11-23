# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application designed to visualize artwork in various room environments using a Canvy-style three-panel editor. Its core purpose is to allow users to see how artworks would look on their walls, featuring functionalities like true-to-scale sizing and the potential for wall recoloring. The application aims to provide a modern, user-friendly art visualization experience, ready for integration with e-commerce platforms like Shopify.

## Recent Changes (November 23, 2025)
**REAL-SCALE RENDERING SYSTEM IMPLEMENTATION:**
- **True-to-size artwork rendering**: Implemented pixel-perfect real-scale rendering based on physical dimensions
  - Room wall height mapping: All 10 rooms use standardized 270cm wall height (ROOM_WALL_HEIGHTS_CM constant)
  - Pixel-to-cm ratio calculation: `pxPerCm = canvasHeightPx / wallHeightCm` (dynamically calculated per room)
  - Artwork sizing: `artworkWidthPx = art.widthCm * pxPerCm` (real physical dimensions, not percentage-based)
  - Frame thickness mapping: None=0cm, Slim=3cm, Gallery=8cm (FRAME_THICKNESS_CM constant)
- **Correct frame behavior**: Frames now render OUTSIDE artwork without shrinking it
  - CSS border applied to artwork container with exact pixel dimensions
  - Frame thickness converted to pixels using same pxPerCm ratio
  - Simplified single-element structure for accurate rendering
- **UI simplification to maintain scale integrity**:
  - Removed interactive resize handles (drag-to-move still functional)
  - Removed manual size input controls (width/height/unit toggle/lock ratio)
  - Added "Real size: X × Y cm" display under artwork selector
  - Artwork automatically displays at true physical scale based on room wall height
- **Room preset images & labels** (completed earlier):
  - All 10 room background images updated with new professional mockup photos
  - Room labels simplified from "Artplacer Room X" to "Room X"
- Production build successful (195.15 kB), all changes deployed and architect-reviewed

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS.

**UI/UX Decisions:**
- **Color Scheme**: Primary color is Blue (#8BADE5) with black text.
- **Typography**: Poppins sans-serif for all text, with an increased base font size of 19px.
- **Background**: Canva-style mesh background with blurred shapes.
- **Layout**: Three-panel Canvy-style editor (`#/studio`), responsive and mobile-first.
- **Iconography**: Inline SVG components.
- **Clean Embedding**: TopNav and SiteFooter are hidden on `#/studio` for iframe embedding.
- **Artwork Interaction**: Drag-to-move with automatic bounds checking. Artwork displays at true physical scale based on room wall height (270cm) and artwork dimensions from Shopify. Frame selector applies borders outside the artwork without shrinking it.

**Technical Implementations & Feature Specifications:**
- **Routing**: Hash routing for landing page (`/`), editor (`#/studio`), and privacy policy (`#/privacy`).
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Grid of 10 room preset thumbnails.
    - **Center Panel (Canvas)**: Displays selected room photo, supports user photo upload.
        - **Artwork Overlay**: Real-scale rendering system using pixel-perfect sizing based on physical dimensions
            - Wall heights: All rooms standardized to 270cm (ROOM_WALL_HEIGHTS_CM)
            - Sizing calculation: `artworkWidthPx = art.widthCm * (canvasHeightPx / 270)`
            - Drag-to-move enabled with bounds checking (resize handles removed)
            - Frame rendering: CSS borders applied OUTSIDE artwork (None=0cm, Slim=3cm, Gallery=8cm)
        - **Wall Recolor System**: Temporarily disabled; wall mask files exist but are not rendered.
    - **Right Panel (Controls)**: Artwork selector, real-size display (X × Y cm), frame selector (None/Slim/Gallery), reset position button.
    - **Artwork Data**: Uses `overlayImageUrl` for clean artwork images in the Studio to avoid mockups.
- **Landing Page Components**: Includes TopNav, Hero section, Showcase Carousel (auto-rotating), Live Demo Mock (with photo upload, room presets, artwork size), How It Works, Pricing, DocsEmbed, FAQ sections, and SiteFooter.
- **Artwork Enrichment**: Automated script (`scripts/enrichArtworks.ts`) to fetch product details and dimensions from Shopify, populating a local `src/data/artworks.json` which serves as the single source of truth for artwork data.
- **Real-Scale Rendering**: Pixel-perfect artwork sizing based on physical dimensions (cm) and room wall height (270cm), with frame borders added outside the artwork without shrinking it.
- **Deployment**: Configured for Autoscale using `npm run build` and `npm start` with an Express server (`server.js`) serving static files.

## External Dependencies
- **React**: UI library.
- **React DOM**: React renderer.
- **TypeScript**: For type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS & Autoprefixer**: CSS processing.
- **@vitejs/plugin-react**: Vite plugin for React support.
- **Shopify Storefront API**: Used for artwork data enrichment via `fetchProductByHandle()` (requires `VITE_SHOPIFY_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN` environment variables).
- **Node.js**: Runtime environment.
- **npm**: Package manager.
- **Express**: Node.js web framework for serving the production build (`server.js`).