# ROOMVIBE — UNIFIED WIDGET SYSTEM (FULL TECH SPEC)

## GOAL
Implementirati **jedan jedinstveni RoomVibe widget** koji se automatski prilagođava modulu korisnika (Artist, Designer, Gallery) na temelju njegovih *entitlements*.  
Widget mora biti skalabilan, modularan i jednostavan za implementaciju na bilo koji web (Shopify, Wix, WooCommerce, Webflow, HTML…).

---

# 1) HIGH-LEVEL CONCEPT

Jedan widget → tri modusa → sve ovisi o entitlements:

- `artist_access = true` → Artist Mode  
- `designer_access = true` → Designer Mode  
- `gallery_access = true` → Gallery Mode  

Nije potrebna različita instalacija.  
User embed-a jedan jedini snippet na svoj web → RoomVibe backend vraća prava, postavke i sadržaj.

---

# 2) WIDGET EMBED SNIPPET

Widget se integrira ovim jednim kodom:

```html
<script 
  src="https://cdn.roomvibe.app/widget.js"
  data-widget-id="USER_WIDGET_TOKEN">
</script>
```

`USER_WIDGET_TOKEN` generira se u dashboardu i povezan je s user entitlements.

---

# 3) BACKEND API — WHAT WIDGET FETCHES

Widget poziva:

`GET /api/widget/config?widgetId=XXX`

Backend vraća:

```
{
  "userType": "artist" | "designer" | "gallery",
  "entitlements": {
      "artist_access": true/false,
      "designer_access": true/false,
      "gallery_access": true/false
  },
  "capabilities": {
      "premiumRooms": true/false,
      "highResExport": true/false,
      "multiArtwork": true/false,
      "exhibitionMode": true/false,
      "buyButton": true/false
  },
  "data": {
      "artworks": [...],
      "rooms": [...],
      "galleryScenes": [...],
      "buyUrl": "https://..."
  }
}
```

Widget potom prikazuje UI prema `capabilities`.

---

# 4) WIDGET MODES (BEHAVIOR)

## 🎨 ARTIST MODE
- prikazuje jedan artwork u sobi
- omogućuje preview u različitim prostorima
- omogućuje odabir okvira
- prikazuje **Buy Now** gumb ako user ima buyUrl
- export: JPG/PNG low-res (ako nema Designer plan)
- export high-res: samo ako ima `designer_access` ili `pro_access`

## 🏛 DESIGNER MODE
- prikazuje premium rooms
- nema Buy Now gumba
- omogućuje multi-export (PNG/JPG/PDF)
- omogućuje presentation mode
- omogućuje frame styling
- koristi artworke koje je dizajner učitao

## 🖼 GALLERY MODE
- multi-art layout (više slika u jednoj sceni)
- virtual gallery walls (presetovi)
- click → open modal (details)
- exhibition slideshow
- exhibition public link
- PDF export entire gallery

---

# 5) FEATURE MATRIX

| Feature | Artist | Designer | Gallery |
|--------|--------|----------|---------|
| Preview in Rooms | ✔ | ✔ | ✔ |
| Buy Button | ✔ | ✖ | optional |
| Premium Rooms | ✖ | ✔ | ✔ |
| Multi-Art Walls | ✖ | ✖ | ✔ |
| Exhibition Mode | ✖ | ✖ | ✔ |
| High-Res Export | optional | ✔ | ✔ |
| Frames | ✔ | ✔ | ✔ |
| PDF Export | optional | ✔ | ✔ |

---

# 6) FRONTEND ARCHITECTURE

Widget.js mora:

1. Fetch configuration → `/api/widget/config`
2. Render UI container
3. Load correct mode handler:
```
if (ent.artist_access) loadArtistMode()
if (ent.designer_access) loadDesignerMode()
if (ent.gallery_access) loadGalleryMode()
```
4. Apply features based on capabilities
5. Initialize event listeners (Export, Buy, ChangeRoom, etc.)
6. Handle mobile responsiveness

---

# 7) DESIGN SYSTEM REQUIREMENTS

Widget mora koristiti RoomVibe boje:

- Primary Blue: `#283593`
- Gold: `#D8B46A`
- Soft Grey: `#DDE1E7`
- White: `#FFFFFF`

### BUTTON STYLING
Primary:
```
background: #283593
color: white
border-radius: 8px
padding: 10px 16px
```

Secondary:
```
border: 1.5px solid #283593
color: #283593
background: white
```

Premium (Designer/Gallery):
```
border: 1.5px solid #D8B46A
color: #D8B46A
```

---

# 8) EXPORT LOGIC

## Low-Res Export (always available)
- up to 1200 px
- no watermark for paid plans
- watermark only for Free users

## High-Res Export (only if designer_access or gallery_access)
- 3000+ px
- PDF export allowed
- multi-page PDF for exhibitions

---

# 9) PUBLIC EXHIBITION LINK

Ako user ima gallery_access:

`GET https://roomvibe.app/exhibition/{widgetId}`

Widget prikazuje:

- gallery walls
- artworks
- modal details
- navigation arrows
- “Contact Gallery” button (optional)

---

# 10) UPGRADE FLOWS

Ako user pokušava koristiti funkciju koju nema:

→ Trigger modal:

```
This feature is part of the Designer / Gallery Plan.
Upgrade now to unlock premium rooms and high‑resolution exports.
```

Buttons:
- Upgrade Now
- Cancel

---

# 11) STOP CONDITION

Widget je gotov kada:

✓ isti embed radi za sve module  
✓ widget prikazuje Artist, Designer ili Gallery funkcije prema entitlements  
✓ export radi pravilno za sve planove  
✓ Buy Now prikazuje se samo u Artist modu  
✓ Premium Rooms prikazani samo ako user ima prava  
✓ Gallery Mode podržava multi-art layout + exhibitions  
✓ widget radi na mobilnom i desktop  
✓ upgrade modal radi  

---

# 12) NOTES

- Ne raditi poseban widget za svakog korisnika — sve mora biti unified.
- Jedan widget.js file → sve logike unutar njega.
- Mora biti moguće proširiti modul u budućnosti (AI preporuke, auto-layout).
