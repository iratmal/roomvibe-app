// src/shopify.ts

export interface ShopifyArtwork {
  id: string;
  title: string;
  imageUrl: string;
  /**
   * URL na Shopify product page – koristimo ga za
   * "View & Buy on Shopify" gumbe u App.tsx
   */
  onlineStoreUrl?: string;
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

        const artwork: ShopifyArtwork = {
          id: node.id,
          title: node.title,
          imageUrl,
          onlineStoreUrl: node.onlineStoreUrl || undefined,
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
