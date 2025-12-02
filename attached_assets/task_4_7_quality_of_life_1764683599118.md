# Task 4.7 — Quality-of-Life Improvements (Drag Precision, Crop, Scaling)

**Goal**  
Improve the precision and stability of artwork manipulation in the Studio: dragging, scaling, and cropping.  
This is a polishing task — no new features, only smoother interaction.

---

## Scope

### 1. Drag Precision
- Increase pointer tracking accuracy when dragging artworks on the canvas.
- Reduce jitter and micro-jumps during slow movement.
- Ensure consistency on:
  - Desktop (mouse)
  - Mobile (touch input)
- Maintain boundaries so artwork cannot exit the visible canvas.

### 2. Scaling Improvements
- Make scaling smoother and more predictable.
- Maintain consistent scaling ratio:
  - Small handle movement → small scale change
  - Larger movement → proportional scaling
- Prevent snapping/jumping near min/max size.
- Always maintain aspect ratio.

### 3. Crop Tool Stability
- Ensure the crop overlay moves in sync with the image.
- Improve edge/corner grab detection.
- Real‑time updates without stutter or lag.

### 4. Mobile Responsiveness
- Improve touch responsiveness for drag/scale/crop.
- Ensure handles are easily tappable.
- Prevent the browser from scrolling while manipulating artwork on canvas.

---

## Stop Condition
- Dragging is smooth with no jitter.
- Scaling is fluid, proportional, and stable.
- Crop tool behaves correctly without misalignment.
- Mobile interactions work reliably.
- No regressions in artwork loading, room switching, or frame tools.

---

## Notes
- Do NOT refactor the entire Studio; only adjust interaction logic where needed.
- Any required refactoring should be isolated and minimal.
- Reuse existing logic/libraries; do not add new dependencies.
