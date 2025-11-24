# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application designed to visualize artwork in various room environments using a Canvy-style three-panel editor. Its core purpose is to allow users to see how artworks would look on their walls, featuring functionalities like true-to-scale sizing and the potential for wall recoloring. The application aims to provide a modern, user-friendly art visualization experience, ready for integration with e-commerce platforms like Shopify.

## Recent Changes (November 24, 2025)
**AUTHENTICATION BUGFIX - Production JSON.parse Error:**
- **Fixed critical JSON.parse error** on production registration:
  - Added content-type validation before parsing JSON responses (prevents crashes on HTML error pages)
  - Implemented global error handler that always returns JSON (no more HTML stack traces)
  - Fixed CORS configuration: Explicit origin whitelist instead of permissive wildcard (CSRF protection)
  - Updated production deployment to run full backend API server (`tsx server/server.ts` instead of static-only `server.js`)
  - Enhanced logging for debugging registration/login issues
  - Port configuration defaults to 5000 in production
- **Security improvements**:
  - CORS restricted to allowed origins only: `https://app.roomvibe.app` (or FRONTEND_URL env var)
  - Same-origin requests allowed (no Origin header)
  - Prevents CSRF attacks by rejecting unauthorized cross-origin authenticated requests
- **User-facing improvements**:
  - Clear error messages when server returns non-JSON responses
  - Console logging for debugging server errors
  - Graceful error handling instead of crashes

**COMPLETE MEMBERSHIP SYSTEM IMPLEMENTATION:**
- **Full-stack authentication system** with PostgreSQL backend:
  - **User Registration**: Email + password with role selection (user, artist, designer, gallery, admin)
  - **Email Confirmation**: Basic implementation (confirmation links logged to console for development)
  - **Secure Login**: Cookie-based JWT authentication with HttpOnly cookies
  - **Session Persistence**: 7-day sessions with automatic token refresh
  - **Role-Based Access Control (RBAC)**: Server-side and client-side role enforcement
- **Backend API Server** (Express on port 3001):
  - Authentication endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/verify-email`, `/api/auth/me`
  - Protected dashboard endpoints: `/api/dashboard/user`, `/api/dashboard/artist`, `/api/dashboard/designer`, `/api/dashboard/gallery`, `/api/dashboard/admin`
  - JWT middleware with cookie-only authentication (no Authorization headers)
  - Automated database schema initialization on server startup
- **Frontend Features**:
  - `AuthContext` provider wrapping entire application
  - Registration form with email, password, confirm password, role selection
  - Login form with email + password authentication
  - Protected routes requiring authentication
  - 5 role-based dashboard components with unique features per role
  - Automatic redirection for unauthenticated users
- **Security Implementation**:
  - HttpOnly cookies (XSS protection) - no localStorage token storage
  - Password hashing with bcrypt (10 rounds)
  - JWT tokens with 7-day expiration
  - CORS configured for development/production
  - Cookie-only authentication (removed Authorization header support)
  - No token exposure in JSON responses
- **Database**:
  - PostgreSQL with automated schema creation (`server/db/init.ts`)
  - Users table with id, email, password_hash, role, email_confirmed, confirmation_token, timestamps
  - Indexes on email and confirmation_token for performance
  - Connection pool managed via `server/db/database.ts`

## Recent Changes (November 23, 2025)
**HOMEPAGE REDESIGN & OPTIMIZED FULL-WIDTH HERO:**
- **Complete homepage redesign** with clean, modern layout:
  - Removed all old sections: Showcase carousel, Live Demo, Pricing, FAQ, "Why Artists Love", "Perfect For"
  - New structure: Hero section → How It Works → CTA section
  - **Hero: Centered image with embedded design and clickable overlay**
    - Displays complete `desktop_optimized.webp` (147KB, 94% optimized from 2.6MB)
    - Uses `<picture>` element with WebP primary + JPEG fallback for browser compatibility
    - Constrained to 1100px max-width, centered with horizontal padding (24px)
    - Vertical padding (24px) for breathing room
    - **Desktop scaling**: CSS transform scale(0.82) to visually shrink logo, text, and button by 18% for elegant, balanced appearance
    - **Mobile**: Full size display (no scaling) via separate responsive container
    - Natural aspect ratio (width: 100%, height: auto) - no cropping or zooming
    - Shows complete RoomVibe logo, artwork, and sofa without any cropping
    - Text and "Start Visualizing" button embedded in the hero image design
    - **Clickable transparent overlay button** positioned over the graphic button (15% from bottom, 12% from left, 260×64px, z-index: 2)
    - Single CTA - no duplicate buttons below hero
    - Mobile responsive with full-width display
  - How It Works: 3-column grid with icons (Pick a room, Select artwork, True-to-size)
  - CTA: Centered "Ready to try it?" with "Open Studio" button
  - Simplified navigation: How it works, Studio, Try Studio button
  - Minimal footer: Studio, Privacy links only
- **Performance optimization:**
  - Hero image: 164KB WebP (94% reduction from original 2.6MB)
  - Dramatically improved Largest Contentful Paint (LCP)
  - Fast loading on mobile and slow connections

**UX IMPROVEMENTS - RESIZE & FRAME FIXES:**
- **Resize functionality restored** with smart scaling limits:
  - Mockup rooms (Room 1-10): Allow 70-130% scaling from real physical size
  - User-uploaded photos: Allow 30-300% scaling (wider range since wall height unknown)
  - Diagonal resize handle accessible across all frame styles
  - Scale automatically resets to 100% when artwork changes
  - Maintains true-to-size as starting point, user can adjust within safe ranges
- **Frame behavior fixed** - frames now truly add OUTSIDE artwork:
  - Frame thickness stays at physical dimensions (3cm Slim, 8cm Gallery) regardless of artwork scale
  - Wrapper sized to totalWidthPx/totalHeightPx with border-box sizing (border included in total)
  - Inner artwork explicitly sized to artworkWidthPx/artworkHeightPx (never shrinks)
  - Frame adds to total visual size: total = artwork + 2×frame thickness
- **Default artwork changed** to "Light My Fire" for better first impression
- **Real-scale rendering system** (implemented earlier):
  - Room wall height mapping: All 10 rooms use standardized 270cm wall height
  - Pixel-to-cm ratio: `pxPerCm = canvasHeightPx / 270`
  - Artwork sizing: `artworkWidthPx = art.widthCm * pxPerCm * scale`
  - Drag-to-move with automatic bounds checking (includes frame in calculations)
- Production build successful (196.71 kB), all changes architect-reviewed and deployed

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
- **Artwork Interaction**: Drag-to-move with automatic bounds checking, diagonal resize handle with smart scaling limits (70-130% for mockups, 30-300% for user photos). Artwork starts at true physical scale (based on 270cm wall height) and can be adjusted. Frame selector applies borders outside the artwork without shrinking it, maintaining physical frame thickness regardless of scale.

**Technical Implementations & Feature Specifications:**
- **Routing**: Hash routing for landing page (`/`), editor (`#/studio`), authentication (`#/login`, `#/register`), dashboard (`#/dashboard`), and privacy policy (`#/privacy`).
- **Authentication System**:
    - **Backend API**: Express server on port 3001 with JWT authentication
    - **Cookie-Based Auth**: HttpOnly cookies with 7-day expiration, no localStorage
    - **User Roles**: user, artist, designer, gallery, admin (stored in PostgreSQL)
    - **Protected Routes**: Client-side and server-side route protection with RBAC
    - **Email Confirmation**: Basic implementation (links logged for development)
    - **Database**: Automated schema initialization on server startup
    - **Security**: bcrypt password hashing, JWT tokens, CORS protection
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Grid of 10 room preset thumbnails.
    - **Center Panel (Canvas)**: Displays selected room photo, supports user photo upload.
        - **Artwork Overlay**: Real-scale rendering system using pixel-perfect sizing based on physical dimensions
            - Wall heights: All rooms standardized to 270cm (ROOM_WALL_HEIGHTS_CM)
            - Base sizing: `artworkWidthPx = art.widthCm * (canvasHeightPx / 270) * scale`
            - Smart scaling: 70-130% for mockup rooms, 30-300% for user photos
            - Drag-to-move enabled with bounds checking (includes frame)
            - Diagonal resize handle accessible across all frame styles
            - Frame rendering: CSS borders applied OUTSIDE artwork at physical thickness (None=0cm, Slim=3cm, Gallery=8cm)
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
- **Vite**: Build tool and development server (port 5000).
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS & Autoprefixer**: CSS processing.
- **@vitejs/plugin-react**: Vite plugin for React support.
- **Shopify Storefront API**: Used for artwork data enrichment via `fetchProductByHandle()` (requires `VITE_SHOPIFY_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN` environment variables).
- **Node.js**: Runtime environment.
- **npm**: Package manager.
- **Express**: Node.js web framework for API server (port 3001) and production build serving (`server.js`).
- **PostgreSQL**: Database for user authentication and membership system.
- **bcryptjs**: Password hashing for secure authentication.
- **jsonwebtoken**: JWT token generation and verification.
- **cookie-parser**: HTTP cookie parsing middleware.
- **cors**: Cross-origin resource sharing middleware.
- **dotenv**: Environment variable management.