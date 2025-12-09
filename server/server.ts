import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './api/auth.js';
import dashboardRoutes from './api/dashboard.js';
import artworksRoutes from './api/artworks.js';
import projectsRoutes from './api/projects.js';
import galleryRoutes from './api/gallery.js';
import billingRoutes from './api/billing.js';
import webhookRoutes from './api/webhook.js';
import widgetRoutes from './api/widget.js';
import exportsRoutes from './api/exports.js';
import exhibition360Routes from './api/exhibition360.js';
import { initializeDatabase } from './db/init.js';
import { query } from './db/database.js';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// For Autoscale deployments, internal port 5000 is forwarded to external port 80.
// In development, API uses 3001 while Vite dev server uses 5000.
const PORT = parseInt(
  process.env.PORT || 
  (process.env.NODE_ENV === 'production' ? '5000' : '3001'), 
  10
);

// Get Replit domain for CORS
const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      'https://app.roomvibe.app',
      replitDomain ? `https://${replitDomain}` : null,
    ].filter(Boolean) as string[]
  : ['http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use('/api/stripe', webhookRoutes);

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/artist', artworksRoutes);
app.use('/api/designer', projectsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/gallery', exhibition360Routes);
app.use('/api/billing', billingRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/exports', exportsRoutes);

// Server readiness flag - set to true after database initialization
let isServerReady = false;

app.get('/api/health', (req, res) => {
  if (!isServerReady) {
    return res.status(503).json({ 
      status: 'starting', 
      message: 'Server initializing, please wait',
      ready: false
    });
  }
  res.status(200).json({ 
    status: 'ok', 
    message: 'RoomVibe API server running',
    ready: true
  });
});

app.get('/api/artwork-image/:id', async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    const result = await query('SELECT image_data FROM artworks WHERE id = $1', [artworkId]);

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imageData = result.rows[0].image_data;
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(500).json({ error: 'Invalid image data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error serving artwork image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Serve room images from database (for Designer uploads)
app.get('/api/room-image/:id', async (req: any, res) => {
  try {
    const roomId = parseInt(req.params.id);
    
    if (isNaN(roomId)) {
      return res.status(400).json({ error: 'Invalid room image ID' });
    }

    const result = await query('SELECT image_data FROM room_images WHERE id = $1', [roomId]);

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).json({ error: 'Room image not found' });
    }

    const imageData = result.rows[0].image_data;
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(500).json({ error: 'Invalid image data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error serving room image:', error);
    res.status(500).json({ error: 'Failed to serve room image' });
  }
});

// Serve gallery artwork images from database (for Gallery uploads)
app.get('/api/gallery-artwork-image/:id', async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid gallery artwork ID' });
    }

    const result = await query('SELECT image_data FROM gallery_artworks WHERE id = $1', [artworkId]);

    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).json({ error: 'Gallery artwork image not found' });
    }

    const imageData = result.rows[0].image_data;
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(500).json({ error: 'Invalid image data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error serving gallery artwork image:', error);
    res.status(500).json({ error: 'Failed to serve gallery artwork image' });
  }
});

app.get('/api/artwork/:id', async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    const result = await query(
      `SELECT id, title, image_url, width, height, dimension_unit, price_amount, price_currency, buy_url
       FROM artworks WHERE id = $1`,
      [artworkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const artwork = result.rows[0];
    res.json({
      artwork: {
        id: `db-${artwork.id}`,
        title: artwork.title,
        overlayImageUrl: artwork.image_url,
        widthCm: parseFloat(artwork.width),
        heightCm: parseFloat(artwork.height),
        buyUrl: artwork.buy_url,
        priceAmount: artwork.price_amount,
        priceCurrency: artwork.price_currency || 'EUR',
        dimensionUnit: artwork.dimension_unit || 'cm'
      }
    });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
});

app.get('/objects/*path', async (req: any, res) => {
  try {
    const pathSegments = req.params.path;
    const objectPath = '/objects/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments);
    console.log('[ObjectStorage] Serving object:', objectPath);
    const objectStorageService = new ObjectStorageService();
    const objectFile = await objectStorageService.getObjectFile(objectPath);
    objectStorageService.downloadObject(objectFile, res);
  } catch (error) {
    console.error('Error serving object:', error);
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Image proxy endpoint for WebGL texture loading (fixes CORS issues)
// Security: Only allows image content types and validates URLs
app.get('/api/image-proxy', async (req: any, res) => {
  try {
    const imageUrl = req.query.url as string;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Handle data URLs directly (already safe - no external fetch)
    if (imageUrl.startsWith('data:image/')) {
      const matches = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid image data URL format' });
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.set({
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      return res.send(buffer);
    }

    // Handle internal object storage URLs (safe - internal only)
    if (imageUrl.startsWith('/objects/')) {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectFile(imageUrl);
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      return objectStorageService.downloadObject(objectFile, res);
    }

    // Security: Validate external URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Security: Only allow HTTPS for external URLs (except localhost for dev)
    if (parsedUrl.protocol !== 'https:' && !parsedUrl.hostname.includes('localhost')) {
      return res.status(400).json({ error: 'Only HTTPS URLs allowed' });
    }

    // Security: Block internal/private IP ranges to prevent SSRF (all environments)
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /\.local$/i,
      /\.internal$/i
    ];
    
    // Always block private IP ranges
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return res.status(400).json({ error: 'URL not allowed' });
      }
    }
    
    // Block localhost in production only (needed for dev testing)
    if (process.env.NODE_ENV === 'production' && /^localhost$/i.test(hostname)) {
      return res.status(400).json({ error: 'URL not allowed' });
    }

    // Fetch external image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'RoomVibe-ImageProxy/1.0',
        'Accept': 'image/*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
    }

    // Security: Only allow image content types
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not return an image' });
    }

    // Security: Limit response size (max 20MB) with streaming check
    const maxSize = 20 * 1024 * 1024;
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > maxSize) {
      return res.status(400).json({ error: 'Image too large' });
    }

    // Stream body with size limit enforcement
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const reader = response.body?.getReader();
    
    if (!reader) {
      return res.status(500).json({ error: 'Failed to read response' });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      totalSize += value.length;
      if (totalSize > maxSize) {
        reader.cancel();
        return res.status(400).json({ error: 'Image too large' });
      }
      chunks.push(Buffer.from(value));
    }

    const buffer = Buffer.concat(chunks);

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=86400'
    });
    
    res.send(buffer);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timeout' });
    }
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred'
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist'), {
    maxAge: '1h',
    etag: true
  }));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

async function startServer() {
  // Start listening so health checks can respond (with 503 until ready)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ RoomVibe API server listening on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health check available at /api/health (waiting for DB...)`);
  });

  // Initialize database - server is only ready after this completes
  try {
    await initializeDatabase();
    console.log(`✓ Database initialized successfully`);
    isServerReady = true;
    console.log(`✓ Server is now ready to accept requests`);
  } catch (error) {
    console.error('Database initialization failed:', error instanceof Error ? error.message : error);
    // Still mark as ready so deployment doesn't hang indefinitely
    // The server can handle requests that don't require DB
    isServerReady = true;
    console.log('  Server marked ready despite DB error - some features may be unavailable');
  }
}

startServer();
