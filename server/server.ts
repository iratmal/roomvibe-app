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
import { initializeDatabase } from './db/init.js';
import { query } from './db/database.js';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// For Autoscale deployments, listen on port 80. In development, use 3001.
const PORT = parseInt(
  process.env.PORT || 
  (process.env.NODE_ENV === 'production' ? '80' : '3001'), 
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
app.use('/api/billing', billingRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/exports', exportsRoutes);

// Server readiness flag - set to true after database initialization
let isServerReady = false;

app.get('/api/health', (req, res) => {
  // Always respond immediately to health checks - this is critical for deployment
  res.json({ 
    status: 'ok', 
    message: 'RoomVibe API server running',
    ready: isServerReady
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
  // Start listening IMMEDIATELY so health checks pass during deployment
  // Database initialization happens in the background
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ RoomVibe API server listening on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health check available at /api/health`);
    
    // Mark server as ready immediately for health checks
    // Database initialization happens asynchronously
    isServerReady = true;
  });

  // Initialize database in background - no timeout, handles errors gracefully
  initializeDatabase()
    .then(() => {
      console.log(`✓ Database initialized successfully`);
    })
    .catch((error) => {
      console.error('Database initialization warning:', error instanceof Error ? error.message : error);
      console.log('  Server continues running - some features may be unavailable until DB is ready');
      // Don't crash - server stays up for health checks and retries
    });
}

startServer();
