# Final Hero Instructions for Replit Agent

Hi! The hero layout and image are close to what I want. I just need three final tweaks to finish it:

---

## 1) Use the optimized hero image

Please use the optimized hero file I uploaded:

- `desktop_optimized.webp` as the main source
- `desktop.png` (or `.jpg`) as fallback

Example:
```jsx
<picture>
  <source srcSet="/desktop_optimized.webp" type="image/webp" />
  <img
    src="/desktop.png"
    alt="RoomVibe – visualize art on your walls"
    className="hero-image"
  />
</picture>
```

```css
.hero-image {
  width: 100%;
  height: auto;   /* no cropping */
  display: block;
}
```

---

## 2) Visually scale down the entire hero (logo, text and button)

Right now the hero looks too big on desktop. Please slightly scale it down as a whole.

Wrap the hero in a scale container:

```jsx
<section className="hero-shell">
  <div className="hero-inner">
    <div className="hero-scale">
      <div className="hero-clickable">
        {/* picture + img + overlay button here */}
      </div>
    </div>
  </div>
</section>
```

CSS example:
```css
.hero-shell {
  padding: 24px 0;
}

.hero-inner {
  max-width: 1100px;   /* limit width on desktop */
  margin: 0 auto;
  padding: 0 24px;
}

.hero-scale {
  transform: scale(0.82);       /* shrink everything ~18% */
  transform-origin: top center; /* shrink inward, not off-screen */
}

@media (max-width: 768px) {
  .hero-scale {
    transform: none;  /* full size on mobile */
  }
}
```

This will make the logo, headline and button all noticeably smaller and more balanced on desktop.

---

## 3) Make the button on the image clickable (and remove extra button below)

I only want **one** visible CTA button – the blue "Start Visualizing" button inside the hero image – and it should link to `/studio`.

Please:
- Remove any extra HTML button below the hero.
- Add a transparent overlay button on top of the printed blue button in the image.

Structure:
```jsx
<div className="hero-clickable">
  <picture> {/* hero image here */} </picture>
  <button
    className="hero-cta-overlay"
    onClick={() => navigate("/studio")}
    aria-label="Start Visualizing"
  />
</div>
```

CSS (adjust numbers so it aligns exactly over the blue button area in the image):
```css
.hero-clickable {
  position: relative;
}

.hero-cta-overlay {
  position: absolute;
  bottom: 15%;   /* tweak to match button position */
  left: 12%;     /* tweak horizontally */
  width: 260px;  /* width of the blue button area */
  height: 64px;  /* height of the button area */
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 2;
}
```

When the user clicks the blue "Start Visualizing" button on the hero image, this overlay button should trigger and navigate to `/studio`.

---

After these tweaks:
- The hero will show the full image.
- All elements (logo, text, button) will look smaller and more elegant.
- There will be a single, clean CTA that works.

Please **Publish** after applying these changes so I can review the final result.

Thank you! 🙌

