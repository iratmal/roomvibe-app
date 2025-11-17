(function () {
  // 🔧 1) EDIT THIS PART WITH YOUR REAL DATA
  const SHOPIFY_DOMAIN = "irenartstudio.myshopify.com";
  const STOREFRONT_TOKEN = "381db8b182e3b091e8ac5f35ea232c05";
  const COLLECTION_HANDLE = "roomvibe-studio";

  // Global state for loaded products
  let rvProducts = [];

  async function fetchRoomVibeProducts() {
    const endpoint = `https://${SHOPIFY_DOMAIN}/api/2023-07/graphql.json`;

    const query = `
      query RoomVibeCollection($handle: String!) {
        collectionByHandle(handle: $handle) {
          title
          products(first: 50) {
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
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = { handle: COLLECTION_HANDLE };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error("Storefront API error: " + res.status);
    }

    const json = await res.json();
    if (json.errors) {
      console.error("Storefront API errors:", json.errors);
      throw new Error("Storefront API GraphQL errors");
    }

    const collection = json.data.collectionByHandle;
    if (!collection) {
      throw new Error(`Collection '${COLLECTION_HANDLE}' not found`);
    }

    const products = collection.products.edges.map((edge) => edge.node);
    return products;
  }

  // Helper: parse title "Name — 100 × 150 cm — RoomVibe"
  function parseRoomVibeTitle(fullTitle) {
    const parts = fullTitle.split("—").map((p) => p.trim());
    const name = parts[0] || fullTitle;
    const dims = parts[1] || "";
    return { name, dims };
  }

  function initRoomVibe() {
    const root = document.getElementById("roomvibe-root");
    if (!root) return;

    // Basic layout skeleton (English only)
    root.innerHTML = `
      <div style="
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        min-height: 70vh;
        padding: 16px;
        display: flex;
        gap: 24px;
        box-sizing: border-box;
      ">
        <!-- Sidebar: artworks & controls -->
        <aside style="
          width: 260px;
          border-right: 1px solid #e5e7eb;
          padding-right: 16px;
          box-sizing: border-box;
        ">
          <h1 style="
            font-size: 22px;
            font-weight: 600;
            margin: 0 0 4px 0;
          ">
            RoomVibe Studio
          </h1>
          <p style="
            font-size: 13px;
            color: #6b7280;
            margin: 0 0 16px 0;
          ">
            Choose an artwork and see how it looks on the wall.
          </p>

          <div style="margin-bottom: 16px;">
            <label style="
              font-size: 12px;
              font-weight: 500;
              display: block;
              margin-bottom: 4px;
            ">
              Step 1: Room preset (demo)
            </label>
            <select style="
              width: 100%;
              font-size: 13px;
              padding: 6px 8px;
              border-radius: 8px;
              border: 1px solid #d1d5db;
              background: #f9fafb;
            ">
              <option>Modern living room</option>
              <option>Cozy bedroom</option>
              <option>Elegant dining room</option>
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="
              font-size: 12px;
              font-weight: 500;
              display: block;
              margin-bottom: 4px;
            ">
              Step 2: Artwork size (demo)
            </label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" data-size="small" style="
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 999px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                cursor: pointer;
              ">
                60 × 80 cm
              </button>
              <button type="button" data-size="medium" style="
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 999px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                cursor: pointer;
              ">
                80 × 120 cm
              </button>
              <button type="button" data-size="large" style="
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 999px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                cursor: pointer;
              ">
                100 × 150 cm
              </button>
            </div>
          </div>

          <div>
            <label style="
              font-size: 12px;
              font-weight: 500;
              display: block;
              margin-bottom: 4px;
            ">
              Step 3: Choose artwork
            </label>
            <p style="
              font-size: 12px;
              color: #9ca3af;
              margin: 0 0 8px 0;
            ">
              These artworks are loaded from your Shopify “RoomVibe Studio” collection.
            </p>
            <div id="rv-artwork-list" style="
              display: flex;
              flex-direction: column;
              gap: 6px;
              max-height: 260px;
              overflow: auto;
            ">
              <div style="
                font-size: 12px;
                color: #9ca3af;
              ">
                Loading artworks…
              </div>
            </div>
          </div>
        </aside>

        <!-- Main area: room visualizer -->
        <main style="
          flex: 1;
          box-sizing: border-box;
        ">
          <div style="
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            padding: 16px;
            background: #f9fafb;
            box-shadow: 0 10px 25px rgba(15,23,42,0.08);
          ">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              gap: 8px;
              flex-wrap: wrap;
            ">
              <div>
                <h2 style="
                  font-size: 16px;
                  font-weight: 600;
                  margin: 0 0 4px 0;
                ">
                  See the artwork on your wall
                </h2>
                <p style="
                  font-size: 13px;
                  color: #6b7280;
                  margin: 0;
                ">
                  This is the RoomVibe widget embedded into your Shopify store.
                </p>
              </div>
              <button type="button" id="rv-buy-button" style="
                font-size: 13px;
                padding: 8px 14px;
                border-radius: 999px;
                border: none;
                background: #a855f7;
                color: white;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
              ">
                <span>Buy in one click</span>
                <span>⚡</span>
              </button>
            </div>

            <div style="
              position: relative;
              height: 280px;
              border-radius: 16px;
              overflow: hidden;
              background: linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 60%, #d1d5db 60%, #d1d5db 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <!-- Sofa / furniture (stylized demo) -->
              <div style="
                position: absolute;
                bottom: 18px;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 70px;
                border-radius: 18px;
                background: #f3f4f6;
                box-shadow: 0 8px 20px rgba(15,23,42,0.16);
              "></div>

              <!-- Artwork frame on wall -->
              <div
                id="rv-demo-frame"
                data-size="medium"
                style="
                  position: relative;
                  width: 36%;
                  aspect-ratio: 4 / 3;
                  border-radius: 12px;
                  border: 3px solid #a855f7;
                  background-color: #f9fafb;
                  background-size: cover;
                  background-position: center;
                  background-repeat: no-repeat;
                  box-shadow: 0 12px 30px rgba(15,23,42,0.25);
                  transition: transform 0.25s ease, box-shadow 0.25s ease, width 0.25s ease;
                "
              >
                <div id="rv-demo-label" style="
                  position: absolute;
                  bottom: 8px;
                  right: 10px;
                  font-size: 11px;
                  padding: 4px 8px;
                  border-radius: 999px;
                  background: rgba(15,23,42,0.7);
                  color: #f9fafb;
                ">
                  Select an artwork to preview
                </div>
              </div>
            </div>

            <p style="
              font-size: 12px;
              color: #9ca3af;
              margin: 10px 0 0 0;
            ">
              This widget uses a hidden Shopify collection just for RoomVibe. Customers don’t see these products in your main storefront.
            </p>
          </div>
        </main>
      </div>
    `;

    const frame = root.querySelector("#rv-demo-frame");
    const label = root.querySelector("#rv-demo-label");
    const artworkList = root.querySelector("#rv-artwork-list");
    const buyButton = root.querySelector("#rv-buy-button");
    const sizeButtons = root.querySelectorAll("button[data-size]");

    if (!frame || !label || !artworkList || !buyButton) return;

    // Size buttons (visual only for now)
    sizeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const size = btn.getAttribute("data-size");
        if (size === "small") {
          frame.style.width = "28%";
        } else if (size === "medium") {
          frame.style.width = "36%";
        } else if (size === "large") {
          frame.style.width = "44%";
        }
      });
    });

    // Load products from Shopify
    fetchRoomVibeProducts()
      .then((products) => {
        rvProducts = products;
        if (!products.length) {
          artworkList.innerHTML = `
            <div style="font-size: 12px; color: #9ca3af;">
              No artworks found in the “${COLLECTION_HANDLE}” collection.
            </div>
          `;
          return;
        }

        artworkList.innerHTML = "";

        products.forEach((product, index) => {
          const { name, dims } = parseRoomVibeTitle(product.title);
          const img = product.featuredImage;

          const btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("data-index", String(index));
          btn.style.cssText = `
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            cursor: pointer;
            text-align: left;
          `;

          btn.innerHTML = `
            <div style="
              width: 40px;
              height: 32px;
              border-radius: 6px;
              overflow: hidden;
              background: #e5e7eb;
              flex-shrink: 0;
            ">
              ${
                img
                  ? `<img src="${img.url}" alt="${img.altText || name}" style="width: 100%; height: 100%; object-fit: cover;" />`
                  : ""
              }
            </div>
            <div style="flex: 1;">
              <div style="font-size: 12px; font-weight: 500; color: #111827;">
                ${name}
              </div>
              ${
                dims
                  ? `<div style="font-size: 11px; color: #6b7280;">${dims}</div>`
                  : ""
              }
            </div>
          `;

          btn.addEventListener("click", function () {
            selectArtwork(index, frame, label, buyButton);
          });

          artworkList.appendChild(btn);
        });

        // Auto-select first artwork
        selectArtwork(0, frame, label, buyButton);
      })
      .catch((err) => {
        console.error(err);
        artworkList.innerHTML = `
          <div style="font-size: 12px; color: #ef4444;">
            Could not load artworks. Please check your Storefront API token, domain, and collection handle.
          </div>
        `;
      });
  }

  function selectArtwork(index, frame, label, buyButton) {
    const product = rvProducts[index];
    if (!product) return;

    const { name, dims } = parseRoomVibeTitle(product.title);
    const img = product.featuredImage;

    if (img && img.url) {
      frame.style.backgroundImage = `url("${img.url}")`;
    } else {
      frame.style.backgroundImage = "none";
      frame.style.backgroundColor = "#f3f4f6";
    }

    const priceVariant =
      product.variants.edges[0] && product.variants.edges[0].node;
    const price =
      priceVariant && priceVariant.price
        ? `${priceVariant.price.amount} ${priceVariant.price.currencyCode}`
        : "";

    const dimsText = dims ? ` — ${dims}` : "";
    const priceText = price ? ` — ${price}` : "";

    label.textContent = `${name}${dimsText}${priceText}`;

    // For now: Buy button opens product page if onlineStoreUrl exists
    buyButton.onclick = function () {
      if (product.onlineStoreUrl) {
        window.open(product.onlineStoreUrl, "_blank");
      } else {
        alert("This artwork is not visible in your online store yet.");
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRoomVibe);
  } else {
    initRoomVibe();
  }
})();
