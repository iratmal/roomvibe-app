# RoomVibe Studio - Full Application

## Overview
RoomVibe Studio is a comprehensive React/TypeScript web application designed to visualize artwork in various room environments using a Canvy-style three-panel editor. Its core purpose is to allow users to see how artworks would look on their walls, featuring functionalities like true-to-scale sizing and the potential for wall recoloring. The application aims to provide a modern, user-friendly art visualization experience, ready for integration with e-commerce platforms like Shopify. It includes a full-stack authentication system with role-based access control and robust security features.

## Recent Changes (November 24, 2025)
**ROLE-BASED DASHBOARDS:**
- **Implemented complete role-based dashboard system**:
  - Three professional dashboards: Artist, Designer, Gallery (plus User and Admin)
  - Role-specific routing with access control:
    - `#/dashboard` → Auto-routes based on user role
    - `#/dashboard/artist` → Artist Dashboard (artist role only)
    - `#/dashboard/designer` → Designer Dashboard (designer role only)
    - `#/dashboard/gallery` → Gallery Dashboard (gallery role only)
  - Unauthorized access prevented: Wrong role redirects to correct dashboard
  - Each dashboard includes Change Password feature
- **Artist Dashboard placeholders**:
  - Upload Artwork, My Artworks, Analytics
  - Purple-themed account section
- **Designer Dashboard placeholders**:
  - My Projects, Upload Project, PDF/Moodboard Export
  - Indigo-themed account section
- **Gallery Dashboard placeholders**:
  - Upload Collection, My Collection, Online Exhibition Builder
  - Green-themed account section
- **Security implementation**:
  - Role-based access control (RBAC) on all dashboard routes
  - Unauthenticated users redirected to login
  - Users cannot access dashboards for other roles
  - Clean separation of concerns for future admin features

**PASSWORD CHANGE FEATURE:**
- **Added "Change Password" functionality inside all dashboards**:
  - Secure password update form with current password verification
  - Validation: Current password check, new password length (≥6 chars), password match confirmation
  - Real-time error/success messaging with color-coded UI
  - Auto-clears form fields after successful password change
  - Backend endpoint: POST /api/auth/change-password (JWT protected)
  - Password hashing with bcrypt before database update
  - Comprehensive error handling for authentication failures and validation errors
- **Available on all dashboards**: User, Artist, Designer, Gallery, Admin

**MVP: EMAIL CONFIRMATION DISABLED (Auto-Login):**
- **Temporarily disabled email confirmation** to unblock users for MVP:
  - New users auto-verified on registration (`email_confirmed = true`)
  - Registration automatically logs users in (JWT cookie set immediately)
  - Redirect to dashboard after 1.5 seconds
  - Login endpoint no longer blocks unverified users
- **Auto-login flow**:
  - Register → Backend sets HttpOnly cookie → Frontend updates auth state → Redirect to dashboard
  - Seamless user experience: register once, immediately use the app
  - No manual login step required after registration
- **Future extensibility**:
  - Email confirmation infrastructure preserved (confirmation_token still generated)
  - Can re-enable by changing one boolean and adding email provider
  - No architectural changes needed for future email implementation

## User Preferences
I prefer simple language in explanations. I like functional programming paradigms where applicable. I want iterative development, with small, testable changes. Ask before making major architectural changes or introducing new dependencies. I prefer detailed explanations for complex logic. Do not make changes to files in the `public/presets` folder. Do not make changes to the `server.js` file.

## System Architecture
The application is built with React 18, TypeScript, Vite, and Tailwind CSS.

**UI/UX Decisions:**
- **Color Scheme**: Primary color is Blue (#8BADE5) with black text.
- **Typography**: Poppins sans-serif for all text, with an increased base font size of 19px.
- **Background**: Canva-style mesh background with blurred shapes.
- **Layout**: Three-panel Canvy-style editor (`#/studio`), responsive and mobile-first. TopNav and SiteFooter are hidden on `#/studio` for iframe embedding.
- **Iconography**: Inline SVG components.
- **Artwork Interaction**: Drag-to-move with automatic bounds checking, diagonal resize handle with smart scaling limits (70-130% for mockups, 30-300% for user photos). Artwork starts at true physical scale (based on 270cm wall height) and can be adjusted. Frame selector applies borders outside the artwork without shrinking it, maintaining physical frame thickness regardless of scale.

**Technical Implementations & Feature Specifications:**
- **Routing**: Hash routing for landing page (`/`), editor (`#/studio`), authentication (`#/login`, `#/register`), dashboard (`#/dashboard`), and privacy policy (`#/privacy`).
- **Authentication System**:
    - **Backend API**: Express server with JWT authentication, cookie-based (HttpOnly cookies, 7-day expiration).
    - **User Roles**: user, artist, designer, gallery, admin (stored in PostgreSQL) with Role-Based Access Control (RBAC).
    - **Security**: bcrypt password hashing, JWT tokens, CORS protection. Email confirmation is implemented but temporarily disabled for MVP. Password change functionality is available.
- **Studio Mode**:
    - **Left Panel (Scene Browser)**: Grid of 10 room preset thumbnails.
    - **Center Panel (Canvas)**: Displays selected room photo, supports user photo upload. Features real-scale rendering with artwork overlay, smart scaling limits, drag-to-move with bounds checking, and frame rendering that adds physical thickness borders outside the artwork. Wall recolor system is temporarily disabled.
    - **Right Panel (Controls)**: Artwork selector, real-size display (X × Y cm), frame selector (None/Slim/Gallery), reset position button.
- **Landing Page Components**: Includes TopNav, Hero section, How It Works, and SiteFooter.
- **Artwork Enrichment**: Automated script (`scripts/enrichArtworks.ts`) fetches product details and dimensions from Shopify, populating `src/data/artworks.json`.
- **Real-Scale Rendering**: Pixel-perfect artwork sizing based on physical dimensions (cm) and standardized room wall height (270cm).
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