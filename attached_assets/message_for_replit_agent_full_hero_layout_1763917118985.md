# Message for Replit Agent – Full Hero Layout Update

Hi! I’d like to update the homepage hero section so that it matches the original full‑width hero design (the one with the text and button overlayed directly on the room photo), instead of the current split two‑column layout with a white background.

Below are the exact instructions:

---

## 1. Use the full hero image as the background of the hero section

The image has been uploaded to the `public/` folder:

**`roomvibe-hero-desktop.jpg`**

Please update the hero section so that it becomes **one full-width block** with this image as the background.

**Example structure:**
```
<section className="hero">
  <div className="hero-content">
    {/* text + button */}
  </div>
</section>
```

**CSS example:**
```
.hero {
  background-image: url("/roomvibe-hero-desktop.jpg");
  background-size: cover;
  background-position: center;
  border-radius: 24px;
  padding: 72px 64px;
  margin-top: 32px;
  position: relative;
  overflow: hidden;
}
```

---

## 2. Place the text + button on top of the image (left side)

Use the existing hero text:
- Heading: **Visualize Art on Your Walls — Instantly.**
- Subheading: **Preview real-size artwork on your wall or choose a preset room and start visualizing immediately.**
- Button: **Start Visualizing →** linking to `/studio`

Position them **over the background image**, aligned left.

**Example:**
```
.hero-content {
  max-width: 480px;
  position: relative;
  z-index: 1;
  color: #ffffff; /* or keep navy if using overlay */
}
```

### Optional readability overlay (recommended)
If needed, add a soft left gradient so the text stands out:
```
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.45),
    rgba(0, 0, 0, 0.0)
  );
  border-radius: inherit;
  z-index: 0;
}
```

---

## 3. Remove the separate right-hand card

Please remove the image card (room-on-right) from the current two-column layout.

The hero must be:
- One full-width background image
- Text + button overlayed on top (left side)
- No additional image card

---

## 4. Mobile behavior

On mobile screens:
- The hero should remain a full-width background image.
- Text + button stack nicely with comfortable padding.
- Cropping is fine as long as the painting and sofa remain visible.

---

## 5. Keep all existing links

- **Start Visualizing →** must link to `/studio`.
- Lower CTA section (“Open Studio →”) remains unchanged.

---

## 6. Publish

After making these changes, please **Publish** so I can review the updated homepage.

Thanks so much!



---

## Update – Fix hero height, duplicated text/button, logo visibility, and image optimization

Hi! Thanks for the update — we’re very close now. A few issues remain with the hero section:

- The hero is **too short**, so the image gets cropped (the RoomVibe logo at the top and part of the couch at the bottom are cut off).
- The headline text appears **twice** (once inside the image and once as HTML text overlay).
- The “Start Visualizing” button is also **duplicated**.
- The hero image is still **heavy in MB** and should be optimized.

Here’s what I need:

### 1. Display the full hero image without cropping

Instead of using the image as a CSS `background-image` (which forces cropping due to `background-size: cover`), please:

- Display the hero as a **full-width image element** inside a rounded container.
- Preserve its full aspect ratio so nothing gets cut off.

**Example structure:**
```
<section className="hero-wrapper">
  <picture>
    <source srcSet="/roomvibe-hero-desktop.webp" type="image/webp" />
    <img
      src="/roomvibe-hero-desktop.jpg"
      alt="RoomVibe hero – visualize art on your walls"
      className="hero-image"
    />
  </picture>
</section>
```

**CSS example:**
```
.hero-wrapper {
  border-radius: 24px;
  overflow: hidden;
  margin-top: 32px;
}

.hero-image {
  display: block;
  width: 100%;
  height: auto; /* ensures full image, no cropping */
}
```

This will ensure that the full RoomVibe logo, painting, sofa, and composition are all visible.

### 2. Remove the overlay text and the duplicated button

The hero image **already contains** the headline and graphical button as part of the design.

Please:

- Remove the **HTML overlay text** (`<h1>`, `<p>` etc.)
- Remove the **overlay Start Visualizing button** inside the hero section
- Add **one clean CTA button below the hero image**, linked to `/studio`

**Example CTA below the hero:**
```
<section className="hero-cta">
  <button className="primary-cta" onClick={() => navigate("/studio")}>
    Start Visualizing →
  </button>
</section>
```

### 3. Optimize the hero image (important)

The current hero image is around **2.6 MB**, which is too large.

Please:

- Convert it to **WebP** (`roomvibe-hero-desktop.webp`) at around **250–350 KB**
- Keep the JPG as fallback
- Use a `<picture>` element as shown above

This will significantly improve loading speed, especially on mobile.

### 4. Links & behavior

- The CTA button (**Start Visualizing →**) under the hero must link to `/studio`.
- All other sections remain unchanged.

---

After making these changes, please **Publish** so I can review the final version.

Thank you! 🙌