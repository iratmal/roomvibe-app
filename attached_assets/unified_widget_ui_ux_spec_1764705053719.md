# ROOMVIBE — UNIFIED WIDGET UI/UX SPEC  
*(Visual Style, Layout, Animations, Mobile Behavior)*

Ovaj dokument definira UI i UX standarde za **jedinstveni RoomVibe Widget** koji se automatski prilagođava Artist, Designer i Gallery modu.  
Ovo je službena specifikacija za vizualni izgled, interakcije, animacije, raspored elemenata i ponašanje na mobilnim uređajima.

---

# 1) DESIGN SYSTEM (GLOBAL STIL)

Widget mora koristiti RoomVibe brend boje:

### PRIMARY COLORS
- **Navy Blue**: #283593  
- **Gold (premium)**: #D8B46A  
- **Soft Grey**: #DDE1E7  
- **White**: #FFFFFF  

### TYPOGRAPHY
- **Inter** (Light, Regular, Medium, SemiBold)
- Font scale:
  - Title: 18–20 px, semibold
  - Subtitles: 16 px, medium
  - Body: 14–15 px, regular
  - Captions: 12 px, regular

### SHAPES & CORNERS
- Border radius: **8 px**
- Icon stroke width: **1.75 px**
- Shadows minimalne: `0px 2px 6px rgba(0,0,0,0.08)`

---

# 2) LAYOUT STRUCTURE

Widget se sastoji od sljedećih zona:

### 1) **Top Bar (Header)**
- Title (e.g. “Preview in your room” / “Designer Studio” / “Gallery View”)
- Close button (X)
- Optional info icon (opens mini-tutorial)

### 2) **Canvas Area (Main View)**
- Glavni prikaz sobe / galerijskog zida
- Artwork positioned on top
- Scaling handles only when editing
- 16:9 default ratio, responsive scaling

### 3) **Bottom Control Bar**
Sadrži centralne akcije (ovisno o modu):

#### Artist Mode:
- Change Room
- Frame Options
- Download

#### Designer Mode:
- Premium Rooms
- Mockups
- Export (PNG/JPG/PDF)

#### Gallery Mode:
- Exhibition Rooms
- Artwork List
- Export (PDF / Slideshow)

---

# 3) ICONOGRAPHY

Koristiti ikone iz lucide-react ili Feather seta:

- **Download**  
- **Image / Gallery**  
- **Frame**  
- **Room / Building**  
- **Layers**  
- **Arrow Left/Right** (exhibition navigation)
- **Close**  
- **Info**  

Sve ikone:
- veličina: **18 px**
- stroke: **1.75 px**
- boja: navy (#283593), ili gold (#D8B46A) za premium funkcije

---

# 4) BUTTON STYLES

## PRIMARY BUTTON (Blue)
```
background: #283593
color: #fff
padding: 10px 16px
border-radius: 8px
font-weight: 500
```

## OUTLINE BUTTON (Blue)
```
border: 1.5px solid #283593
color: #283593
padding: 10px 16px
background: white
border-radius: 8px
```

## PREMIUM BUTTON (Gold)
```
border: 1.5px solid #D8B46A
color: #D8B46A
background: white
padding: 10px 16px
border-radius: 8px
```

## TEXT BUTTON
```
color: #283593
text-decoration: underline on hover
```

---

# 5) MODE-SPECIFIC UI BEHAVIOR

# ARTIST MODE — UI RULES
- Prikazuje jedan artwork
- “Buy Now” button visible if buyUrl exists
- Room selector (3–10 rooms)
- Frame selector
- Simple export:
  - Download
  - High-Res Download (if entitlement)

# DESIGNER MODE — UI RULES
- Premium Rooms grid (10–100 rooms)
- High-res export enabled
- PNG/JPG/PDF export options
- No Buy Now button
- Room switching always available
- Frame options enabled

# GALLERY MODE — UI RULES
- Multi-artwork wall layout
- Artwork list displayed as thumbnails (horizontal scroll)
- Exhibition navigation
- Export entire exhibition as PDF
- Modal on artwork tap

---

# 6) ANIMATION SPEC

## FADE-IN
Svi elementi se pojavljuju s blagim fade-inom:
```
opacity: 0 → 1 over 200ms
transform: translateY(4px) → 0
```

## ROOM TRANSITION
Kod promjene sobe:
```
fade out 150ms
fade in 150ms
```

## ARTWORK INTERACTIONS
- On hover: artwork shadow 3% (subtle)
- Scaling handles appear with fade-in

## EXHIBITION MODE
- Arrow navigation: slide-left/slide-right, 150ms easing

---

# 7) MOBILE BEHAVIOR

## CANVAS
- Full width
- Height = 70% viewport height
- Touch-based drag detection
- Vertical scroll allowed (critical)

## CONTROLS
- Bottom bar converted to:
  - Carousel nav for tools (scrollable)
  - Sticky bottom position

## EXHIBITION MODE (Mobile)
- Swipe left/right for navigation
- Tap artwork → modal full-screen
- Modal close via swipe-down

---

# 8) RESPONSIVENESS

### Desktop:
- Sidebar on the right (20–30% width)
- Canvas left (70–80%)

### Tablet:
- Stack: Canvas on top, controls below

### Mobile:
- Canvas: full width + 70% height
- Controls: sticky bottom bar

---

# 9) ERROR / LOCK STATES

Ako korisnik pokuša koristiti feature bez entitlements:

- Button becomes gold outline
- On click → show Upgrade modal

Upgrade modal:
```
title: Unlock Premium Tools
text: This feature is part of the Designer or Gallery Plan.
button: Upgrade Now
```

---

# 10) STOP CONDITIONS (THE WIDGET IS DONE WHEN…)

✓ UI prilagođen modu (Artist, Designer, Gallery)  
✓ Sve ikone i boje u skladu s brandom  
✓ Export kontrole pozicionirane pravilno  
✓ Room-changing radi s tranzicijama  
✓ Exhibition radi na desktop + mobile  
✓ Widget mobile scroll fix funkcionalan  
✓ CTA i lock states rade  
✓ Sve animacije fluidne  

---

# 11) NOTES

- Widget mora ostati lagan (< 200 KB minified)
- Svi resursi se učitavaju lazy-load metodom
- Moraju se izbjeći velike JS bundle-ove
- Mora se učitati <1s na 4G vezi

