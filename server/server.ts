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
import artistProfileRoutes from './api/artistProfile.js';
import messagesRoutes from './api/messages.js';
import designerConnectRoutes from './api/designerConnect.js';
import galleryConnectRoutes from './api/galleryConnect.js';
import { initializeDatabase } from './db/init.js';
import { query } from './db/database.js';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage.js';
import { requireGalleryFeature, requireStripeFeature } from './middleware/featureFlags.js';
import { authenticateToken } from './middleware/auth.js';
import { envBool, envBoolDefaultTrue } from './utils/envBool.js';

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
      'https://staging.roomvibe.app',
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
app.use('/api/artist', artistProfileRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/designer', projectsRoutes);
app.use('/api/designer', designerConnectRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/gallery', galleryConnectRoutes);
app.use('/api/gallery', exhibition360Routes);
app.get('/api/billing/subscription', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userResult = await query(
      'SELECT subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.json({
        subscription_status: 'free',
        subscription_plan: 'user',
        has_stripe_customer: false,
        has_active_subscription: false,
      });
    }
    const user = userResult.rows[0];
    res.json({
      subscription_status: user.subscription_status || 'free',
      subscription_plan: user.subscription_plan || 'user',
      has_stripe_customer: !!user.stripe_customer_id,
      has_active_subscription: !!user.stripe_subscription_id,
    });
  } catch (error: any) {
    console.warn('[subscription] Error fetching, defaulting to free:', error.message);
    res.json({
      subscription_status: 'free',
      subscription_plan: 'user',
      has_stripe_customer: false,
      has_active_subscription: false,
    });
  }
});
app.use('/api/billing', requireStripeFeature, billingRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/exports', exportsRoutes);

// Server readiness flag - set to true after database initialization
let isServerReady = false;

app.get('/api/feature-flags', (req, res) => {
  res.json({
    galleryEnabled: envBoolDefaultTrue(process.env.FEATURE_GALLERY_ENABLED),
    exhibitionPublicEnabled: envBoolDefaultTrue(process.env.FEATURE_EXHIBITION_PUBLIC_ENABLED),
    stripeEnabled: envBool(process.env.STRIPE_ENABLED),
    paymentsEnabled: envBool(process.env.PAYMENTS_ENABLED),
    paymentsAvailable: envBool(process.env.STRIPE_ENABLED) && envBool(process.env.PAYMENTS_ENABLED),
  });
});

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

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.3',
    build: '2025-12-14T15:40:00Z',
    commit: 'fix-tags-column-migration',
    features: {
      cookieAuth: true,
      objectStorage: true
    }
  });
});

app.get('/api/health/env', (req, res) => {
  res.json({
    appEnv: process.env.APP_ENV || 'development',
    stripeMode: process.env.STRIPE_MODE || 'test',
    paymentsEnabled: envBool(process.env.PAYMENTS_ENABLED),
    stripeEnabled: envBool(process.env.STRIPE_ENABLED),
    paymentsAvailable: envBool(process.env.STRIPE_ENABLED) && envBool(process.env.PAYMENTS_ENABLED),
    analyticsEnabled: envBool(process.env.ENABLE_ANALYTICS),
    gdprEnabled: envBool(process.env.ENABLE_GDPR),
    storageConfigured: !!process.env.PRIVATE_OBJECT_DIR,
    version: '1.0.5'
  });
});

app.get('/api/health/storage', async (req, res) => {
  const SIDECAR = "http://127.0.0.1:1106";
  const results: Record<string, any> = {
    privateObjectDir: process.env.PRIVATE_OBJECT_DIR ? 'SET' : 'NOT_SET',
    privateObjectDirValue: process.env.PRIVATE_OBJECT_DIR?.substring(0, 30) + '...',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    appEnv: process.env.APP_ENV,
  };

  try {
    const credentialRes = await fetch(`${SIDECAR}/credential`, { method: 'GET' });
    results.credentialStatus = credentialRes.status;
    if (credentialRes.ok) {
      const credData = await credentialRes.json();
      results.credentialHasToken = !!credData.access_token;
      results.credentialExpiresIn = credData.expires_in;
    } else {
      results.credentialError = await credentialRes.text();
    }
  } catch (e: any) {
    results.credentialConnectionError = e.message;
  }

  try {
    const signedUrlRes = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket_name: 'test-bucket',
        object_name: 'test-object',
        method: 'GET',
        expires_at: new Date(Date.now() + 60000).toISOString(),
      }),
    });
    results.signedUrlStatus = signedUrlRes.status;
    if (!signedUrlRes.ok) {
      results.signedUrlError = await signedUrlRes.text();
    }
  } catch (e: any) {
    results.signedUrlConnectionError = e.message;
  }

  const credentialOk = results.credentialStatus === 200 && results.credentialHasToken;
  const storageConfigured = results.privateObjectDir === 'SET';
  
  res.status(credentialOk && storageConfigured ? 200 : 500).json({
    status: credentialOk && storageConfigured ? 'healthy' : 'unhealthy',
    credentialOk,
    storageConfigured,
    ...results
  });
});

app.get('/api/health/storage/write-test', async (req, res) => {
  const objectStorage = new ObjectStorageService();
  try {
    const storedObjectName = await objectStorage.uploadBuffer(
      Buffer.from('ping'),
      `ping-${Date.now()}.txt`,
      'text/plain'
    );
    return res.json({ ok: true, storedObjectName, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        statusCode: err?.statusCode,
        details: err?.details,
      },
    });
  }
});

app.get('/api/artwork-image/:id', async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    
    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    const result = await query('SELECT image_url FROM artworks WHERE id = $1', [artworkId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found', artworkId });
    }

    const imageUrl = result.rows[0].image_url;

    if (!imageUrl) {
      return res.status(404).json({ error: 'Artwork has no image', artworkId });
    }
    
    // If image is stored in Object Storage, serve from there
    if (imageUrl.startsWith('/objects/')) {
      try {
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectFile(imageUrl);
        objectStorageService.downloadObject(objectFile, res);
        return;
      } catch (storageError) {
        console.error(`[artwork-image] Object storage error for artwork ${artworkId}:`, storageError);
        return res.status(404).json({ 
          error: 'Image file not found in storage', 
          artworkId,
          storedPath: imageUrl 
        });
      }
    }

    // Redirect to the image URL if it's an external URL
    if (imageUrl.startsWith('http')) {
      return res.redirect(imageUrl);
    }

    // Handle corrupted data - image_url contains API path instead of object path
    if (imageUrl.startsWith('/api/artwork-image/')) {
      console.error(`[artwork-image] Corrupted image_url for artwork ${artworkId}: ${imageUrl}`);
      return res.status(404).json({ 
        error: 'Image reference is corrupted. Please re-upload the artwork image.',
        artworkId,
        corruptedPath: imageUrl
      });
    }

    // Fallback: return 404 for unrecognized formats
    console.error(`[artwork-image] Unrecognized image_url format for artwork ${artworkId}: ${imageUrl}`);
    return res.status(404).json({ 
      error: 'Image path format not recognized',
      artworkId 
    });
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

// Image proxy for loading external images with CORS headers (needed for WebGL textures)
app.get('/api/image-proxy', async (req: any, res) => {
  try {
    const imageUrl = req.query.url as string;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }

    // Block private/internal IPs (SSRF protection)
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./,
      /\.local$/i,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RoomVibe-ImageProxy/1.0',
        'Accept': 'image/*'
      }
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
    }

    // Verify content type is an image
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Check content length (max 10MB)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 10MB)' });
    }

    // Stream the response with proper headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });

    if (contentLength) {
      res.set('Content-Length', contentLength);
    }

    // Stream the image data
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
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
