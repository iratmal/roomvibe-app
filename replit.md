# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application designed to visualize artwork in various room environments using a Canvy-style three-panel editor. Its core purpose is to allow users to see how artworks would look on their walls, featuring functionalities like true-to-scale sizing and the potential for wall recoloring. The application aims to provide a modern, user-friendly art visualization experience, ready for integration with e-commerce platforms like Shopify.

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
- **Artwork Interaction**: Extended drag area for artwork movement and interactive resize handles for direct canvas resizing, maintaining aspect ratio with "Lock ratio". Artwork automatically re-clamped within bounds after resize.

**Technical Implementations & Feature Specifications:**
- **Routing**: Hash routing for landing page (`/`), editor (`#/studio`), and privacy policy (`#/privacy`).
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Grid of 10 room preset thumbnails.
    - **Center Panel (Canvas)**: Displays selected room photo, supports user photo upload.
        - **Artwork Overlay**: Displays artwork centered with true-to-scale sizing, allowing drag-to-move and resize via handles.
        - **Wall Recolor System**: Temporarily disabled; wall mask files exist but are not rendered.
    - **Right Panel (Controls)**: Artwork selector, manual size inputs (cm/in) with lock ratio toggle, and placeholder for frame options.
    - **Artwork Data**: Uses `overlayImageUrl` for clean artwork images in the Studio to avoid mockups.
- **Landing Page Components**: Includes TopNav, Hero section, Showcase Carousel (auto-rotating), Live Demo Mock (with photo upload, room presets, artwork size), How It Works, Pricing, DocsEmbed, FAQ sections, and SiteFooter.
- **Artwork Enrichment**: Automated script (`scripts/enrichArtworks.ts`) to fetch product details and dimensions from Shopify, populating a local `src/data/artworks.json` which serves as the single source of truth for artwork data.
- **Frame Functionality**: Implemented working Frame selector (None, Slim, Gallery) applying CSS styling to artwork preview.
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