export type ShopifyArtwork = {
  id: string;
  title: string;
  widthCm?: number;
  heightCm?: number;
  imageUrl: string;
};

const DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;            // e.g. irenart.studio
const TOKEN  = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;  // Storefront API access token
const API = DOMAIN ? `https://${DOMAIN}/api/2024-10/graphql.json` : "";

export async function fetchCollectionArtworks(handle: string, first = 20): Promise<ShopifyArtwork[]> {
  if (!API || !TOKEN) return [];
  const query = `#graphql
    query CollectionProducts($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        title
        products(first: $first) {
          edges {
            node {
              id
              title
              images(first: 1) { edges { node { url } } }
              metafields(identifiers: [
                {namespace: "roomvibe", key: "width_cm"},
                {namespace: "roomvibe", key: "height_cm"}
              ]) {
                key
                value
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables: { handle, first } })
  });
  if (!res.ok) return [];
  const json = await res.json();
  const edges = json?.data?.collection?.products?.edges ?? [];
  return edges.map((e: any) => {
    const node = e.node;
    const metafields = Array.isArray(node.metafields) ? node.metafields.filter((m: any) => m != null) : [];
    const w = metafields.find((m: any) => m.key === "width_cm")?.value;
    const h = metafields.find((m: any) => m.key === "height_cm")?.value;
    const img = node.images?.edges?.[0]?.node?.url;
    return {
      id: node.id,
      title: node.title,
      imageUrl: img,
      widthCm: w ? parseFloat(w) : undefined,
      heightCm: h ? parseFloat(h) : undefined,
    } as ShopifyArtwork;
  });
}
