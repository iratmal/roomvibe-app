import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { gallery360Presets } from '../../src/config/gallery360Presets';

const router = express.Router();

interface SlotAssignment {
  slotId: string;
  artworkId: string | null;
  artworkUrl?: string;
  artworkTitle?: string;
  artistName?: string;
}

interface Exhibition360Scene {
  exhibitionId: string;
  presetId: string;
  slots: SlotAssignment[];
  updatedAt: string;
}

router.get('/collections/:id/360-scene', authenticateToken, async (req: any, res) => {
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

    res.json({
      collectionId: collection.id,
      title: collection.title,
      scene360Data: collection.scene_360_data || null
    });
  } catch (err) {
    console.error('Error fetching 360 scene:', err);
    res.status(500).json({ error: 'Failed to fetch 360 scene' });
  }
});

router.put('/collections/:id/360-scene', authenticateToken, async (req: any, res) => {
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

    // Get gallery_artworks for this collection (not the general artworks table)
    const artworksResult = await query(
      `SELECT id, title, artist_name, image_url, width_value, height_value, dimension_unit
       FROM gallery_artworks
       WHERE collection_id = $1
       ORDER BY created_at`,
      [collectionId]
    );

    const scene360Data = typeof collection.scene_360_data === 'string' 
      ? JSON.parse(collection.scene_360_data) 
      : collection.scene_360_data;

    // Hydrate slots with artwork data from gallery_artworks
    // The slot already has artworkUrl from when it was saved, but we re-hydrate to ensure fresh data
    const hydratedSlots = (scene360Data.slots || []).map((slot: SlotAssignment) => {
      if (!slot.artworkId) return slot;
      
      const artwork = artworksResult.rows.find(a => String(a.id) === slot.artworkId);
      if (!artwork) {
        // Slot already has data saved from editor, use that
        console.log(`[360 Public] Using saved slot data for artwork ${slot.artworkId}`);
        return slot;
      }
      
      return {
        ...slot,
        artworkUrl: artwork.image_url,
        artworkTitle: artwork.title,
        artistName: artwork.artist_name,
        width: artwork.width_value,
        height: artwork.height_value,
        dimensionUnit: artwork.dimension_unit
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
