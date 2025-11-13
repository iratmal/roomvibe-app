# RoomVibe Landing Page

## Overview
RoomVibe Landing Page is a modern React/TypeScript marketing website showcasing the RoomVibe widget. Features hero section, live demo preview, pricing, documentation, and FAQ. Built with React 18, TypeScript, Vite, and Tailwind CSS.

**Current State**: Fully functional landing page  
**Last Updated**: November 13, 2025

## Recent Changes
- November 13, 2025: Imported new landing page
  - Replaced widget demo app with full landing page
  - Implemented sticky navigation with mobile menu
  - Created Hero section with "Visualize Art on Your Walls" headline
  - Added Live Demo preview section with room/wall controls
  - Built How It Works stepper (3 steps)
  - Implemented Pricing component (3 tiers)
  - Added Documentation embed section with code examples
  - Created FAQ accordion with common questions
  - Implemented Privacy Policy page
  - Fixed missing icon components (HomeIcon, CopyIcon)
  - Cleaned up old widget files and folders
  - Updated deployment configuration for Node.js autoscale

## Project Architecture

### Structure
```
roomvibe/
├── public/             # Static assets (if any)
├── src/
│   ├── App.tsx         # Main landing page component (654 lines)
│   ├── main.tsx        # React entry point
│   └── index.css       # Global styles with Tailwind + CSS variables
├── vite.config.ts      # Vite configuration (port 5000)
├── tailwind.config.js  # Tailwind CSS config
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

### Key Sections
1. **TopNav**: Sticky header with logo, navigation links, mobile menu
2. **Hero**: Main headline, subheadline, CTA buttons
3. **LiveDemoMock**: Interactive preview of room visualization
4. **HowItWorks**: 3-step process explanation
5. **Pricing**: 3-tier pricing table (Starter, Professional, Enterprise)
6. **DocsEmbed**: Code examples for widget integration
7. **FAQ**: Accordion with common questions
8. **SiteFooter**: Links, legal, contact information

### Theme
- **Primary Color**: Turquoise/Cyan (`--accent: #06B6D4`)
- **Secondary Color**: Light Cyan (`--accent-2: #22D3EE`)
- **Text**: Slate gray (`#0F172A`)
- **Background**: Gradient from slate-50 to white

### Dependencies
- **React** 18.3.1 - UI library
- **TypeScript** 5.6.3 - Type safety
- **Vite** 5.4.10 - Build tool and dev server
- **Tailwind CSS** 3.4.13 - Utility-first CSS
- **PostCSS** + **Autoprefixer** - CSS processing

### Build Commands
- `npm run dev` - Start development server (port 5000)
- `npm run build` - Build for production
- `npm run start` - Preview production build (uses $PORT)

### Deployment
- **Target**: Autoscale (Node.js)
- **Build**: `npm run build`
- **Run**: `npm start` (binds to $PORT environment variable)
- **Server**: Vite preview server on 0.0.0.0:$PORT

## Development Notes
- Server runs on port 5000 (Replit requirement for webview)
- Uses Node.js 20 with npm
- Hot module replacement enabled in dev mode
- All icons are inline SVG components (no external icon library)
- Responsive design with mobile-first approach
- SEO-friendly structure with semantic HTML
