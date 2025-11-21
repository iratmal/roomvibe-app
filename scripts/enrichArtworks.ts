import { fetchProductByHandle } from '../src/shopify';
import fs from 'fs/promises';
import path from 'path';

interface ArtworkInput {
  id: string;
  title: string;
  collectionHandle: string;
  buyUrl: string;
}

interface ArtworkOutput extends ArtworkInput {
  imageUrl?: string;
  widthCm?: number;
  heightCm?: number;
}

function extractDimensions(text: string): { widthCm?: number; heightCm?: number } {
  const patterns = [
    /(\d+)\s*x\s*(\d+)\s*x\s*\d+\s*cm/i,
    /(\d+)\s*x\s*(\d+)\s*cm/i,
    /(\d+)\s*x\s*(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        widthCm: parseInt(match[1], 10),
        heightCm: parseInt(match[2], 10),
      };
    }
  }

  return {};
}

async function enrichArtworks() {
  console.log('[RoomVibe] Starting artwork enrichment...');

  const artworksPath = path.join(process.cwd(), 'src/data/artworks.json');
  
  const rawData = await fs.readFile(artworksPath, 'utf-8');
  const artworks: ArtworkInput[] = JSON.parse(rawData);

  console.log(`[RoomVibe] Found ${artworks.length} artworks to enrich`);

  const enriched: ArtworkOutput[] = [];
  const missingDimensions: string[] = [];

  for (const artwork of artworks) {
    console.log(`[RoomVibe] Processing: ${artwork.id}`);

    const product = await fetchProductByHandle(artwork.id);

    if (!product) {
      console.warn(`[RoomVibe] ⚠️  Could not fetch product: ${artwork.id}`);
      enriched.push({
        ...artwork,
        widthCm: 100,
        heightCm: 80,
      });
      missingDimensions.push(`${artwork.id} (product not found)`);
      continue;
    }

    const combinedText = `${product.title} ${product.description || ''}`;
    const dimensions = extractDimensions(combinedText);

    const enrichedArtwork: ArtworkOutput = {
      ...artwork,
      imageUrl: product.imageUrl,
      widthCm: dimensions.widthCm || 100,
      heightCm: dimensions.heightCm || 80,
    };

    if (!product.imageUrl) {
      console.warn(`[RoomVibe] ⚠️  No image found for: ${artwork.id}`);
    }

    if (!dimensions.widthCm || !dimensions.heightCm) {
      console.warn(`[RoomVibe] ⚠️  No dimensions found for: ${artwork.id}, using fallback 100x80`);
      missingDimensions.push(artwork.id);
    } else {
      console.log(`[RoomVibe] ✅ ${artwork.id}: ${dimensions.widthCm}x${dimensions.heightCm} cm`);
    }

    enriched.push(enrichedArtwork);

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  await fs.writeFile(artworksPath, JSON.stringify(enriched, null, 2), 'utf-8');

  console.log('[RoomVibe] ✅ Enrichment complete!');
  console.log(`[RoomVibe] Total artworks: ${enriched.length}`);
  
  if (missingDimensions.length > 0) {
    console.log(`[RoomVibe] ⚠️  Missing dimensions for ${missingDimensions.length} artworks:`);
    missingDimensions.forEach(id => console.log(`   - ${id}`));
    console.log('[RoomVibe] These artworks use fallback dimensions (100x80 cm)');
  }
}

enrichArtworks().catch(err => {
  console.error('[RoomVibe] Enrichment failed:', err);
  process.exit(1);
});
