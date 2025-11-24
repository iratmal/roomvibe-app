# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application for visualizing artwork in room environments using a Canvy-style three-panel editor. It enables users to preview how artworks would appear on their walls, featuring true-to-scale sizing and the potential for wall recoloring. The application provides a modern, user-friendly art visualization experience, designed for integration with e-commerce platforms. It includes a full-stack authentication system with role-based access control and robust security features, ready for e-commerce integration. The project aims to become a leading art visualization tool for artists, designers, and galleries.

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS.

**UI/UX Decisions:**
- **Color Scheme**: Primary color is Blue (#8BADE5) with black text, and a consistent RoomVibe branding palette (Primary #283593, Accent #D8B46A, Neutral #DDE1E7).
- **Typography**: Inter (global default), Playfair Display (premium headings via .font-display).
- **Background**: Canva-style mesh background with blurred shapes.
- **Layout**: Three-panel Canvy-style editor (`#/studio`), responsive and mobile-first. TopNav and SiteFooter are hidden on `#/studio` for iframe embedding.
- **Iconography**: Inline SVG components.
- **Artwork Interaction**: Drag-to-move with automatic bounds checking, diagonal resize handle with smart scaling limits. Artwork starts at true physical scale and can be adjusted. Frame selector applies borders outside the artwork.

**Technical Implementations & Feature Specifications:**
- **Routing**: Hash routing for landing page (`/`), editor (`#/studio`), authentication (`#/login`, `#/register`), dashboard (`#/dashboard`), and legal pages (`#/privacy`, `#/terms`, `#/upload-consent`).
- **Authentication System**:
    - **Backend API**: Express server with JWT authentication, cookie-based (HttpOnly cookies, 7-day expiration).
    - **User Roles**: user, artist, designer, gallery, admin (stored in PostgreSQL) with Role-Based Access Control (RBAC).
    - **Security**: bcrypt password hashing, JWT tokens, CORS protection. Email confirmation is temporarily disabled. Password change functionality is available.
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Grid of room preset thumbnails.
    - **Center Panel (Canvas)**: Displays selected room photo, supports user photo upload. Features real-scale rendering with artwork overlay, smart scaling limits, drag-to-move with bounds checking, and frame rendering.
    - **Right Panel (Controls)**: Artwork selector, real-size display, frame selector, reset position button.
- **Artist Dashboard**: Provides CRUD operations for artwork management (upload, list, edit, delete artworks). Includes image upload, currency selection (EUR/USD/GBP), dimension units (cm/inches), and secure API endpoints. Database stores dimension_unit, price_amount, and price_currency fields. Buy URL opens in new tab via button (prevents auto-navigation on page load).
    - **Website Integration**: Artists can embed RoomVibe widgets on their websites. Global widget code (artist-wide) and per-artwork widget codes available. Copy-to-clipboard functionality with 3-second confirmation toast. Widget script tags use dynamic artist ID and optional artwork ID for targeted embedding.
- **Designer Dashboard**: Provides project management for client presentations. Designers can create projects with custom room image uploads (Multer, 10MB limit). Each project has title, client name, room image, and timestamps. CRUD operations via API endpoints with role-based access control. Hash-based navigation between project list and project detail views.
- **Gallery Dashboard**: Provides collection management for online exhibitions. Galleries can create curated collections with title, subtitle, description, and publication status (draft/published). Each collection can contain multiple artworks with upload functionality (Multer, 10MB limit). Database schema includes gallery_collections and gallery_artworks tables with foreign keys and CASCADE deletes. API provides 7 endpoints (GET/POST/PUT/DELETE collections, GET/POST/DELETE artworks). Hash-based navigation between collection list (#/dashboard/gallery) and collection detail (#/dashboard/gallery/collection/:id) views. Features include status toggling, artwork metadata management, buy URL buttons, delete confirmations, and automatic data refresh on navigation.
- **Role-Based Dashboards**: Implemented for Artist, Designer, Gallery, User, and Admin roles, with specific content and access controls. Admin users can impersonate other roles for testing.
- **Analytics & GDPR**: Integrates Google Analytics 4 (GA4) and Hotjar, conditionally loaded based on GDPR cookie consent. A cookie consent banner and legal pages (Privacy Policy, Terms of Service, Upload Consent) are included.
- **Artwork Enrichment**: Automated script fetches product details and dimensions from Shopify, populating local data.
- **Real-Scale Rendering**: Pixel-perfect artwork sizing based on physical dimensions (cm) and standardized room wall height.
- **Deployment**: Configured for Autoscale using `npm run build` and `npm start` with an Express server serving static files.

## External Dependencies
- **React**: UI library.
- **TypeScript**: For type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shopify Storefront API**: Used for artwork data enrichment.
- **Node.js**: Runtime environment.
- **Express**: Node.js web framework for API server and serving static files.
- **PostgreSQL**: Database for user authentication and membership system.
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT token generation and verification.
- **cookie-parser**: HTTP cookie parsing middleware.
- **cors**: Cross-origin resource sharing middleware.
- **dotenv**: Environment variable management.
- **Multer**: For handling file uploads (e.g., artwork images).
- **Google Analytics 4 (GA4)**: For website analytics.
- **Hotjar**: For user behavior analytics.