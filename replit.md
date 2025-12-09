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
- **Subscription Management**: Full Stripe integration for five plans (Free, Artist, Designer, Gallery, All-Access) handling checkout, customer portal, and webhook events to manage user roles and entitlements.
- **Multi-Entitlement System**: Users can accumulate and retain access to multiple modules (Artist, Designer, Gallery) via additive subscriptions.
- **Unified Widget System**: A single embeddable JavaScript widget adapts its functionality based on user entitlements (Artist, Designer, Gallery modes).
- **Virtual Exhibition Editor**: MVP feature for Gallery plan users to create immersive virtual exhibitions. It includes preset selection, artwork placement via drag-and-drop, and scene persistence.
- **360° Virtual Exhibition**: Immersive 3D gallery experience using React Three Fiber (R3F) featuring:
  - ArtPlacer-style professional gallery aesthetics with warm gray walls (#ddd8d0), concrete floor, and cream ceiling
  - Modern ceiling with dark beams and visible spotlight fixtures
  - Gallery spotlights casting warm light cones on artwork walls (properly targeted via scene attachment)
  - Premium framing with dark wood frame (#2a2420), white passepartout mat, and wall offset for 3D depth
  - True-to-scale artwork rendering: cm dimensions convert to meters, only scaling down when exceeding slot bounds
  - Camera constraints preventing floor/ceiling "escape" and limiting zoom distance
  - Expanded gallery dimensions (18x14m) with eye-level viewing positions
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