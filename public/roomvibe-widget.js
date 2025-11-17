(function () {
  function initRoomVibe() {
    var el = document.getElementById("roomvibe-root");
    if (!el) return;

    el.innerHTML = `
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
              Step 3: Choose artwork (demo)
            </label>
            <p style="
              font-size: 12px;
              color: #9ca3af;
              margin: 0 0 8px 0;
            ">
              For now these are demo artworks — later this will load your real pieces from a Shopify collection.
            </p>
            <div style="display: flex; gap: 8px;">
              <button type="button" data-art="sunrise" style="
                flex: 1;
                font-size: 11px;
                padding: 6px 8px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                cursor: pointer;
              ">
                Sunrise Energy
              </button>
              <button type="button" data-art="ocean" style="
                flex: 1;
                font-size: 11px;
                padding: 6px 8px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                cursor: pointer;
              ">
                Ocean Flow
              </button>
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
                  This is a demo of the RoomVibe widget embedded into your Shopify store.
                </p>
              </div>
              <button type="button" style="
                font-size: 13px;
                padding: 8px 14px;
                border-radius: 999px;
                border: none;
                background: #a855f7;
                color: white;
                cursor: default;
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
                  background: radial-gradient(circle at 10% 20%, #fee2e2 0, #fee2e2 30%, #e0f2fe 65%, #ede9fe 100%);
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
                  Sunrise Energy – 80 × 120 cm
                </div>
              </div>
            </div>

            <p style="
              font-size: 12px;
              color: #9ca3af;
              margin: 10px 0 0 0;
            ">
              In the next phase, this widget will show your real artworks from a Shopify collection, with exact sizes and a live “Buy now” button.
            </p>
          </div>
        </main>
      </div>
    `;

    // Tiny interactions: size + artwork change
    var frame = el.querySelector("#rv-demo-frame");
    var label = el.querySelector("#rv-demo-label");
    if (!frame || !label) return;

    var sizeButtons = el.querySelectorAll("button[data-size]");
    sizeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var size = btn.getAttribute("data-size");
        if (size === "small") {
          frame.style.width = "28%";
          label.textContent = "Sunrise Energy – 60 × 80 cm";
        } else if (size === "medium") {
          frame.style.width = "36%";
          label.textContent = "Sunrise Energy – 80 × 120 cm";
        } else if (size === "large") {
          frame.style.width = "44%";
          label.textContent = "Sunrise Energy – 100 × 150 cm";
        }
      });
    });

    var artButtons = el.querySelectorAll("button[data-art]");
    artButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var art = btn.getAttribute("data-art");
        if (art === "sunrise") {
          frame.style.background =
            "radial-gradient(circle at 10% 20%, #fee2e2 0, #fee2e2 30%, #e0f2fe 65%, #ede9fe 100%)";
          label.textContent = "Sunrise Energy – 80 × 120 cm";
        } else if (art === "ocean") {
          frame.style.background =
            "radial-gradient(circle at 10% 20%, #dbeafe 0, #bfdbfe 25%, #a5f3fc 60%, #e0f2fe 100%)";
          label.textContent = "Ocean Flow – 80 × 120 cm";
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRoomVibe);
  } else {
    initRoomVibe();
  }
})();
