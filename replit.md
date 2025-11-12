# RoomVibe

## Overview
RoomVibe is an embeddable React widget that lets users try artworks in room presets, select sizes/frames, customize wall colors, and purchase with one click. Built with React, TypeScript, Vite, and Tailwind CSS.

**Current State**: Fully functional MVP widget with demo app
**Last Updated**: November 12, 2025

## Recent Changes
- November 12, 2025: Complete rebuild as React + TypeScript widget
  - Migrated from Python FastAPI to React + TypeScript + Vite
  - Implemented embeddable widget (UMD + ESM builds)
  - Added 3 room presets (Living Room, Hallway, Bedroom)
  - Created artwork selection system with realistic scaling
  - Implemented size & frame selection (none, black, white, oak)
  - Added wall color picker with swatches + custom color
  - Integrated Shopify/ThriveCart checkout links
  - Added MailerLite email capture modal
  - Implemented share link generation with URL state
  - Created Designer Mode with custom width input
  - Built 3 conversion-tested themes (Azure, Royal, Sunset)
  - Added modern Pricing component (3 tiers)
  - Implemented analytics events system

## Project Architecture

### Structure
```
roomvibe/
├── public/
│   ├── rooms/          # Room preset images (living, hallway, bedroom)
│   ├── art/            # Artwork images
│   └── artworks.json   # Artwork catalog data
├── src/
│   ├── widget/         # Core widget components
│   │   ├── RoomVibe.tsx        # Main widget component
│   │   ├── RoomViewer.tsx      # Room preview with artwork
│   │   ├── ArtworkSelector.tsx # Artwork grid
│   │   ├── Controls.tsx        # Size/frame/wall controls
│   │   └── Pricing.tsx         # Pricing tiers
│   ├── demo/           # Demo application
│   │   └── DemoApp.tsx
│   ├── lib/            # Utilities
│   │   ├── analytics.ts    # Event tracking
│   │   ├── checkout.ts     # Checkout link generation
│   │   ├── mailerlite.ts   # Email lead capture
│   │   └── shareLink.ts    # URL state management
│   ├── types.ts        # TypeScript definitions
│   ├── themes.css      # CSS variables for 3 themes
│   ├── index.css       # Global styles
│   └── index.tsx       # Entry point
├── vite.config.ts      # Demo build config
├── vite.config.umd.ts  # Widget build config (UMD + ESM)
└── package.json
```

### Key Features
- **3 Room Presets**: Living Room, Hallway, Bedroom with realistic backgrounds
- **Artwork Selection**: Grid of artworks with thumbnails and details
- **Realistic Scaling**: Artwork scales proportionally based on aspect ratio
- **Size Options**: Multiple sizes per artwork (e.g., 80x60, 100x70, 150x100 cm)
- **Frame Styles**: None, Black, White, Oak with visual preview
- **Wall Color**: 7 preset swatches + custom color picker
- **Designer Mode**: Toggle for precise width input and dimension display
- **One-Click Checkout**: Shopify/ThriveCart integration with UTM tracking
- **Email Capture**: MailerLite modal for lead generation
- **Share Links**: Generate shareable URLs with preserved state
- **Three Themes**: Azure (blue), Royal (purple), Sunset (orange) with CSS variables
- **Analytics Events**: Track all user interactions via hooks
- **Embeddable**: Works as React component or UMD script tag

### Component Props
```typescript
interface RoomVibeProps {
  mode?: 'showcase' | 'designer';
  collection?: string;
  theme?: 'azure' | 'royal' | 'sunset';
  oneClickBuy?: boolean;
  checkoutType?: 'shopify' | 'thrivecart';
  checkoutLinkTemplate?: string;
  onEvent?: (event: AnalyticsEvent) => void;
}
```

### Analytics Events
- `rv_view` - Widget loaded
- `rv_art_select` - Artwork selected
- `rv_size_change` - Size changed
- `rv_frame_change` - Frame changed
- `rv_wall_color_change` - Wall color changed
- `rv_room_change` - Room preset changed
- `rv_buy_click` - Buy button clicked
- `rv_email_submit` - Email submitted
- `rv_share_copy` - Share link copied
- `rv_designer_mode_toggle` - Designer mode toggled

### Dependencies
- **React** 18.3.1 - UI library
- **TypeScript** 5.6.3 - Type safety
- **Vite** 5.0.0 - Build tool
- **Tailwind CSS** 3.4.0 - Styling
- **PostCSS** + **Autoprefixer** - CSS processing

### Build Commands
- `npm run dev` - Start development server (port 5000)
- `npm run build` - Build demo app
- `npm run build:umd` - Build widget (UMD + ESM)
- `npm run preview` - Preview production build

## Development Notes
- Server runs on port 5000 (Replit requirement for webview)
- Uses Node.js 20 with npm
- Hot module replacement enabled in dev mode
- CSS variables for theme switching
- All images stored in public folder
- State can be serialized to URL query params for sharing
- Old Python project backed up in `old_python_project/`
