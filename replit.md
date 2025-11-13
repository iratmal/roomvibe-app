# RoomVibe Landing Page - Full Version

## Overview
RoomVibe Landing Page is a comprehensive React/TypeScript marketing website with advanced features for showcasing the RoomVibe widget. Built with React 18, TypeScript, Vite, and Tailwind CSS.

**Current State**: Full-featured landing page with photo upload and custom sizing  
**Last Updated**: November 13, 2025

## Recent Changes
- November 13, 2025: Imported full version (roomvibe-replit-full.zip)
  - **NEW: Photo upload** - Users can upload their own wall photos
  - **NEW: Custom artwork sizes** - Free input with ratio lock functionality
  - **NEW: Smart wall color hiding** - Wall color picker hidden when photo uploaded
  - **NEW: Enhanced FAQ** - 10 detailed questions and answers
  - **NEW: Footer with forms** - Newsletter signup + Contact form with turquoise background
  - **NEW: Hash routing** - Privacy page accessible via #/privacy
  - Uppercase hero title: "VISUALIZE ART ON YOUR WALLS"
  - Fixed missing icons (UploadIcon, InfoIcon, HomeIcon, CopyIcon)
  - Updated Vite config with allowedHosts for app.roomvibe.app
  - Configured for Node.js autoscale deployment

## Project Architecture

### Structure
```
roomvibe/
├── public/              # Static assets (art images, room backgrounds)
│   ├── art/            # Artwork images
│   ├── rooms/          # Room preset images
│   └── artworks.json   # Artwork catalog data
├── src/
│   ├── App.tsx         # Main landing page (992 lines)
│   ├── main.tsx        # React entry point
│   └── index.css       # Global styles with Tailwind + CSS variables
├── vite.config.ts      # Vite config (port 5000, allowedHosts)
├── tailwind.config.js  # Tailwind CSS config
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

### Key Components & Features

#### 1. TopNav
- Sticky header with backdrop blur
- Mobile hamburger menu
- Navigation links: Demo, How it works, Pricing, Docs, FAQ
- "Get started" CTA button

#### 2. Hero Section
- **Uppercase title**: "VISUALIZE ART ON YOUR WALLS"
- Subheadline with value proposition
- Two CTA buttons: "Try Live Demo ▶" and "Add to Website →"

#### 3. LiveDemoMock (Enhanced)
- **Photo Upload Button** - Users can upload their wall photo
- **Room Presets** - Living room, Hallway, Bedroom buttons
- **Wall Color Picker** - Hidden when user uploads photo
- **Custom Artwork Size** - Free text input with lock ratio toggle
- **Artwork Size Display** - Shows dimensions in cm
- **Info Modal** - Explains true-to-size calculation

#### 4. HowItWorks
- 3-step process with icons
- Steps: Pick a room, Customize size/frame, Get instant preview

#### 5. Pricing
- 3 pricing tiers: Starter, Professional, Enterprise
- Feature comparison table
- "Choose plan" CTA buttons

#### 6. DocsEmbed
- Soft background panel (new design)
- Step-by-step integration guide
- Code examples with syntax highlighting
- Copy button for code snippets

#### 7. FAQ (Enhanced)
- **10 detailed questions** (increased from 6)
- Accordion interface with ChevronDown icons
- Topics: embedding, customization, pricing, technical details

#### 8. SiteFooter (Enhanced)
- **Turquoise background** with white text
- **Newsletter Form** - Email signup with submit button
- **Contact Form** - Name, email, message with send button
- Product links, Legal links, Contact info
- Copyright notice

#### 9. Privacy Page
- Accessible via #/privacy hash route
- Short GDPR-compliant privacy policy
- Controller info: Lumina Start j.d.o.o., Zagreb

### Theme & Styling
- **Primary Color**: Turquoise/Cyan (`--accent: #06B6D4`)
- **Secondary Color**: Light Cyan (`--accent-2: #22D3EE`)
- **Text**: Slate gray (`#0F172A`)
- **Background**: Gradient from slate-50 to white
- **Footer**: Turquoise background with white text

### All Icons (Inline SVG)
- Logo, MenuIcon, SparkleIcon, PlayIcon, ArrowRightIcon
- RoomIcon, RulerIcon, CodeIcon, CheckIcon, ChevronDown
- **UploadIcon** (new), **InfoIcon** (new), **HomeIcon** (new), **CopyIcon** (new)

### Dependencies
- **React** 18.2.0 - UI library
- **React DOM** 18.2.0 - React renderer
- **TypeScript** 5.0.2 - Type safety
- **Vite** 4.4.0 - Build tool and dev server
- **Tailwind CSS** 3.3.3 - Utility-first CSS
- **PostCSS** 8.4.24 + **Autoprefixer** 10.4.14 - CSS processing
- **@vitejs/plugin-react** 4.x - Vite React support

### Scripts
- `npm run dev` - Development server on 0.0.0.0:5000
- `npm run build` - Production build (tsc + vite build)
- `npm run start` - Preview production build (uses $PORT)
- `npm run preview` - Preview production build

### Build Output
```
dist/index.html      0.81 kB │ gzip:  0.43 kB
dist/assets/index.css   18.20 kB │ gzip:  4.31 kB
dist/assets/index.js   174.87 kB │ gzip: 54.50 kB
Total gzipped: ~58 KB
```

### Deployment Configuration
- **Target**: Autoscale (Node.js)
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Port**: Uses $PORT environment variable (5000 default)
- **Allowed Hosts**: app.roomvibe.app, .replit.dev, .repl.co

### Vite Configuration
```typescript
{
  server: { host: '0.0.0.0', port: 5000 },
  preview: { 
    host: '0.0.0.0', 
    port: 5000,
    allowedHosts: ['app.roomvibe.app', '.replit.dev', '.repl.co']
  }
}
```

## Key Improvements in Full Version

### User Experience
1. **Photo Upload** - Users can visualize art on their actual walls
2. **Custom Sizing** - Exact dimensions with ratio lock
3. **Smart UI** - Wall color hidden when photo uploaded
4. **Better FAQ** - 10 detailed answers vs 6 basic ones
5. **Lead Capture** - Newsletter + Contact forms in footer

### Visual Design
1. **Uppercase Hero** - Stronger visual impact
2. **Turquoise Footer** - Brand consistency
3. **Soft Backgrounds** - Better section separation
4. **Modal System** - Info overlays for help content

### Technical
1. **Hash Routing** - Privacy page without page reload
2. **Form Handling** - Newsletter and contact form state
3. **File Upload** - Image preview with FileReader API
4. **Ratio Lock** - Maintains artwork proportions

## Development Notes
- Server runs on port 5000 (Replit requirement for webview)
- Uses Node.js 20 with npm
- Hot module replacement enabled in dev mode
- All icons are inline SVG components (no external library)
- Responsive design with mobile-first approach
- SEO-friendly structure with semantic HTML
- Forms use localStorage for demo (not connected to backend)
- Photo upload displays preview but doesn't persist

## Production Readiness
- ✅ TypeScript compilation passes
- ✅ Vite build successful (~58 KB gzipped)
- ✅ All icons implemented
- ✅ Deployment config correct (autoscale)
- ✅ Custom domain support (app.roomvibe.app)
- ✅ Mobile responsive
- ✅ GDPR privacy policy included
- 🟡 Forms are demo-only (need backend integration for production)

## Next Steps for Production
1. Connect newsletter form to email service (Mailchimp, SendGrid, etc.)
2. Connect contact form to email or CRM
3. Add analytics (Google Analytics, Plausible, etc.)
4. Implement actual photo upload storage (Cloudinary, S3, etc.)
5. Add error tracking (Sentry, LogRocket, etc.)
6. Set up monitoring and alerts
