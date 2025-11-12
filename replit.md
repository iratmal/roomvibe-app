# RoomVibe

## Overview
RoomVibe is a FastAPI application for artwork discovery and palette extraction. The app helps users find artworks and generate color palettes from images, with integrated affiliate tracking for checkout links.

**Current State**: Fully functional MVP with all core endpoints implemented
**Last Updated**: November 12, 2025

## Recent Changes
- November 12, 2025: Initial project setup
  - Created FastAPI backend with all required endpoints
  - Configured Python 3.11 environment
  - Set up workflow to run on port 5000

## Project Architecture

### Backend Structure
```
app/
  backend/
    main.py          # FastAPI application with all endpoints
requirements.txt     # Python dependencies
```

### Endpoints
- `GET /` - Serves HTML homepage with link to health check
- `GET /api/health` - Returns {"status": "ok"}
- `GET /api/artworks` - Returns 3 hardcoded artworks with id, title, ratio, price_eur, product_url, image_url
- `POST /api/palette` - Accepts multipart image upload, returns 5 placeholder HEX colors and mood
- `POST /api/checkout-link` - Accepts product_url, appends UTM parameters from environment variables
- `POST /webhooks/stripe` - Stripe webhook endpoint returning {"received": true}

### Dependencies
- FastAPI: Web framework
- Uvicorn: ASGI server
- python-multipart: File upload support
- Pillow & NumPy: Image processing (ready for future palette extraction)
- python-dotenv: Environment variable management
- Stripe: Webhook handling
- Requests: HTTP utilities

### Environment Variables
The checkout link endpoint uses these environment variables (with fallback defaults):
- `utm_source` (default: "roomvibe")
- `utm_medium` (default: "app")
- `utm_campaign` (default: "default")

## Development Notes
- Server runs on port 5000 (Replit requirement for webview)
- No Docker or virtual environments (Nix-based Replit environment)
- Palette extraction currently returns placeholder colors - ready for K-means implementation
