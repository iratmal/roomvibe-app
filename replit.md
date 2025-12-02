# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application for visualizing artwork in room environments using a Canvy-style three-panel editor. It enables users to preview how artworks would appear on their walls, featuring true-to-scale sizing and the potential for wall recoloring. The application provides a modern, user-friendly art visualization experience, designed for integration with e-commerce platforms. It includes a full-stack authentication system with role-based access control and robust security features, ready for e-commerce integration. The project aims to become a leading art visualization tool for artists, designers, and galleries.

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS.

**UI/UX Decisions:**
- **Color Scheme**: RoomVibe branding palette (Primary #283593, Accent #D8B46A, Neutral #DDE1E7, Text #1A1A1A).
- **Typography**: Inter font family only (SemiBold for headings, Regular for body, Medium for CTAs). Letter-spacing: -0.5px for headings, line-height: 1.15.
- **Homepage Layout**: Features a hero section, "How It Works" section, audience-specific sections (Artists, Designers, Galleries), and a CTA section, all designed for responsive display.
- **Studio Layout**: Three-panel Canvy-style editor (`#/studio`), responsive and mobile-first, with hidden TopNav and SiteFooter for iframe embedding. Responsive canvas height (400px mobile, 480px tablet, 560px desktop).
- **Iconography**: Inline SVG components with gold accent (#D8B46A).
- **Artwork Interaction**: Drag-to-move with bounds checking, diagonal resize with smart scaling, true physical scale rendering, and frame selection. Resize handles use 40px touch targets with 12px minimal visual appearance. Mobile touch handling uses direction detection (8px threshold) to differentiate between vertical scroll and horizontal drag.
- **Studio Section Styling**: Consistent uppercase tracking-wide headings, space-y-5 section rhythm, subtle bg-rv-surface/50 info cards, unified button styling.

**Technical Implementations & Feature Specifications:**
- **Routing**: Hash routing for main pages (`/`, `#/studio`, `#/login`, `#/register`, `#/dashboard`, `#/privacy`, `#/terms`, `#/upload-consent`).
- **Authentication System**: Express server with JWT, HttpOnly cookie-based authentication, bcrypt hashing, CORS protection, and PostgreSQL for user roles (user, artist, designer, gallery, admin) and RBAC.
- **Admin Role Protection**: Admin users have a dedicated `is_admin` boolean flag in the database. When `is_admin=true`, Stripe webhook handlers skip role updates, preserving admin privileges. The `/login` and `/me` endpoints compute `effectiveRole` as 'admin' when `is_admin=true`, ensuring admins always route to the Admin Dashboard regardless of subscription plan.
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Room preset thumbnails.
    - **Center Panel (Canvas)**: Displays room photos (preset or user-uploaded), real-scale artwork rendering, smart scaling, drag-to-move, and frame rendering. Room 4 has unique calibration for larger wall height.
    - **Right Panel (Controls)**: Artwork selector, real-size display, frame selector, reset button.
    - **Mobile Layout**: Canvas-first, followed by controls, then room list.
    - **Artwork Locking (Free Users)**: Free users see only 1 placeholder artwork with a locked indicator showing "+X more artworks". Clicking the locked indicator opens an upgrade modal. URL parameter bypass is blocked for free users. Paid users (Artist/Designer/Gallery/Admin) see the full artwork dropdown.
    - **Premium Room Library**: 100 premium room scenes with plan-based access limits. Free users: 3 rooms, Artist: 30 rooms, Designer/Gallery/Admin: unlimited. Locked rooms show UpgradePrompt, unlocked rooms show ComingSoonModal (placeholder until real images added). Data in `src/data/premiumRooms.ts`, limits in `src/config/planLimits.ts`.
    - **Export Features**: High-resolution image export (3000px+) and PDF export with plan-based restrictions.
      - Free users: Low-res preview (1280px) with "RoomVibe – Upgrade for High-Res" watermark. High-res and PDF buttons trigger upgrade modal.
      - Artist plan+: Full high-res image export without watermark.
      - Designer plan+: PDF export with centered image and artwork caption.
      - Export renders room background, artwork, and frame at proper scale using canvas rendering.
    - **Upgrade Nudges & Success Modal**: Subtle conversion prompts to encourage upgrades without disrupting workflow.
      - Success Modal: Shows after exports for Free/Artist users with "Your export is ready!" message and upgrade CTA.
      - Free user nudges: Text link under artwork section ("Unlock high-res export → Upgrade").
      - Artist user nudges: "Pro" badge on Premium Rooms header, hint in Export section about PDF exports.
      - Designer+ users see no upgrade prompts in Studio.
      - Components: `ExportSuccessModal`, `UpgradeNudge` (variants: text, badge, hint).
- **Artist Dashboard**: CRUD operations for artwork management (upload, list, edit, delete). Includes image upload, currency/dimension unit selection. Artwork images are base64-encoded and stored in PostgreSQL, served via API. Supports website widget embedding with dynamic artist/artwork IDs.
- **Designer Dashboard**: Project management with custom room image uploads (Multer, 10MB limit), stored as base64 in PostgreSQL. Features "Open in Studio" functionality for uploaded rooms.
- **Gallery Dashboard**: Collection management for online exhibitions with CRUD operations for collections and artworks. Supports publication status and multi-artwork uploads per collection.
- **Role-Based Dashboards**: Specific content and access controls for Artist, Designer, Gallery, User, and Admin roles. Admin users can impersonate other roles.
- **Stripe Subscriptions**: Full integration for 4 plans (User free, Artist €9/mo, Designer €29/mo, Gallery €49/mo). Includes checkout sessions, customer portal access, and webhook handling for subscription lifecycle events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`). Subscription status and plan are stored in the user database and synchronized with user roles.
- **Feature Locking by Plan**: Plan-based access control enforced on both backend (API) and frontend (UI).
  - **Config Files**: `server/config/planLimits.ts` and `src/config/planLimits.ts` define limits and features per plan.
  - **Backend Middleware**: `server/middleware/subscription.ts` provides `checkArtworkLimit`, `checkWallPhotoLimit`, `checkProjectLimit`, `checkGalleryArtworkLimit`, `requireMinimumPlan`, and `requireFeature` guards.
  - **Protected Endpoints**: `POST /api/artworks` (artwork limit), `POST /api/projects` (project limit), `POST /api/projects/:id/rooms` (wall photo limit), `POST /api/gallery/collections/:id/artworks` (gallery artwork limit), `GET /api/gallery/collections` (gallery plan required).
  - **Plan Limits**: User (1 artwork, 1 wall photo, 1 project), Artist (50 artworks, 100 walls, 100 projects, premium rooms, exports), Designer (unlimited, client folders, PDF proposals, branding), Gallery (500 artworks, gallery dashboard, multi-artist collections).
  - **Frontend Components**: `UpgradePrompt`, `UsageMeter`, `PlanFeatureBadge` for upgrade messaging and usage display.
  - **Admin Override**: Admins (`is_admin=true`) bypass all plan restrictions.
- **Analytics & GDPR**: Google Analytics 4 (GA4) and Hotjar integration, conditionally loaded based on GDPR cookie consent banner. Legal pages (Privacy Policy, Terms of Service, Upload Consent) are included.
- **Artwork Enrichment**: Automated script for fetching product details and dimensions from Shopify.
- **Real-Scale Rendering**: Pixel-perfect artwork sizing based on physical dimensions and standardized room wall height.
- **Deployment**: Configured for Autoscale using `npm run build` and `npm start` with an Express server.

## External Dependencies
- **React**: UI library.
- **TypeScript**: For type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shopify Storefront API**: Used for artwork data enrichment.
- **Node.js**: Runtime environment.
- **Express**: Node.js web framework.
- **PostgreSQL**: Database.
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT.
- **cookie-parser**: HTTP cookie parsing.
- **cors**: Cross-origin resource sharing.
- **dotenv**: Environment variable management.
- **Multer**: For handling file uploads.
- **@google-cloud/storage**: For persistent file storage via Replit Object Storage.
- **Google Analytics 4 (GA4)**: For website analytics.
- **Hotjar**: For user behavior analytics.
- **Stripe**: For subscription billing and payment processing.
- **jsPDF**: For PDF export generation.