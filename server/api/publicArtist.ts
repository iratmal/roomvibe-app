import express from 'express';
import crypto from 'crypto';
import { query } from '../db/database.js';

const router = express.Router();

// Rate limiting map for contact form (simple in-memory, resets on restart)
const contactRateLimits = new Map<string, { count: number; resetAt: number }>();
const CONTACT_RATE_LIMIT = 10; // 10 submissions per hour per IP
const CONTACT_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// Rate limiting for likes
const likeRateLimits = new Map<string, { count: number; resetAt: number }>();
const LIKE_RATE_LIMIT = 60; // 60 likes per hour per IP
const LIKE_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(map: Map<string, { count: number; resetAt: number }>, ip: string, limit: number, window: number): boolean {
  const now = Date.now();
  const entry = map.get(ip);
  
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Get public artist profile by slug
router.get('/:slug', async (req: any, res) => {
  try {
    const { slug } = req.params;

    const userResult = await query(
      `SELECT 
        id, email, display_name, location_city, location_country, bio,
        primary_style_tags, primary_medium, profile_image_url,
        website_url, instagram_url, facebook_url, tiktok_url, 
        linkedin_url, pinterest_url, etsy_url, languages,
        visible_to_designers, visible_to_galleries
       FROM users 
       WHERE slug = $1`,
      [slug]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const user = userResult.rows[0];

    // Profile is public if artist has a slug - no visibility restrictions
    // Artists can share their profile with anyone

    const artworksResult = await query(
      `SELECT 
        a.id, a.title, a.image_url, a.width, a.height, 
        a.price_amount, a.price_currency, a.dimension_unit,
        a.buy_url, a.medium, a.style_tags, a.availability, a.like_count, a.variants,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', ai.id,
              'image_url', ai.image_url,
              'display_order', ai.display_order,
              'is_mockup', ai.is_mockup
            ) ORDER BY ai.display_order
          )
          FROM artwork_images ai 
          WHERE ai.artwork_id = a.id
          ), '[]'
        ) AS gallery_images
       FROM artworks a
       WHERE a.artist_id = $1 AND a.show_on_public_profile = true
       ORDER BY a.created_at DESC`,
      [user.id]
    );

    const profile = {
      displayName: user.display_name || '',
      locationCity: user.location_city || '',
      locationCountry: user.location_country || '',
      bio: user.bio || '',
      primaryStyleTags: user.primary_style_tags || [],
      primaryMedium: user.primary_medium || '',
      profileImageUrl: user.profile_image_url || '',
      websiteUrl: user.website_url || '',
      instagramUrl: user.instagram_url || '',
      facebookUrl: user.facebook_url || '',
      tiktokUrl: user.tiktok_url || '',
      linkedinUrl: user.linkedin_url || '',
      pinterestUrl: user.pinterest_url || '',
      etsyUrl: user.etsy_url || '',
      languages: user.languages || [],
      visibleToDesigners: user.visible_to_designers || false,
      visibleToGalleries: user.visible_to_galleries || false
      // Note: email is NOT exposed publicly - contact goes through internal inbox
    };

    const artworks = artworksResult.rows.map(artwork => ({
      id: artwork.id,
      title: artwork.title,
      imageUrl: artwork.image_url,
      width: parseFloat(artwork.width),
      height: parseFloat(artwork.height),
      priceAmount: artwork.price_amount ? parseFloat(artwork.price_amount) : null,
      priceCurrency: artwork.price_currency || 'EUR',
      dimensionUnit: artwork.dimension_unit || 'cm',
      buyUrl: artwork.buy_url,
      medium: artwork.medium || '',
      styleTags: artwork.style_tags || [],
      availability: artwork.availability || 'available',
      likeCount: artwork.like_count || 0,
      variants: artwork.variants || [],
      galleryImages: artwork.gallery_images || []
    }));

    res.json({ 
      profile,
      artworks,
      artistId: user.id
    });
  } catch (error: any) {
    console.error('Error fetching public artist profile:', error);
    res.status(500).json({ error: 'Failed to fetch artist profile' });
  }
});

// Public contact form - sends message to artist
router.post('/contact-artist', async (req: any, res) => {
  try {
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    
    // Rate limiting
    if (!checkRateLimit(contactRateLimits, clientIp, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW)) {
      return res.status(429).json({ error: 'Too many messages. Please try again later.' });
    }

    const { artistId, senderName, senderEmail, message } = req.body;

    // Validation
    if (!artistId || !senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Get artist info
    const artistResult = await query(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [artistId]
    );

    if (artistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const artist = artistResult.rows[0];

    // Store message in messages table with source flag
    await query(
      `INSERT INTO messages (sender_id, recipient_id, subject, body, sender_role, is_read, source, sender_name, sender_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        null, // No sender_id for public messages
        artistId,
        `Public Inquiry from ${senderName}`,
        message.trim(),
        'public',
        false,
        'public_profile',
        senderName.trim(),
        senderEmail.trim()
      ]
    );

    // Log successful contact
    console.log(`Public contact: ${senderEmail} -> ${artist.email} (Artist ID: ${artistId})`);

    res.status(202).json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Error sending public contact:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Artwork like/unlike endpoint
router.post('/artwork/:id/like', async (req: any, res) => {
  try {
    const artworkId = parseInt(req.params.id);
    const { unlike } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    
    // Rate limiting
    if (!checkRateLimit(likeRateLimits, clientIp, LIKE_RATE_LIMIT, LIKE_RATE_WINDOW)) {
      return res.status(429).json({ error: 'Too many likes. Please try again later.' });
    }

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    // Get or create client token from cookie
    let clientToken = req.cookies?.rv_like_token;
    if (!clientToken) {
      clientToken = crypto.randomUUID();
      res.cookie('rv_like_token', clientToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
      });
    }

    // Hash the token for storage
    const tokenHash = crypto.createHash('sha256').update(clientToken).digest('hex');

    // Check if artwork exists
    const artworkResult = await query(
      'SELECT id, like_count FROM artworks WHERE id = $1',
      [artworkId]
    );

    if (artworkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Check if user has already liked this artwork
    const existingLike = await query(
      'SELECT id FROM artwork_like_tokens WHERE artwork_id = $1 AND client_token_hash = $2',
      [artworkId, tokenHash]
    );

    const hasLiked = existingLike.rows.length > 0;

    if (unlike && hasLiked) {
      // Remove like
      await query(
        'DELETE FROM artwork_like_tokens WHERE artwork_id = $1 AND client_token_hash = $2',
        [artworkId, tokenHash]
      );
      await query(
        'UPDATE artworks SET like_count = GREATEST(0, like_count - 1) WHERE id = $1',
        [artworkId]
      );
    } else if (!unlike && !hasLiked) {
      // Add like
      await query(
        'INSERT INTO artwork_like_tokens (artwork_id, client_token_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [artworkId, tokenHash]
      );
      await query(
        'UPDATE artworks SET like_count = COALESCE(like_count, 0) + 1 WHERE id = $1',
        [artworkId]
      );
    }

    // Get updated like count and verify actual liked state from database
    const updatedResult = await query(
      'SELECT like_count FROM artworks WHERE id = $1',
      [artworkId]
    );
    
    // Re-check the actual liked state from database (source of truth)
    const likedCheck = await query(
      'SELECT id FROM artwork_like_tokens WHERE artwork_id = $1 AND client_token_hash = $2',
      [artworkId, tokenHash]
    );
    const actuallyLiked = likedCheck.rows.length > 0;
    
    res.json({ 
      likeCount: updatedResult.rows[0]?.like_count || 0,
      liked: actuallyLiked
    });
  } catch (error: any) {
    console.error('Error toggling artwork like:', error);
    res.status(500).json({ error: 'Failed to update like' });
  }
});

export default router;
