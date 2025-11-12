# RoomVibe

## Overview
RoomVibe is a FastAPI application for artwork discovery and palette extraction. The app helps users find artworks and generate color palettes from images, with integrated affiliate tracking for checkout links.

**Current State**: Fully functional with modern, responsive UI
**Last Updated**: November 12, 2025

## Recent Changes
- November 12, 2025: Major UI overhaul
  - Created modern, responsive frontend with large card layout
  - Implemented drag & drop image upload
  - Added real-time color palette extraction from images
  - Integrated catalog browsing with artwork selection
  - Added checkout link generation with UTM tracking
  - Migrated to Jinja2 templates for better separation of concerns

## Project Architecture

### Structure
```
app/
  backend/
    main.py          # FastAPI application with all endpoints
static/
  templates/
    index.html       # Main UI template
  styles.css         # Modern, responsive CSS
  app.js             # Frontend JavaScript logic
  mockups/           # Generated mockup images
requirements.txt     # Python dependencies
```

### Key Features
- **Drag & Drop Upload**: Large, intuitive upload zone for wall photos
- **Color Palette Extraction**: Real-time extraction of dominant colors from images
- **Artwork Catalog**: Browse and select from available artworks
- **Checkout Integration**: One-click checkout link generation with UTM tracking
- **Responsive Design**: Works on desktop and mobile devices

### API Endpoints
- `GET /` - Modern UI homepage
- `GET /api/health` - Health check endpoint
- `GET /api/artworks` - Returns artwork catalog from Shopify CSV
- `POST /api/palette` - Extracts color palette from uploaded image
- `POST /api/checkout-link` - Generates tracked checkout URL
- `POST /api/mockup` - Generates artwork preview on wall (backend feature)
- `POST /webhooks/stripe` - Stripe webhook handler

### Dependencies
- FastAPI: Web framework
- Uvicorn: ASGI server
- Jinja2: Template engine
- python-multipart: File upload support
- Pillow: Image processing for palette extraction
- python-dotenv: Environment variable management
- Stripe: Payment webhook handling
- Requests: HTTP utilities

### Environment Variables
- `utm_source` (default: "roomvibe")
- `utm_medium` (default: "app")
- `utm_campaign` (default: "default")
- `SHOPIFY_STORE_DOMAIN` (default: "irenart.studio")
- `MAILERLITE_API_KEY` (optional)
- `MAILERLITE_GROUP_ID` (optional)

## Development Notes
- Server runs on port 5000 (Replit requirement for webview)
- Uses Nix-based environment (no Docker/venv)
- Color palette extraction uses PIL's adaptive palette algorithm
- Static files mounted at `/static` for both assets and generated mockups
