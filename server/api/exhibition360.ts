import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { gallery360Presets } from '../../src/config/gallery360Presets';
import { requireGalleryFeature } from '../middleware/featureFlags.js';

const router = express.Router();

interface SlotAssignment {
  slotId: string;
  artworkId: string | null;
  artworkUrl?: string;
  artworkTitle?: string;
  artistName?: string;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  priceAmount?: number | null;
  priceCurrency?: string;
  buyUrl?: string | null;
  description?: string | null;
}

interface Exhibition360Scene {
  exhibitionId: string;
  presetId: string;
  slots: SlotAssignment[];
  updatedAt: string;
}

router.get('/collections/:id/360-scene', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user?.id;

    const collectionResult = await query(
      'SELECT id, title, gallery_id, scene_360_data FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collection = collectionResult.rows[0];
    
    if (collection.gallery_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let scene360Data = collection.scene_360_data || null;
    
    if (scene360Data) {
      const parsedScene = typeof scene360Data === 'string' 
        ? JSON.parse(scene360Data) 
        : scene360Data;
      
      const artworksResult = await query(
        `SELECT id, title, artist_name, image_url, 
                width_value, height_value, dimension_unit,
                price_amount, price_currency, buy_url, description
         FROM gallery_artworks
         WHERE collection_id = $1`,
        [collectionId]
      );
      
      const hydratedSlots = (parsedScene.slots || []).map((slot: SlotAssignment) => {
        if (!slot.artworkId) return slot;
        
        const artwork = artworksResult.rows.find(a => String(a.id) === slot.artworkId);
        
        if (!artwork) {
          return slot;
        }
        
        return {
          ...slot,
          artworkUrl: artwork.image_url || slot.artworkUrl,
          artworkTitle: artwork.title || slot.artworkTitle,
          artistName: artwork.artist_name || slot.artistName,
          width: artwork.width_value || slot.width || 100,
          height: artwork.height_value || slot.height || 70,
          dimensionUnit: artwork.dimension_unit || 'cm',
          priceAmount: artwork.price_amount || null,
          priceCurrency: artwork.price_currency || 'EUR',
          buyUrl: artwork.buy_url || null,
          description: artwork.description || null
        };
      });
      
      scene360Data = {
        ...parsedScene,
        slots: hydratedSlots
      };
    }

    res.json({
      collectionId: collection.id,
      title: collection.title,
      scene360Data
    });
  } catch (err) {
    console.error('Error fetching 360 scene:', err);
    res.status(500).json({ error: 'Failed to fetch 360 scene' });
  }
});

router.put('/collections/:id/360-scene', authenticateToken, requireGalleryFeature, async (req: any, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user?.id;
    const { presetId, slots } = req.body;

    const collectionResult = await query(
      'SELECT id, gallery_id FROM gallery_collections WHERE id = $1',
      [collectionId]
    );

    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collectionResult.rows[0].gallery_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const validPresetIds = gallery360Presets.map(p => p.id);
    if (!validPresetIds.includes(presetId)) {
      return res.status(400).json({ error: 'Invalid preset ID' });
    }

    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'Slots must be an array' });
    }

    for (const slot of slots) {
      if (typeof slot.slotId !== 'string') {
        return res.status(400).json({ error: 'Invalid slot structure' });
      }
    }

    const scene360Data: Exhibition360Scene = {
      exhibitionId: collectionId,
      presetId,
      slots,
      updatedAt: new Date().toISOString()
    };

    await query(
      'UPDATE gallery_collections SET scene_360_data = $1 WHERE id = $2',
      [JSON.stringify(scene360Data), collectionId]
    );

    res.json({ success: true, scene360Data });
  } catch (err) {
    console.error('Error saving 360 scene:', err);
    res.status(500).json({ error: 'Failed to save 360 scene' });
  }
});

router.get('/exhibitions/:id/360-public', async (req, res) => {
  try {
    const collectionId = req.params.id;

    const result = await query(
      `SELECT c.id, c.title, c.description, c.scene_360_data, c.status,
              u.display_name as gallery_name
       FROM gallery_collections c
       JOIN users u ON c.gallery_id = u.id
       WHERE c.id = $1`,
      [collectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const collection = result.rows[0];
    
    if (collection.status !== 'published') {
      return res.status(403).json({ error: 'Exhibition is not published' });
    }

    if (!collection.scene_360_data) {
      return res.status(404).json({ error: 'No 360 scene configured for this exhibition' });
    }

    const artworksResult = await query(
      `SELECT ga.id, ga.artwork_id, ga.title, ga.artist_name, ga.image_url, 
              ga.width_value, ga.height_value, ga.dimension_unit,
              ga.price_amount, ga.price_currency, ga.buy_url, ga.description
       FROM gallery_artworks ga
       WHERE ga.collection_id = $1`,
      [collectionId]
    );

    const scene360Data = typeof collection.scene_360_data === 'string' 
      ? JSON.parse(collection.scene_360_data) 
      : collection.scene_360_data;

    const hydratedSlots = (scene360Data.slots || []).map((slot: SlotAssignment) => {
      if (!slot.artworkId) return slot;
      
      let artwork = artworksResult.rows.find(a => String(a.id) === slot.artworkId);
      
      if (!artwork) {
        artwork = artworksResult.rows.find(a => a.artwork_id && String(a.artwork_id) === slot.artworkId);
      }
      
      if (!artwork) {
        console.warn(`[360 Public] Artwork ${slot.artworkId} not found for slot ${slot.slotId}`);
        if (slot.artworkUrl) {
          return {
            ...slot,
            width: slot.width || 100,
            height: slot.height || 70,
            dimensionUnit: slot.dimensionUnit || 'cm'
          };
        }
        return slot;
      }
      
      return {
        ...slot,
        artworkUrl: artwork.image_url || slot.artworkUrl,
        artworkTitle: artwork.title || slot.artworkTitle,
        artistName: artwork.artist_name || slot.artistName,
        width: artwork.width_value || slot.width || 100,
        height: artwork.height_value || slot.height || 70,
        dimensionUnit: artwork.dimension_unit || 'cm',
        priceAmount: artwork.price_amount || null,
        priceCurrency: artwork.price_currency || 'EUR',
        buyUrl: artwork.buy_url || null,
        description: artwork.description || null
      };
    });

    res.json({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      galleryName: collection.gallery_name,
      scene360Data: {
        ...scene360Data,
        slots: hydratedSlots
      }
    });
  } catch (err) {
    console.error('Error fetching public 360 exhibition:', err);
    res.status(500).json({ error: 'Failed to fetch exhibition' });
  }
});

export default router;
