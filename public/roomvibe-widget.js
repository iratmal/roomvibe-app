(function () {
  function initRoomVibe() {
    var el = document.getElementById("roomvibe-root");
    if (!el) return;

    el.innerHTML = `
      <div style="
        font-family: system-ui, sans-serif;
        min-height: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
      ">
        <div style="
          max-width: 480px;
          text-align: center;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 24px;
          box-shadow: 0 10px 25px rgba(15,23,42,0.08);
        ">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">
            RoomVibe widget v0.1
          </h1>
          <p style="font-size: 14px; color: #6b7280;">
            Ovo je vanjski javascript s <strong>app.roomvibe.app</strong> koji se učitava unutar Shopify stranice.
          </p>
        </div>
      </div>
    `;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRoomVibe);
  } else {
    initRoomVibe();
  }
})();
