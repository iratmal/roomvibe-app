# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application for visualizing artwork within diverse room environments. It features a Canvy-style three-panel editor with true-to-scale sizing, wall recoloring, and e-commerce integration capabilities. The application includes full-stack authentication with role-based access control and robust security, catering to artists, designers, and galleries. The project aims to become a leading tool in art visualization, offering a modern and user-friendly experience.

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS.

**UI/UX Decisions:**
- **Consistent Branding**: Global brand palette, Inter font family, and a global CSS system using variables ensure a cohesive look across all pages (Studio, dashboards, marketing).
- **Responsive Layouts**: Premium 5-section homepage, a responsive three-panel Studio editor with dynamic canvas height and hidden navigation, and mobile-first design principles.
- **Interactive Elements**: Drag-to-move and resize artwork, gold-accented iconography, and a polished UI with accessible touch targets.

**Technical Implementations & Feature Specifications:**
- **Authentication & Authorization**: Express.js backend with JWT, HttpOnly cookies, bcrypt, CORS, and PostgreSQL manages user authentication, role-based access control (user, artist, designer, gallery, admin), and entitlements.
- **Studio Editor**: Features a left panel for scene browsing, a central canvas for artwork visualization, and a right panel for controls (artwork, size, frame selection). Includes AI-suggested rooms, premium room libraries, and tiered access based on subscription plans. Supports image (1200px, 3000px) and PDF exports with plan-based restrictions and watermarking.
- **Role-Based Dashboards**: Dedicated dashboards for users, artists, designers, and galleries, providing CRUD operations for artworks, project management, and widget embedding. Paid users access a unified dashboard with modular content.
- **Designer Connect (FAZA 1)**: Designer Dashboard features a tabbed interface with four sections:
  - Art Library: Browse artworks from artists who have enabled "Visible to Designers", with filters for style, medium, orientation, color, and dimensions
  - My Projects: Create and manage client visualization projects
  - Project Boards: View and manage artworks saved to projects from the Art Library
  - Sent Messages: Track inquiries sent to artists about their work
- **Gallery Connect (FAZA 1)**: Gallery Dashboard features a tabbed interface with three sections:
  - Gallery Hub: Manage artworks, exhibitions, collections, and account settings
  - Artist Directory: Browse artists who have enabled "Visible to Galleries", with filters for style, medium, availability, dimensions, and location
  - Sent Messages: Track inquiries sent to artists about exhibitions and collaborations
  - Connect status widget showing available artists and contacted count
  - Note: Gallery sees only Artists (not Designers), no designer projects/interiors visible
- **Subscription Management**: Full Stripe integration for five plans (Free, Artist, Designer, Gallery, All-Access) handling checkout, customer portal, and webhook events to manage user roles and entitlements.
- **Multi-Entitlement System**: Users can accumulate and retain access to multiple modules (Artist, Designer, Gallery) via additive subscriptions.
- **Unified Widget System**: A single embeddable JavaScript widget adapts its functionality based on user entitlements (Artist, Designer, Gallery modes).
- **Virtual Exhibition Editor**: MVP feature for Gallery plan users to create immersive virtual exhibitions. It includes preset selection, artwork placement via drag-and-drop, and scene persistence.
- **360° Virtual Exhibition**: Immersive 3D gallery experience using React Three Fiber (R3F) featuring:
  - Modern Gallery v2: High-realism museum space (24x6x18m) with white walls, wood floor, black columns, and skylights
  - Classic Gallery: Original warm-toned gallery space (18x4.2x14m) preserved for compatibility
  - Artwork textures use meshBasicMaterial (lighting-independent) for reliable rendering
  - Image proxy endpoint (`/api/image-proxy`) handles CORS for external artwork URLs with SSRF protection
  - Advanced lighting: Skylights with rect area lights, wall spotlights, hemisphere and directional lights
  - Procedural wood floor with plank texture overlay for realism
  - Black structural columns positioned throughout the gallery space
  - Thin dark frames around artworks for professional presentation
  - Street-View style navigation with pulsing floor hotspots and smooth camera transitions
  - Camera constraints with configurable polar angle limits
- **Onboarding Flow**: A 3-screen introductory wizard for first-time users, guiding them through the application's modules and features.
- **Artwork Management**: Includes artwork upload, editing, and automated enrichment from Shopify.
- **Real-Scale Rendering**: Achieves accurate artwork sizing using physical dimensions and standardized room wall heights.
- **Feature Locking**: Comprehensive access control enforced on both frontend and backend based on subscription plans and defined limits.
- **Hybrid Upgrade Flow**: Linear upgrade recommendations with the flexibility to select any plan from the pricing page.
- **Deployment**: Configured for Autoscale with `npm run build` and `npm start` using an Express server.

## External Dependencies
- **React**: UI library.
- **TypeScript**: Type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shopify Storefront API**: Artwork data enrichment.
- **Node.js**: Runtime environment.
- **Express**: Web framework.
- **PostgreSQL**: Database.
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT.
- **cookie-parser**: HTTP cookie parsing.
- **cors**: Cross-origin resource sharing.
- **dotenv**: Environment variable management.
- **Multer**: File uploads.
- **@google-cloud/storage**: Persistent file storage (Replit Object Storage).
- **Google Analytics 4 (GA4)**: Website analytics.
- **Hotjar**: User behavior analytics.
- **Stripe**: Subscription billing and payments.
- **jsPDF**: PDF export generation.
- **React Three Fiber (@react-three/fiber)**: React renderer for Three.js, used for 360° Virtual Exhibition.
- **@react-three/drei**: Useful helpers and abstractions for React Three Fiber.
- **Three.js**: 3D graphics library for WebGL rendering.