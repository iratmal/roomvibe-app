import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { PLAN_LIMITS, getEffectivePlan, type PlanType } from '../config/planLimits.js';

const router = Router();

function generateWidgetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface WidgetCapabilities {
  premiumRooms: boolean;
  highResExport: boolean;
  multiArtwork: boolean;
  exhibitionMode: boolean;
  buyButton: boolean;
  pdfExport: boolean;
  frames: boolean;
  customBranding: boolean;
}

function getCapabilitiesForEntitlements(entitlements: {
  artist_access: boolean;
  designer_access: boolean;
  gallery_access: boolean;
}, planLimits: typeof PLAN_LIMITS[PlanType]): WidgetCapabilities {
  return {
    premiumRooms: planLimits.premiumRoomsAccess,
    highResExport: planLimits.highResExport,
    multiArtwork: entitlements.gallery_access,
    exhibitionMode: entitlements.gallery_access,
    buyButton: entitlements.artist_access,
    pdfExport: planLimits.pdfProposals,
    frames: true,
    customBranding: planLimits.customBranding,
  };
}

function determineUserType(entitlements: {
  artist_access: boolean;
  designer_access: boolean;
  gallery_access: boolean;
}): 'artist' | 'designer' | 'gallery' | 'user' {
  if (entitlements.gallery_access) return 'gallery';
  if (entitlements.designer_access) return 'designer';
  if (entitlements.artist_access) return 'artist';
  return 'user';
}

router.get('/config', async (req: Request, res: Response) => {
  try {
    const widgetId = req.query.widgetId as string;
    
    if (!widgetId) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }

    const userResult = await query(
      `SELECT id, email, role, is_admin, subscription_status, subscription_plan, 
              artist_access, designer_access, gallery_access, widget_token
       FROM users WHERE widget_token = $1`,
      [widgetId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid widget ID' });
    }

    const user = userResult.rows[0];
    
    const entitlements = {
      artist_access: user.is_admin ? true : (user.artist_access || false),
      designer_access: user.is_admin ? true : (user.designer_access || false),
      gallery_access: user.is_admin ? true : (user.gallery_access || false),
    };

    const effectivePlan = getEffectivePlan({
      id: user.id,
      is_admin: user.is_admin,
      subscription_status: user.subscription_status,
      subscription_plan: user.subscription_plan,
    });

    const planLimits = PLAN_LIMITS[effectivePlan];
    const userType = determineUserType(entitlements);
    const capabilities = getCapabilitiesForEntitlements(entitlements, planLimits);

    let artworks: any[] = [];
    let rooms: any[] = [];
    let galleryScenes: any[] = [];

    if (entitlements.artist_access) {
      const artworksResult = await query(
        `SELECT id, title, image_url, width, height, price_amount, price_currency, buy_url, dimension_unit
         FROM artworks WHERE artist_id = $1 ORDER BY created_at DESC`,
        [user.id]
      );
      artworks = artworksResult.rows.map(artwork => ({
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.image_url,
        width: parseFloat(artwork.width),
        height: parseFloat(artwork.height),
        price: artwork.price_amount ? parseFloat(artwork.price_amount) : null,
        currency: artwork.price_currency || 'EUR',
        buyUrl: artwork.buy_url,
        dimensionUnit: artwork.dimension_unit || 'cm',
      }));
    }

    if (entitlements.gallery_access) {
      const collectionsResult = await query(
        `SELECT gc.id, gc.title, gc.subtitle, gc.description, gc.status,
                ga.id as artwork_id, ga.title as artwork_title, ga.artist_name, 
                ga.image_url as artwork_image, ga.width_value, ga.height_value,
                ga.dimension_unit, ga.price_amount, ga.price_currency, ga.buy_url
         FROM gallery_collections gc
         LEFT JOIN gallery_artworks ga ON ga.collection_id = gc.id
         WHERE gc.gallery_id = $1 AND gc.status = 'published'
         ORDER BY gc.created_at DESC, ga.created_at ASC`,
        [user.id]
      );

      const collectionsMap = new Map();
      for (const row of collectionsResult.rows) {
        if (!collectionsMap.has(row.id)) {
          collectionsMap.set(row.id, {
            id: row.id,
            title: row.title,
            subtitle: row.subtitle,
            description: row.description,
            artworks: [],
          });
        }
        if (row.artwork_id) {
          collectionsMap.get(row.id).artworks.push({
            id: row.artwork_id,
            title: row.artwork_title,
            artistName: row.artist_name,
            imageUrl: row.artwork_image,
            width: parseFloat(row.width_value),
            height: parseFloat(row.height_value),
            dimensionUnit: row.dimension_unit || 'cm',
            price: row.price_amount ? parseFloat(row.price_amount) : null,
            currency: row.price_currency || 'EUR',
            buyUrl: row.buy_url,
          });
        }
      }
      galleryScenes = Array.from(collectionsMap.values());
    }

    rooms = [
      { id: 'room-1', name: 'Modern Living Room', thumbnail: '/presets/room-1-thumb.jpg', image: '/presets/room-1.jpg' },
      { id: 'room-2', name: 'Minimalist Space', thumbnail: '/presets/room-2-thumb.jpg', image: '/presets/room-2.jpg' },
      { id: 'room-3', name: 'Cozy Bedroom', thumbnail: '/presets/room-3-thumb.jpg', image: '/presets/room-3.jpg' },
      { id: 'room-4', name: 'Gallery Wall', thumbnail: '/presets/room-4-thumb.jpg', image: '/presets/room-4.jpg' },
    ];

    res.json({
      userType,
      entitlements,
      capabilities,
      isFreePlan: effectivePlan === 'user',
      data: {
        artworks,
        rooms,
        galleryScenes,
        buyUrl: artworks.length > 0 ? artworks[0].buyUrl : null,
      },
    });
  } catch (error) {
    console.error('Widget config error:', error);
    res.status(500).json({ error: 'Failed to load widget configuration' });
  }
});

router.post('/token/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = generateWidgetToken();

    await query(
      'UPDATE users SET widget_token = $1 WHERE id = $2',
      [token, userId]
    );

    res.json({ 
      widgetToken: token,
      embedCode: `<script src="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : ''}/widget.js" data-widget-id="${token}"></script>`,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate widget token' });
  }
});

router.get('/token', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT widget_token FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = result.rows[0].widget_token;
    const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

    res.json({
      widgetToken: token || null,
      embedCode: token ? `<script src="${baseUrl}/widget.js" data-widget-id="${token}"></script>` : null,
    });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch widget token' });
  }
});

router.delete('/token', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await query(
      'UPDATE users SET widget_token = NULL WHERE id = $1',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Token revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke widget token' });
  }
});

export default router;
