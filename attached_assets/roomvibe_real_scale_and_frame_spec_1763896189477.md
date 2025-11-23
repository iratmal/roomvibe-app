# RoomVibe – Real-Scale Rendering & Frame Logic Spec (for developer)

Hi! This file contains everything needed to correctly implement:

1. **Real-world scaling of artworks inside each room mockup**
2. **Correct frame behaviour (Slim / Gallery) without shrinking the artwork**

The goal is that every painting appears on the wall in **real physical size** (in cm) relative to the room, and that frames are added **outside** the artwork instead of eating into it.

---

## 1. Real-Scale Rendering of Artworks

### 1.1. Concept

Each **room preset** (Room 1–Room 10) has a wall that represents a real physical height in centimeters. The artwork has its own real height and width (e.g. 120 × 150 cm).

We want the app to:

- Convert the real size of the artwork from **cm → pixels**
- Render the artwork in the room so that its size is **correctly scaled** relative to the wall and furniture

This is the core value of RoomVibe: *“see art true-to-size on your wall.”*

---

### 1.2. Per-Room Wall Height Mapping

For now we use one **reference wall height** per room. These values are realistic approximations for standard residential interiors and can be tweaked later if needed.

```js
// Real wall height in centimeters for each room preset
const ROOM_WALL_HEIGHTS_CM = {
  room1: 270,
  room2: 270,
  room3: 270,
  room4: 270,
  room5: 270,
  room6: 270,
  room7: 270,
  room8: 270,
  room9: 270,
  room10: 270,
};
```

> Note: If later we want to fine-tune per-room values, they can be adjusted here without changing the rest of the logic.

---

### 1.3. Compute px/cm Ratio for the Wall

For a given room (e.g. `room1`):

1. Render the room mockup.
2. Measure the visible wall height in pixels.

Example (React):

```js
const wallRef = useRef(null);

useEffect(() => {
  if (!wallRef.current) return;
  const wallRect = wallRef.current.getBoundingClientRect();
  const wallPxHeight = wallRect.height;

  const wallHeightCm = ROOM_WALL_HEIGHTS_CM[currentRoomId]; // e.g. 270
  const pxPerCm = wallPxHeight / wallHeightCm;

  setPxPerCm(pxPerCm);
}, [currentRoomId]);
```

- `wallRef` should be attached to the actual wall area container (the part of the mockup where the painting is allowed to be placed).
- `pxPerCm` is now your main conversion factor: **1 cm in real life = pxPerCm pixels in this room.**

---

### 1.4. Convert Artwork Size (cm → pixels)

Each artwork has a real size, for example:

```js
const artworkWidthCm = 120;
const artworkHeightCm = 150;
```

Once `pxPerCm` is known, compute:

```js
const artworkWidthPx = artworkWidthCm * pxPerCm;
const artworkHeightPx = artworkHeightCm * pxPerCm;
```

Use these values to set the image size:

```jsx
<img
  src={artwork.imageUrl}
  style={{
    width: `${artworkWidthPx}px`,
    height: `${artworkHeightPx}px`,
  }}
/>
```

Now the painting appears at its **real-world size** relative to the room.

---

### 1.5. User Interaction Rules (Resize vs Move)

To preserve real scale:

- The user should primarily **move** the painting (drag) along the wall.
- Arbitrary free resize should be **disabled** or heavily constrained.

If a resize handle must remain for UX reasons:

- Default size = real size based on cm → px conversion (as above).
- Minimum size = 100% real scale.
- Maximum size = optional slight zoom (e.g. 120–130% of real scale), but this should be considered an advanced feature.

The key is that **initial rendering is always true-to-size**.

---

### 1.6. Display Dimensions in the UI

In the right-side Artwork panel, please display the real dimensions of the artwork:

- Under the artwork title (e.g. `Sandy`)
- Above the price and the `View & Buy` button

Example display:

```text
Size: 120 × 150 cm
```

This is purely visual and uses the same `artworkWidthCm` / `artworkHeightCm` values.

---

## 2. Frame Behaviour (None / Slim / Gallery)

### 2.1. Current Problem (to fix)

Right now, when the user selects **Slim** or **Gallery**:

- The **artwork shrinks inside the frame**.
- The thicker the frame → the smaller the inner image appears.

This is the opposite of what we want.

### 2.2. Correct Behaviour

- The artwork must keep its **real dimension** (e.g. 90 × 90 cm in pixels).
- The frame is added **outside** the artwork, increasing the total outer size, without touching the inner image.

So:

- Image: 90 × 90 cm → rendered at `artworkWidthPx` × `artworkHeightPx`.
- Slim frame: adds a small thickness around that image (e.g. 2–3 cm each side).
- Gallery frame: adds a thicker border (e.g. 6–8 cm each side).

The artwork must **never** be scaled down because of the frame.

---

### 2.3. Suggested Implementation

Define frame thickness in cm:

```js
const FRAME_THICKNESS_CM = {
  none: 0,
  slim: 3,
  gallery: 8,
};
```

Convert to pixels using the same `pxPerCm` factor:

```js
const frameThicknessCm = FRAME_THICKNESS_CM[selectedFrameStyle]; // none/slim/gallery
const frameThicknessPx = frameThicknessCm * pxPerCm;

const artworkWidthPx = artworkWidthCm * pxPerCm;
const artworkHeightPx = artworkHeightCm * pxPerCm;

const totalWidthPx = artworkWidthPx + frameThicknessPx * 2;
const totalHeightPx = artworkHeightPx + frameThicknessPx * 2;
```

Render structure:

```jsx
<div
  className="frame-wrapper"
  style={{
    width: `${totalWidthPx}px`,
    height: `${totalHeightPx}px`,
    boxSizing: "content-box",
    borderStyle: selectedFrameStyle === "none" ? "none" : "solid",
    borderWidth: selectedFrameStyle === "none" ? 0 : `${frameThicknessPx}px`,
    borderColor: "#ddd", // or appropriate frame color
  }}
>
  <img
    src={artwork.imageUrl}
    style={{
      width: `${artworkWidthPx}px`,
      height: `${artworkHeightPx}px`,
      display: "block",
    }}
  />
</div>
```

Key points:

- The `<img>` remains at the **same pixel dimensions** regardless of frame style.
- Only the outer wrapper changes size via border thickness.
- For `None`, border width is 0 and total size = artwork size.

---

### 2.4. Rename “Frame (Pro)” → “Frame”

Please also rename the section label from **“Frame (Pro)”** to simply **“Frame”**, since there is no Pro tier here.

Options remain:

- None
- Slim
- Gallery

---

## 3. Summary of Required Changes

1. **Real scale logic**
   - Map each room to a real wall height in cm (`ROOM_WALL_HEIGHTS_CM`).
   - Measure wall height in pixels and compute `pxPerCm`.
   - Render each artwork using `widthCm * pxPerCm`, `heightCm * pxPerCm`.
   - Disable arbitrary scaling or constrain it; default is always true-to-size.
   - Show the real dimensions (e.g. “120 × 150 cm”) in the artwork info panel.

2. **Frame behaviour**
   - Frame should **not shrink** the artwork.
   - Use `FRAME_THICKNESS_CM` + `pxPerCm` to add borders outside the artwork.
   - For “None”, no border and no extra size.
   - Rename “Frame (Pro)” to “Frame”.

3. **After implementation**
   - Please **Publish** the updated build so we can test the new scaling and frame behaviour in the live Studio.

Thanks a lot! This will make the RoomVibe Studio much closer to the final true-to-size experience we’re aiming for.
