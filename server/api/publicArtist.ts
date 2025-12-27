import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

router.get('/:slug', async (req: any, res) => {
  try {
    const { slug } = req.params;

    const userResult = await query(
      `SELECT 
        id, display_name, location_city, location_country, bio,
        primary_style_tags, primary_medium, profile_image_url,
        website_url, instagram_url, facebook_url, tiktok_url, languages,
        visible_to_designers, visible_to_galleries
       FROM users 
       WHERE slug = $1`,
      [slug]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const user = userResult.rows[0];

    if (!user.visible_to_designers && !user.visible_to_galleries) {
      return res.status(404).json({ error: 'This profile is private' });
    }

    const artworksResult = await query(
      `SELECT 
        id, title, image_url, width, height, 
        price_amount, price_currency, dimension_unit,
        buy_url, medium, style_tags, availability
       FROM artworks 
       WHERE artist_id = $1
       ORDER BY created_at DESC`,
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
      languages: user.languages || [],
      visibleToDesigners: user.visible_to_designers || false,
      visibleToGalleries: user.visible_to_galleries || false
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
      availability: artwork.availability || 'available'
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

export default router;
