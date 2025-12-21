# RoomVibe Release Pravila — Staging-first procedure

## 1) Osnovno pravilo

**Sve promjene se rade i testiraju u `RoomVibe-staging` (staging.roomvibe.app).**
**`RoomVibe` (production / app.roomvibe.app) se ne dira** osim kad svjesno radimo release.

---

## 2) Definicije okolina

### STAGING (RoomVibe-staging)

* Svrha: razvoj, testiranje, eksperimenti, debug.
* Podaci: može imati klonirane podatke za test (po potrebi), ali **ostaje odvojena baza**.
* Stripe: **disabled** (osim kad eksplicitno testiramo sandbox, i to samo na stagingu).

### PRODUCTION (RoomVibe)

* Svrha: stabilna verzija aplikacije.
* Nema eksperimenata.
* Nema "brzih fixeva" bez staginga.

---

## 3) Pravilo grananja posla (workflow)

### 3.1 Development → Staging

1. Agent radi promjene u **RoomVibe-staging**.
2. Svaka promjena mora imati:

   * kratki opis što je mijenjano
   * gdje je mijenjano (fileovi)
   * kako testirati
   * rollback plan (barem 1 rečenica)

### 3.2 Staging smoke test

Prije bilo kakvog release-a, obavezno proći `docs/smoke-tests.md` (minimalno):

* login/logout
* osnovni studio flow
* 360 galerija: 4 pozicije kamere
* nema WebGL errora
* Stripe disabled provjera

### 3.3 Staging → Production (release)

Release u production se radi **samo kad Irena kaže: "Idemo live."**
Koraci:

1. Zabilježi "Release note" (što ide live).
2. Primijeni iste promjene u production (ili merge/copy ovisno o procesu).
3. Publish production.
4. Brzi production smoke test (kraća verzija).

---

## 4) Locked Components (ne dirati bez eksplicitnog odobrenja)

Ovo su dijelovi koji se ne mijenjaju "usput" jer su osjetljivi:

* 360 camera movement / "street view feeling" kontrole
* 360 navigation + hotspots
* FloorGuard / safe materials pipeline
* DB Guard (envGuard) i logika odvajanja baza
* Stripe enable/disable switch

Ako se bilo što od ovoga dira, mora postojati:

* jasna potreba (zašto)
* test plan
* rollback plan

---

## 5) Pravila za baze i podatke

* Staging i production moraju biti **različite baze**.
* Nikad ne spajati staging direktno na production DB.
* Ako treba isti account/podaci u stagingu → koristi se **one-time clone skripta** sa safety guardovima.
* Nakon kloniranja obavezno obrisati privremene env varove:

  * `ALLOW_PROD_TO_STAGING_CLONE`
  * `DATABASE_URL_PRODUCTION`

---

## 6) Pravila za Stripe

* Stripe ostaje **OFF** u production dok ne završimo sve ostalo.
* Na stagingu se Stripe može testirati samo u sandboxu i samo kad eksplicitno odlučimo.

---

## 7) Backup pravilo

Prije većih promjena ili release-a:

* napraviti Replit backup (Download ZIP) za:

  * RoomVibe (production)
  * RoomVibe-staging

---

## 8) Jedna rečenica koja vrijedi uvijek

**Ako nije prošlo staging + smoke test, ne ide u production.**
