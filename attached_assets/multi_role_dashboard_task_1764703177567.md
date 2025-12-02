# TASK: Multi-Role Dashboard Architecture Update (Artist + Designer + Gallery)

## GOAL
Implementirati sustav u kojem jedan korisnik može imati pristup više RoomVibe modula (Artist, Designer, Gallery) istovremeno, ovisno o pretplatama. Korisnik NE gubi pristup artist sučelju ako kupi designer plan – sustav mora podržavati paralelne role.

---

# 1) REASONING (BUSINESS + UX)
- Mnogi korisnici su istovremeno umjetnici i dizajneri.
- Kada korisnik kupi Designer plan, ne smije izgubiti Artist Dashboard.
- Modularni pristup povećava fleksibilnost, smanjuje frustraciju i povećava lifetime value.
- Planovi se moraju moći kombinirati (Artist + Designer + Gallery).
- Svaki plan otključava određene module, bez uklanjanja prethodnih.

---

# 2) NEW SYSTEM — ENTITLEMENT-BASED ACCESS

Umjesto role-based pristupa (Artist OR Designer), uvodi se **entitlement system**:

### ENTITLEMENTS:
- `artist_access`  
- `designer_access`  
- `gallery_access`  

Kada korisnik kupi plan:
- Artist plan → `artist_access = true`
- Designer plan → `designer_access = true`
- Gallery plan → `gallery_access = true`

Korisnik može imati 1, 2 ili sve 3 entitlements istovremeno.

Ovo zamjenjuje stari model gdje korisnik ima jednu jedinu ulogu.

---

# 3) UI DESIGN — SIDEBAR LAYOUT

Sidebar treba prikazivati module prema entitlements:

### **ARTIST TOOLS**
- My Artworks
- Upload Artwork
- Artist Widget
- Artist Collections

### **DESIGNER TOOLS**
- Premium Rooms
- Designer Studio
- Mockups
- Moodboards
- Projects

### **GALLERY TOOLS**
- Gallery Studio
- Virtual Exhibitions
- Collection Uploads

Ako korisnik nema entitlement → prikazuje se lock ikonica + Upgrade modal.

---

# 4) BILLING LOGIC

### OPTION A (recommended): Stackable Plans
User može kupiti:
- Artist 9€
- Designer 29€
- Gallery 49€

Total = 87€ → pristup svim modulima.

### OPTION B (optional): All-Access Plan
Jedan premium plan koji uključuje sve.

---

# 5) BACKEND IMPLEMENTATION

### 1) Add fields in user model:
```
artist_access: boolean
designer_access: boolean
gallery_access: boolean
```

### 2) Stripe subscription → webhook handler:
Kada stiže invoice/payment_success:

- Ako je proizvod Artist → set `artist_access = true`
- Ako Designer → set `designer_access = true`
- Ako Gallery → set `gallery_access = true`

Ako korisnik otkaže plan:
- `artist_access = false` (ili ostaje true do kraja billing cycle)
- isto za ostale entitlements

### 3) API middleware:
Svaki modul provjerava entitlement umjesto role.

Primjer:
```
if (!user.designer_access) return 403;
```

---

# 6) FRONTEND LOGIC

Sidebar generira sekcije na temelju entitlements:

```
if (user.artist_access) showArtistMenu()
if (user.designer_access) showDesignerMenu()
if (user.gallery_access) showGalleryMenu()
```

Ako korisnik klikne na zaključanu sekciju:
→ `openUpgradeModal(planNeeded)`

---

# 7) STOP CONDITION

Task je gotov kada:

✓ Korisnik može imati više modula paralelno  
✓ Artist Dashboard se NE uklanja kada korisnik kupi Designer plan  
✓ Sidebar prikazuje module prema entitlements  
✓ Backend entitlements postavljeni i rade  
✓ Stripe webhook dodjeljuje entitlements prema planovima  
✓ UI pravilno zaključava module bez pristupa  
✓ Nema više role-based prebacivanja dashboarda  

---

# 8) NOTES  
- Ne refaktorirati cijeli billing – samo dodati entitlements.  
- Ne uklanjati postojeće rute – samo zaštititi ih entitlements logikom.  
- Modulární pristup mora biti future-proof za AI module i RoomVibe Connect.  
