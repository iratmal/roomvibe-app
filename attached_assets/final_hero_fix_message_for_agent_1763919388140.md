# Final Instructions for Replit Agent – Hero Must Be Smaller, Full Image Visible & Button Clickable

Hi! Thank you — the hero image is now fully visible. Two last adjustments are needed to finalize the layout.

---

## ✅ 1. Make the hero visually smaller on desktop (but keep full image visible)
Right now the hero appears too large because it stretches to full browser width.

Please limit the maximum width of the hero on desktop, and keep the image at full aspect ratio without cropping.

### **Use this structure:**
```
<section className="hero-shell">
  <div className="hero-inner">
    <div className="hero-clickable">
      <picture>
        <source srcSet="/roomvibe-hero-desktop-optimized.webp" type="image/webp" />
        <img
          src="/roomvibe-hero-desktop.jpg"
          alt="RoomVibe – visualize art on your walls"
          className="hero-image"
        />
      </picture>
      <button
        className="hero-cta-overlay"
        onClick={() => navigate("/studio")}
        aria-label="Start Visualizing"
      />
    </div>
  </div>
</section>
```

### **CSS:**
```
.hero-shell {
  padding: 32px 0;
}

.hero-inner {
  max-width: 1200px;     /* limit width so hero doesn’t look oversized */
  margin: 0 auto;
  padding: 0 24px;
}

.hero-image {
  width: 100%;
  height: auto;          /* full image, no cropping */
  display: block;
}
```
This ensures the hero displays the **entire image**, but is visually smaller and more balanced.

---

## ✅ 2. Make the button inside the image clickable
Please remove the HTML button below the hero — we only want the **button inside the hero image** to be clickable.

Add a transparent overlay where the printed button is on the image.

### **Overlay CSS:**
```
.hero-clickable {
  position: relative;
}

.hero-cta-overlay {
  position: absolute;
  bottom: 14%;     /* adjust if needed */
  left: 12%;       /* adjust if needed */
  width: 260px;    /* approximate blue button width */
  height: 64px;    /* approximate button height */
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 2;
}
```
Now when the user clicks the blue button visible on the hero image, they will navigate to `/studio`.

---

## ✅ 3. Continue using optimized WebP
Please keep:
- `roomvibe-hero-desktop-optimized.webp` as primary
- `roomvibe-hero-desktop.jpg` as fallback

---

## ✔️ When finished
Please **Publish** the changes so I can review the final hero.

Thank you!

