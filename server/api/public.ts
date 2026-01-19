import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

function generateSlug(displayName: string, email: string): string {
  const name = displayName || email.split('@')[0];
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

router.get('/artist/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ error: 'Artist slug is required' });
    }

    const usersResult = await query(
      `SELECT 
        id, email, display_name, location_city, location_country, bio,
        primary_style_tags, primary_medium, profile_image_url,
        website_url, instagram_url, facebook_url, tiktok_url, 
        linkedin_url, pinterest_url, etsy_url, languages,
        visible_to_designers, visible_to_galleries
      FROM users 
      WHERE artist_access = TRUE`,
      []
    );

    let artist: any = null;
    for (const user of usersResult.rows as any[]) {
      const userSlug = generateSlug(user.display_name, user.email);
      if (userSlug === slug.toLowerCase()) {
        artist = user;
        break;
      }
    }

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const artworksResult = await query(
      `SELECT 
        id, title, image_url, width, height, dimension_unit,
        price_amount, price_currency, buy_url, medium, style_tags,
        availability, like_count, variants
      FROM artworks 
      WHERE artist_id = $1
      ORDER BY created_at DESC`,
      [artist.id]
    );

    const galleryImagesResult = await query(
      `SELECT artwork_id, id, storage_key, display_order, is_mockup 
       FROM artwork_gallery_images 
       WHERE artwork_id = ANY($1)
       ORDER BY display_order ASC`,
      [artworksResult.rows.map((a: any) => a.id)]
    );

    const galleryImagesByArtwork: Record<number, any[]> = {};
    for (const img of galleryImagesResult.rows) {
      if (!galleryImagesByArtwork[img.artwork_id]) {
        galleryImagesByArtwork[img.artwork_id] = [];
      }
      galleryImagesByArtwork[img.artwork_id].push({
        id: img.id,
        image_url: `/api/artwork-gallery-image/${img.id}`,
        display_order: img.display_order,
        is_mockup: img.is_mockup
      });
    }

    const exhibitionResult = await query(
      `SELECT id, title FROM artist_exhibitions 
       WHERE artist_id = $1 AND is_published = TRUE 
       ORDER BY updated_at DESC LIMIT 1`,
      [artist.id]
    );

    const profile = {
      displayName: artist.display_name || '',
      locationCity: artist.location_city || '',
      locationCountry: artist.location_country || '',
      bio: artist.bio || '',
      primaryStyleTags: artist.primary_style_tags || [],
      primaryMedium: artist.primary_medium || '',
      profileImageUrl: artist.profile_image_url || '',
      websiteUrl: artist.website_url || '',
      instagramUrl: artist.instagram_url || '',
      facebookUrl: artist.facebook_url || '',
      tiktokUrl: artist.tiktok_url || '',
      linkedinUrl: artist.linkedin_url || '',
      pinterestUrl: artist.pinterest_url || '',
      etsyUrl: artist.etsy_url || '',
      languages: artist.languages || [],
      visibleToDesigners: artist.visible_to_designers || false,
      visibleToGalleries: artist.visible_to_galleries || false
    };

    const artworks = artworksResult.rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      imageUrl: a.image_url,
      width: parseFloat(a.width),
      height: parseFloat(a.height),
      dimensionUnit: a.dimension_unit || 'cm',
      priceAmount: a.price_amount ? parseFloat(a.price_amount) : null,
      priceCurrency: a.price_currency || 'EUR',
      buyUrl: a.buy_url,
      medium: a.medium,
      styleTags: a.style_tags || [],
      availability: a.availability,
      likeCount: parseInt(a.like_count) || 0,
      variants: a.variants || [],
      galleryImages: galleryImagesByArtwork[a.id] || []
    }));

    res.json({
      profile,
      artworks,
      artistId: artist.id,
      publishedExhibition: exhibitionResult.rows[0] || null
    });
  } catch (error: any) {
    console.error('Error fetching public artist profile:', error);
    res.status(500).json({ error: 'Failed to fetch artist profile' });
  }
});

router.post('/contact-artist', async (req, res) => {
  try {
    const { artistId, name, email, message } = req.body;

    if (!artistId || !name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await query(
      `INSERT INTO public_contact_messages (artist_id, sender_name, sender_email, message)
       VALUES ($1, $2, $3, $4)`,
      [artistId, name, email, message]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending contact message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
