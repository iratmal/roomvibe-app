// src/shopify.ts

export interface ShopifyArtwork {
  id: string;
  handle?: string;
  title: string;
  imageUrl: string;
  /**
   * URL na Shopify product page – koristimo ga za
   * "View & Buy on Shopify" gumbe u App.tsx
   */
  onlineStoreUrl?: string;
  /**
   * Direktan link na stvarnu product page gdje korisnik može kupiti artwork.
   * Za Shopify artworks: koristi onlineStoreUrl ili build iz handle-a.
   * Za lokalne artworks: ručno postavljen URL.
   */
  buyUrl?: string;
  widthCm?: number;
  heightCm?: number;
}

export async function fetchCollectionArtworks(
  collectionHandle: string,
  limit: number = 24
): Promise<ShopifyArtwork[]> {
  const domain = import.meta.env.VITE_SHOPIFY_DOMAIN;
  const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

  // Ako env varijable nisu postavljene, samo vrati prazan niz — App.tsx već ima localArtworks fallback
  if (!domain || !token || !collectionHandle) {
    console.warn(
      "[RoomVibe] Missing Shopify env vars (VITE_SHOPIFY_DOMAIN, VITE_SHOPIFY_STOREFRONT_TOKEN) or collection handle."
    );
    return [];
  }

  const endpoint = `https://${domain}/api/2023-07/graphql.json`;

  const query = `
    query RoomVibeCollection($handle: String!, $limit: Int!) {
      collectionByHandle(handle: $handle) {
        products(first: $limit) {
          edges {
            node {
              id
              title
              handle
              onlineStoreUrl
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    handle: collectionHandle,
    limit,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      console.error("[RoomVibe] Storefront API error:", res.status, res.statusText);
      return [];
    }

    const json = await res.json();

    if (json.errors) {
      console.error("[RoomVibe] Storefront API GraphQL errors:", json.errors);
      return [];
    }

    const collection = json.data?.collectionByHandle;
    if (!collection) {
      console.warn(
        "[RoomVibe] No collection found for handle:",
        collectionHandle
      );
      return [];
    }

    const edges = collection.products?.edges || [];

    const artworks: ShopifyArtwork[] = edges
      .map((edge: any) => {
        const node = edge?.node;
        if (!node) return null;

        const img = node.featuredImage;
        const imageUrl: string | undefined = img?.url;

        if (!imageUrl) return null;

        // Build buyUrl: use onlineStoreUrl if available, otherwise construct from handle
        let buyUrl: string | undefined = node.onlineStoreUrl;
        if (!buyUrl && node.handle) {
          buyUrl = `https://${domain}/products/${node.handle}`;
        }

        const artwork: ShopifyArtwork = {
          id: node.id,
          handle: node.handle || undefined,
          title: node.title,
          imageUrl,
          onlineStoreUrl: node.onlineStoreUrl || undefined,
          buyUrl,
        };

        return artwork;
      })
      .filter(Boolean) as ShopifyArtwork[];

    return artworks;
  } catch (err) {
    console.error("[RoomVibe] Error fetching Shopify collection:", err);
    return [];
  }
}

export interface ProductDetails {
  handle: string;
  title: string;
  imageUrl?: string;
  description?: string;
}

export async function fetchProductByHandle(
  handle: string
): Promise<ProductDetails | null> {
  const domain = typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.VITE_SHOPIFY_DOMAIN 
    : process.env.VITE_SHOPIFY_DOMAIN;
  const token = typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN 
    : process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.warn("[RoomVibe] Missing Shopify env vars for fetchProductByHandle");
    return null;
  }

  const endpoint = `https://${domain}/api/2023-07/graphql.json`;

  const query = `
    query GetProduct($handle: String!) {
      productByHandle(handle: $handle) {
        handle
        title
        description
        featuredImage {
          url
        }
      }
    }
  `;

  const variables = { handle };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      console.error("[RoomVibe] fetchProductByHandle error:", res.status);
      return null;
    }

    const json = await res.json();
    const product = json?.data?.productByHandle;

    if (!product) {
      console.warn(`[RoomVibe] Product not found: ${handle}`);
      return null;
    }

    return {
      handle: product.handle,
      title: product.title,
      imageUrl: product.featuredImage?.url,
      description: product.description,
    };
  } catch (err) {
    console.error("[RoomVibe] Error fetching product:", handle, err);
    return null;
  }
}
