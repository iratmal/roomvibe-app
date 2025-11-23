# Final Instructions for Replit Agent

Here is the clean, final version of ONLY the last required adjustments for the hero section — ready for copy/paste.

---

## ✔️ Final Required Adjustments for the Hero Section

Hi! Thank you — we are close to the final version. I need these last adjustments to complete the hero section:

### **1. Make the hero full-width (no card look, no rounded edges)**
- Remove the outer border-radius and card-style box.
- The hero image should span the full width of the content area.
- No extra margins that make it look like a floating card.

```css
.hero-wrapper {
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}

.hero-image {
  width: 100%;
  height: auto;
  display: block;
}
```

---

### **2. Reduce height slightly**
The hero is visually too tall.
- Remove excess paddings or margins.
- Optional: apply a max-height (as long as the full logo + painting + sofa remain visible).

```css
.hero-image {
  width: 100%;
  max-height: 640px; /* or similar */
  object-fit: cover;
}
```

---

### **3. Remove the duplicate button under the hero**
Only **one** button should exist — the one **inside the hero image**.
- Remove the bottom HTML button.

---

### **4. Make the button inside the hero image clickable**
Add a transparent overlay button on top of the graphical button printed in the image.

**Structure example:**
```jsx
<section className="hero-wrapper">
  <div className="hero-clickable">
    <picture>
      <source srcSet="/roomvibe-hero-desktop-optimized.webp" type="image/webp" />
      <img
        src="/roomvibe-hero-desktop.jpg"
        alt="RoomVibe hero image"
        className="hero-image"
      />
    </picture>
    <button
      className="hero-cta-overlay"
      onClick={() => navigate("/studio")}
      aria-label="Start Visualizing"
    />
  </div>
</section>
```

**Overlay button CSS (adjust to match button location in the image):**
```css
.hero-clickable {
  position: relative;
}

.hero-cta-overlay {
  position: absolute;
  bottom: 18%;  /* tweak if needed */
  left: 12%;    /* align to graphic button */
  width: 260px;
  height: 64px;
  background: transparent;
  border: none;
  cursor: pointer;
}
```

---

### **5. Keep using the optimized WebP file**
Continue using:
- `roomvibe-hero-desktop-optimized.webp` as primary source
- `roomvibe-hero-desktop.jpg` as fallback

---

### ✔️ When finished
Please **Publish** the changes so I can review the final appearance.

Thanks a lot!

