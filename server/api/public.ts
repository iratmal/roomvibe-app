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
        primary_style_tags, primary_medium, profile_image_url, header_image_url,
        website_url, instagram_url, facebook_url, tiktok_url, 
        linkedin_url, pinterest_url, etsy_url, languages,
        visible_to_designers, visible_to_galleries, updated_at
      FROM users 
      WHERE artist_access = TRUE OR role IN ('artist', 'user')
      ORDER BY
        CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 0 ELSE 1 END ASC,
        artist_access DESC NULLS LAST,
        id ASC`,
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
        availability, like_count, variants, card_image_id, clean_image_id, story, watermarked, updated_at
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

    // Build gallery images by artwork - include main cover image first (display_order: 0)
    // This matches the Dashboard behavior from /api/artist/artworks/:id/images
    const galleryImagesByArtwork: Record<number, any[]> = {};
    
    // First, add each artwork's main cover image with display_order: 0
    for (const artwork of artworksResult.rows as any[]) {
      if (artwork.image_url) {
        galleryImagesByArtwork[artwork.id] = [{
          id: 0,  // Special ID for cover image
          image_url: `/api/artwork-image/${artwork.id}`,
          display_order: 0,
          is_mockup: false,
          is_cover: true
        }];
      } else {
        galleryImagesByArtwork[artwork.id] = [];
      }
    }
    
    // Then add gallery images from artwork_gallery_images table
    for (const img of galleryImagesResult.rows) {
      if (!galleryImagesByArtwork[img.artwork_id]) {
        galleryImagesByArtwork[img.artwork_id] = [];
      }
      galleryImagesByArtwork[img.artwork_id].push({
        id: img.id,
        image_url: `/api/artwork-gallery-image/${img.id}`,
        display_order: img.display_order,
        is_mockup: img.is_mockup,
        is_cover: false
      });
    }

    const exhibitionResult = await query(
      `SELECT id, title FROM artist_exhibitions 
       WHERE artist_id = $1 AND (status = 'published' OR is_published = TRUE)
       ORDER BY updated_at DESC`,
      [artist.id]
    );
    
    const publishedExhibitions = exhibitionResult.rows.map(row => ({
      id: row.id,
      title: row.title
    }));

    // Add cache-busting timestamp for profile/header images to ensure instant updates
    const cacheBust = artist.updated_at ? new Date(artist.updated_at).getTime() : Date.now();
    
    // Helper to add cache-bust to image URLs
    const addCacheBust = (url: string) => {
      if (!url) return '';
      if (url.includes('?')) return `${url}&t=${cacheBust}`;
      return `${url}?t=${cacheBust}`;
    };
    
    const profile = {
      displayName: artist.display_name || '',
      locationCity: artist.location_city || '',
      locationCountry: artist.location_country || '',
      bio: artist.bio || '',
      primaryStyleTags: artist.primary_style_tags || [],
      primaryMedium: artist.primary_medium || '',
      profileImageUrl: artist.profile_image_url ? addCacheBust(artist.profile_image_url) : '',
      headerImageUrl: artist.header_image_url ? addCacheBust(artist.header_image_url) : '',
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

    const artworks = artworksResult.rows.map((a: any) => {
      const galleryImages = galleryImagesByArtwork[a.id] || [];
      const coverUrl = `/api/artwork-image/${a.id}`;
      const artworkCacheBust = a.updated_at ? new Date(a.updated_at).getTime() : Date.now();
      
      // Helper to get URL with cache busting
      const addArtworkCacheBust = (url: string) => {
        if (!url) return '';
        if (url.includes('?')) return `${url}&t=${artworkCacheBust}`;
        return `${url}?t=${artworkCacheBust}`;
      };
      
      // Calculate card_image_url: if card_image_id is set, use that; otherwise default to first mockup or cover
      let cardImageUrl = coverUrl;
      if (a.card_image_id !== null && a.card_image_id !== undefined) {
        if (a.card_image_id === 0) {
          cardImageUrl = coverUrl; // Explicitly set to cover
        } else {
          // Find the gallery image with this ID
          const cardImg = galleryImages.find((img: any) => img.id === a.card_image_id);
          if (cardImg) {
            cardImageUrl = cardImg.image_url;
          }
        }
      } else {
        // Auto-default: first mockup if available
        const firstMockup = galleryImages.find((img: any) => img.is_mockup);
        if (firstMockup) {
          cardImageUrl = firstMockup.image_url;
        }
      }
      
      // Calculate clean_image_url: if clean_image_id is set, use that; otherwise default to cover (no mockups allowed)
      let cleanImageUrl = coverUrl;
      if (a.clean_image_id !== null && a.clean_image_id !== undefined) {
        if (a.clean_image_id === 0) {
          cleanImageUrl = coverUrl; // Explicitly set to cover
        } else {
          // Find the gallery image with this ID
          const cleanImg = galleryImages.find((img: any) => img.id === a.clean_image_id && !img.is_mockup);
          if (cleanImg) {
            cleanImageUrl = cleanImg.image_url;
          }
        }
      }
      // If no clean_image_id set, default stays as cover (which is clean artwork)
      
      return {
        id: a.id,
        title: a.title,
        imageUrl: addArtworkCacheBust(a.image_url),
        cardImageUrl: addArtworkCacheBust(cardImageUrl),
        cleanImageUrl: addArtworkCacheBust(cleanImageUrl),
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
        story: a.story || null,
        variants: a.variants || [],
        galleryImages: galleryImages
      };
    });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      profile,
      artworks,
      artistId: artist.id,
      publishedExhibition: publishedExhibitions[0] || null,
      publishedExhibitions: publishedExhibitions
    });
  } catch (error: any) {
    console.error('Error fetching public artist profile:', error);
    res.status(500).json({ error: 'Failed to fetch artist profile' });
  }
});

router.post('/contact-artist', async (req, res) => {
  try {
    // Accept both "senderName/senderEmail" (frontend) and "name/email" (legacy)
    const artistId = req.body.artistId;
    const name = req.body.senderName || req.body.name;
    const email = req.body.senderEmail || req.body.email;
    const message = req.body.message;

    if (!artistId || !name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await query(
      `INSERT INTO public_contact_messages (artist_id, sender_name, sender_email, message)
       VALUES ($1, $2, $3, $4)`,
      [artistId, name.trim(), email.trim(), message.trim()]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending contact message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
