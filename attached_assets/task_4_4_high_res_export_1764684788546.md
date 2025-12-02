# Task 4.4 — High-Resolution Export + PDF Export

**Goal**  
Enable users to export their Studio visualization in high resolution (3000px or higher) and as a PDF.  
Free plan should only allow low-res exports with a watermark.

---

## Scope

### 1. High-Resolution Image Export
- Add a high-resolution export option in the Studio actions panel.
- Export resolution target: **minimum 3000px on the longest side**.
- Ensure exported image includes:
  - room background
  - placed artwork
  - frame (if selected)
  - correct scaling and positioning

### 2. Render Engine Improvements
- Use the existing canvas rendering pipeline and increase output resolution.
- Avoid pixelation by:
  - scaling artwork source images appropriately
  - rendering at 2× or 3× canvas size before downscaling to target resolution
- Ensure aspect ratio is preserved.

### 3. PDF Export
- Add “Export as PDF” button next to high-res export.
- PDF should contain:
  - exported image centered on the page
  - simple white margin
  - optional caption at the bottom (e.g. “RoomVibe Visualization”) — keep minimal
- PDF layout must remain lightweight (no heavy templates).

### 4. Plan Restrictions
- **Free plan:**  
  - Only low-resolution export allowed (e.g. 1280px max).  
  - Add a small, tasteful watermark: “RoomVibe – Upgrade for High‑Res”.  
  - High-res & PDF buttons should trigger upgrade modal.

- **Basic / Artist / Designer / Gallery plans:**  
  - All export options fully unlocked  
  - No watermark  

### 5. UI Integration
- Add export options to existing export dropdown or toolbar.
- Ensure each action shows loading state during rendering.

---

## Stop Condition
- Exporting in high resolution works and produces clean, non‑pixelated images.
- PDF export generates correct layout with centered image.
- Free plan correctly restricts high‑res/PDF and shows upgrade modal.
- Paid plans export without watermark.
- No regressions to Studio rendering or artwork manipulation.

---

## Notes
- Reuse existing canvas/image rendering logic — do not introduce new libraries unless necessary.
- Keep PDF generation simple and lightweight.
- If export performance is slow, use async rendering or worker thread where appropriate.
