# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application designed for visualizing artwork within various room environments. It offers a Canvy-style three-panel editor for previewing artworks with true-to-scale sizing and includes features like wall recoloring. The application aims to provide a modern, user-friendly art visualization experience, ready for integration with e-commerce platforms. It features a full-stack authentication system with role-based access control and robust security, targeting artists, designers, and galleries. The long-term ambition is to establish RoomVibe Studio as a leading tool in art visualization.

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS.

**UI/UX Decisions:**
- **Color Scheme**: Global brand palette (Primary #264C61, Hover #1D3A4A, Gold accent #C9A24A, Text #1A1A1A, White #FFFFFF) applied consistently across all pages including Studio, dashboards, and marketing pages. Semantic colors preserved for role differentiation (purple=Artist, indigo=Designer, green=Gallery, amber=warnings).
- **Typography**: Inter font family for all text (Bold, SemiBold, Medium, Regular).
- **Global CSS System (Dec 2024)**: CSS variables in index.css (--rv-primary #264C61, --rv-primaryHover #1D3A4A, --roomvibe-navy #264C61, --roomvibe-gold #C9A24A, --roomvibe-text #1A1A1A, --roomvibe-bg #FFFFFF). Reusable button classes (.btn-primary, .btn-outline, .btn-premium, .btn-outline-gold) for consistent styling across all pages.
- **Homepage Layout (Redesigned Dec 2024)**: Premium 5-section desktop layout (section order: Hero → User Groups → Video Section → How It Works → CTA):
    - **Hero**: Split-screen design with background image on right half (absolute w-1/2), left content on white with max-w-xl, py-24. Uses btn-primary/btn-outline classes.
    - **User Groups**: 3-column grid (gap-8), cards with border-[#EAEAEA], rounded-[16px], p-8, gold underline (w-40px h-2px #C9A24A). Titles: sentence case ("For artists"), font-semibold, var(--roomvibe-navy). Section: mt-20 mb-20.
    - **Video Section**: Moved ABOVE How It Works. 3-column grid (gap-8), 16:9 thumbnails with rounded-[16px], shadow-md, play overlay.
    - **How It Works**: 3 step cards with bg-[#FAFAFA], rounded-[16px], p-8. Icons in w-14 h-14 rounded-full bg-[#F0F0F0]. Section: py-16.
    - **Mid-Page CTA**: Centered block on #F9F9F9, py-16. Uses h2 with var(--roomvibe-navy) and btn-primary class.
    - **Footer**: Primary (#264C61) background with 4 columns (Branding, Product, Company, Newsletter). Subscribe button uses btn-primary class.
- **Header**: Logo h-20 lg:h-24, nav gap-12 spacing. Sign Up button uses primary #264C61.
- **Studio Layout (Updated Dec 2024)**: A responsive, mobile-first, three-panel editor with dynamic canvas height and hidden navigation for iframe embedding. Polished UI with 44px minimum touch targets, gold-bordered premium buttons, and consistent RoomVibe branding throughout. Desktop viewport-height layout: left/right columns use `h-[calc(100vh-160px)]` with flex-col structure. Left column has fixed header (Scenes title + category filters) with scrollable room list (`flex-1 overflow-y-auto`). Right column has scrollable settings section with Export buttons pinned at bottom (`flex-shrink-0`).
- **Iconography**: Inline SVG components with gold accent.
- **Artwork Interaction**: Drag-to-move with bounds, diagonal resizing with smart scaling, true physical scale rendering, and frame selection. Mobile touch handling differentiates between scroll and drag.

**Technical Implementations & Feature Specifications:**
- **Routing**: Utilizes hash routing for all main application pages.
- **Authentication System**: Express.js backend with JWT, HttpOnly cookies, bcrypt, CORS, and PostgreSQL for user management, roles (user, artist, designer, gallery, admin), and RBAC. Admin roles bypass plan restrictions and have dedicated dashboard access.
- **Studio Mode**:
    - **Interface**: Left panel for scene browsing, center canvas for artwork visualization, and a right panel for controls (artwork, size, frame selection). Mobile prioritizes canvas, then controls, then room list.
    - **Artwork Access**: Free users are limited to a placeholder artwork, with an upgrade path for full artwork selection. Paid users have full access.
    - **Premium Room Library (Updated Dec 2024)**: 70 premium room scenes across 3 categories (Bathroom: 14, Bedroom: 24, Cafe: 32). Located in `public/rooms/{category}/` with data in `src/data/premiumRooms.ts`. Tiered access based on subscription plan.
    - **Export Features**: Supports image (regular 1200px, high-res 3000px) and PDF exports with plan-based restrictions and watermarking for free users. Upgrade nudges are integrated into the export flow.
- **Role-Based Dashboards**:
    - **User Dashboard (Dec 2024)**: Dedicated dashboard for FREE plan users (plan = 'free' or 'user'). Features: artwork upload (max 3), My Artworks grid with edit/delete, Studio access. Does NOT include widget code or premium features. Located in `src/components/dashboards/UserDashboard.tsx`. Routing in `DashboardRouter` uses `effectivePlan` to determine dashboard type (subscription-based, not role-based).
    - **Artist Dashboard**: CRUD for artwork management, including image uploads and website widget embedding. Available to paid Artist plan subscribers.
    - **Designer Dashboard**: Project management and custom room image uploads.
    - **Gallery Dashboard**: Collection management for online exhibitions.
    - Paid users (Artist/Designer/Gallery/All-Access) access a unified dashboard with sidebar navigation and module-specific content. Sidebar features grouped sections (Artist Tools, Designer Tools, Gallery Tools), locked modules show "Upgrade to unlock X Tools" subtext, and uses polished spacing (12px 18px padding, 20px icons, 10px gaps).
- **Stripe Subscriptions**: Full integration for five plans (Free, Artist, Designer, Gallery, All-Access) handling checkout, customer portal, and webhook events to manage user roles and entitlements.
- **Plan Tiers & Room Access (Updated Dec 2024)**:
    - **Free/User** (€0): 3 artworks, 10 basic rooms, basic export, watermarked downloads
    - **Artist** (€9/mo): 50 artworks, up to 30 standard rooms, widget embed, buy button integration
    - **Designer** (€29/mo): 100 artworks, 100+ premium rooms, high-res export, PDF export, Designer Studio
    - **Gallery** (€49/mo): Unlimited artworks, 100+ premium rooms, 3 active exhibitions, 20 PDF/month
    - **All-Access** (€79/mo): Unlimited everything, future premium packs, priority support
- **Room Tier System (Updated Dec 2024)**: Rooms tagged with `tier` property ('basic', 'standard', 'premium') and `basicFree` boolean in `src/data/premiumRooms.ts`:
    - **Basic Rooms (10)**: Free plan - Bathroom 7/10, Bedroom 4/5/6, Kitchen 18/19, Living Room 12/16/21
    - **Standard Rooms (20 additional)**: Artist plan - Bathroom 1-3, Bedroom 1-3/7-10, Kitchen 1-5, Living Room 1-5
    - **Premium Rooms (remaining)**: Designer/Gallery/All-Access - All remaining rooms
    - Room filtering logic in Studio's `filterRoomsByPlan()` function; admin bypasses all restrictions
- **Pricing Page**: Modular pricing page (`#/pricing`) with 4 plan cards using new brand colors. Feature comparison table with primary (#264C61) and gold (#C9A24A) text colors. Entitlement-based Active badges shown above disabled buttons when plan is active.
- **Billing Page**: Dedicated billing management page (`#/billing`) with 3-section layout:
    - **Active Modules**: Primary pill cards showing current entitlements (background #E8EBF7, border-left #264C61).
    - **Available Plans**: Gold-bordered upgrade cards (1.5px solid #C9A24A) with btn-outline-gold unlock buttons.
    - **Billing Management**: btn-primary "Manage Billing" button (Stripe portal) and btn-outline "View All Plans" button.
- **Multi-Entitlement System**: Users can accumulate and retain access to multiple modules (Artist, Designer, Gallery) via subscriptions. Entitlements are additively granted and revoked upon subscription changes. Admin users automatically possess all entitlements.
- **Unified Widget System**: A single embeddable JavaScript widget (`public/widget.js`) that dynamically adapts its functionality (Artist, Designer, Gallery modes) based on the user's entitlements. The widget is modal-based with RoomVibe branding and offers mode-specific layouts and controls, including advanced features for Gallery mode.
- **Gallery Exhibition Page**: Publicly accessible page for viewing published gallery collections with slideshow navigation and artwork details.
- **Feature Locking by Plan**: Comprehensive access control enforced on both frontend and backend through dedicated configuration files and middleware, based on subscription plans and defined limits for artworks, wall photos, and projects.
- **Hybrid Upgrade Flow (Dec 2024)**: Linear upgrade recommendations in modals (Free→Artist→Designer→Gallery→All-Access based on feature requested), but pricing page allows any upgrade. Upgrade logic in `src/utils/upgradeLogic.ts` with `getRecommendedUpgradePlan()` function.
- **Onboarding Flow**: 3-screen intro wizard (`#/onboarding`) for first-time users:
    - **Screen 1 - Welcome**: Three module cards (Artist, Designer, Gallery) explaining what each does.
    - **Screen 2 - How It Works**: Three feature rows (Upload, Preview, Embed) with icons.
    - **Screen 3 - Set Up Workspace**: Interactive checklist and gold-bordered upgrade reminder.
    - Skip functionality and step dots indicator; onboarding_completed flag stored in database.
- **Analytics & GDPR**: Google Analytics 4 and Hotjar integration, loaded conditionally based on cookie consent. Legal pages (Privacy Policy, Terms of Service, Upload Consent) are included.
- **Artwork Enrichment**: Automated script for fetching product details and dimensions from Shopify.
- **Real-Scale Rendering**: Achieves pixel-perfect artwork sizing using physical dimensions and standardized room wall heights.
- **Deployment**: Configured for Autoscale using `npm run build` and `npm start` with an Express server.

## External Dependencies
- **React**: UI library.
- **TypeScript**: For type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shopify Storefront API**: Artwork data enrichment.
- **Node.js**: Runtime environment.
- **Express**: Node.js web framework.
- **PostgreSQL**: Database.
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT.
- **cookie-parser**: HTTP cookie parsing.
- **cors**: Cross-origin resource sharing.
- **dotenv**: Environment variable management.
- **Multer**: File uploads.
- **@google-cloud/storage**: Persistent file storage (via Replit Object Storage).
- **Google Analytics 4 (GA4)**: Website analytics.
- **Hotjar**: User behavior analytics.
- **Stripe**: Subscription billing and payments.
- **jsPDF**: PDF export generation.