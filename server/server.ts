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
import { initializeDatabase } from './db/init.js';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(
  process.env.PORT || 
  (process.env.NODE_ENV === 'production' ? '5000' : '3001'), 
  10
);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://app.roomvibe.app'].filter(Boolean)
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

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/artist', artworksRoutes);
app.use('/api/designer', projectsRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoomVibe API server running' });
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
  try {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ RoomVibe API server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
