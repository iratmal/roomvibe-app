from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, csv, re, io, time, requests
from urllib.parse import urlparse, urlencode, urlunparse, parse_qsl
from dotenv import load_dotenv
from PIL import Image
import numpy as np
from typing import Optional, List, Dict

load_dotenv()

app = FastAPI(title="RoomVibe")

# ---- CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ------------ ENV / konstante ------------
UTM_SOURCE   = os.getenv("UTM_SOURCE")   or os.getenv("utm_source")   or "roomvibe"
UTM_MEDIUM   = os.getenv("UTM_MEDIUM")   or os.getenv("utm_medium")   or "app"
UTM_CAMPAIGN = os.getenv("UTM_CAMPAIGN") or os.getenv("utm_campaign") or "default"
STORE_DOMAIN = (os.getenv("SHOPIFY_STORE_DOMAIN") or "irenart.studio").strip().strip("/")

MAILERLITE_API_KEY = os.getenv("MAILERLITE_API_KEY", "").strip()
MAILERLITE_GROUP_ID = os.getenv("MAILERLITE_GROUP_ID", "").strip()  # optional

# Static za mockup eksport
STATIC_ROOT = os.path.join(os.getcwd(), "static")
MOCK_DIR = os.path.join(STATIC_ROOT, "mockups")
os.makedirs(MOCK_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")

# Regex za dimenzije (npr. "150x100 cm" ili "150 x 100")
DIMENSION_RE = re.compile(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*cm)?', re.I)

# ------------ Helpers ------------
def _to_float(x):
    if x is None: return 0.0
    s = str(x).strip().replace(",", ".")
    try: return float(s)
    except: return 0.0

def _parse_ratio_from_text(txt: str) -> float:
    if not txt: return 1.0
    m = DIMENSION_RE.search(txt)
    if not m: return 1.0
    w = _to_float(m.group(1)); h = _to_float(m.group(2))
    return (w / h) if (w > 0 and h > 0) else 1.0

def _parse_ratio_from_handle(handle: str) -> float:
    if not handle: return 1.0
    txt = handle.replace("-", " ")
    return _parse_ratio_from_text(txt)

def _clean_title(s: str) -> str:
    return (s or "").strip().strip('"').strip("'")

def _get(row: Dict[str,str], *names) -> str:
    """Tolerantno čitanje headera (case-insensitive)"""
    for name in names:
        if name in row and row[name] not in (None, ""):
            return row[name]
    low = {k.lower(): v for k, v in row.items()}
    for name in names:
        v = low.get(name.lower())
        if v not in (None, ""):
            return v
    return ""

def _find_shopify_csv():
    data_dir = os.path.join(os.getcwd(), "data")
    if not os.path.isdir(data_dir): return None
    explicit = os.path.join(data_dir, "shopify_products.csv")
    if os.path.exists(explicit): return explicit
    cands = [os.path.join(data_dir, n) for n in os.listdir(data_dir) if n.lower().endswith(".csv")]
    cands.sort(key=lambda p: ("shopify" not in p.lower(), "product" not in p.lower(), len(p)))
    return cands[0] if cands else None

# --- Image picking heuristics (prefer "artwork-only", avoid mockups) ---
POS_HINTS = (
    "[raw]","raw","artwork-only","artwork only","product","packshot","flat","scan",
    "unframed","no frame","no-frame","no mockup","print only","canvas only"
)
NEG_HINTS = (
    "mock","mockup","interior","room","wall","living","bedroom","kitchen","sofa",
    "couch","styled","scene","frame","framed","gallery wall","home","office"
)

def _norm(s: str) -> str:
    return (s or "").lower()

def _score_image_choice(src: str, alt: str, position: int) -> float:
    from urllib.parse import urlparse
    import os as _os
    text = f"{_norm(alt)} {_norm(_os.path.basename(urlparse(src).path))}"
    score = 0.0
    if any(p in text for p in POS_HINTS): score += 10
    if any(n in text for n in NEG_HINTS): score -= 8
    try:
        p = int(position) if position not in (None, "") else 0
    except:
        p = 0
    if p > 0: score += max(0, 5 - min(p, 5))   # ranije pozicije blago bolje
    return score

def _pick_best_image_for_product(variant_image: str, images: List[Dict]) -> str:
    candidates = []
    seen = set()
    for img in images or []:
        src = img.get("src") or ""
        if not src or src in seen: continue
        seen.add(src)
        alt = img.get("alt") or ""
        position = img.get("position") or 0
        candidates.append((_score_image_choice(src, alt, position), src))
    if variant_image:
        candidates.append((_score_image_choice(variant_image, "variant", 0)+1.5, variant_image))
    if not candidates:
        return variant_image or ""
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]

# ------ Paleta boja (Pillow adaptive quantize) ------
def _dominant_colors_pil(img: Image.Image, k: int = 5) -> List[str]:
    # radimo na smanjenoj slici radi brzine
    base = img.copy()
    base.thumbnail((512, 512))
    pal = base.convert("P", palette=Image.ADAPTIVE, colors=k)
    palette = pal.getpalette()[:k*3]
    # frekvencije
    counts = pal.getcolors()
    if not counts:
        return ["#CCCCCC"]
    # posloži po učestalosti i vrati HEX
    idx_sorted = sorted(range(len(counts)), key=lambda i: counts[i][0], reverse=True)
    hexes = []
    for i in idx_sorted:
        r,g,b = palette[3*i:3*i+3]
        hexes.append("#{:02X}{:02X}{:02X}".format(r,g,b))
    # uniq i max k
    out = []
    for h in hexes:
        if h not in out: out.append(h)
        if len(out) >= k: break
    return out

# ------------ Health ------------
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# ------ UI (HTML) ------
HTML_PAGE = r'''
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RoomVibe — try art on your wall</title>

  <!-- minimal favicon (inline, no file needed) -->
  <link rel="icon" href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%23000"/><text x="32" y="42" font-size="30" font-family="Verdana" text-anchor="middle" fill="%23FFD95A">RV</text></svg>' />
  <meta name="theme-color" content="#000000">

  <!-- OG/Twitter (upload /static/og-cover.png kad stigneš) -->
  <meta property="og:title" content="RoomVibe — Try art on your wall" />
  <meta property="og:description" content="Upload your wall photo, get a palette, preview art, and buy in one click." />
  <meta property="og:image" content="/static/og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />

  <style>
    :root{
      --pad:14px; --radius:14px; --bg:#ffffff; --ink:#111; --muted:#666;
      --card:#fafafa; --line:#eee; --accent:#0f0f0f; --accent-ink:#fff;
    }
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;background:var(--bg);color:var(--ink);
         max-width:1080px;margin:40px auto;padding:0 18px}
    h1{font-size:clamp(24px,3vw,36px);margin:0 0 8px}
    .sub{color:var(--muted);margin:0 0 18px}
    .row{display:flex;gap:16px;flex-wrap:wrap}
    .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:var(--pad)}
    .btn{background:var(--accent);color:var(--accent-ink);padding:10px 16px;border-radius:12px;border:none;cursor:pointer}
    .btn.secondary{background:#f2f2f2;color:#111;border:1px solid #ddd}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    #drop{border:2px dashed #bbb;border-radius:var(--radius);padding:30px;text-align:center;background:#fff}
    .palette{display:flex;gap:8px;margin-top:10px}
    .sw{width:38px;height:38px;border-radius:8px;border:1px solid #ddd}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
    .art{border:1px solid #eee;border-radius:12px;padding:10px;background:#fff}
    .art img{width:100%;height:150px;object-fit:cover;border-radius:8px}
    .muted{color:var(--muted)}
    .input{padding:10px;border:1px solid #ddd;border-radius:10px;background:#fff}
    #mockupCard{display:none}
    #mockupImg{max-width:100%;border-radius:12px;border:1px solid #eee}
    .modes{display:flex;gap:8px;margin-top:10px}
    .row-slim{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    label.cb{display:flex;gap:8px;align-items:center}
    .lead{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .lead input{min-width:240px}
    .tiny{font-size:12px;color:#777;margin-top:6px}
    .hero{padding:14px 16px;border:1px dashed #ddd;border-radius:14px;background:linear-gradient(180deg,#ffffff, #f8f8f8)}
  </style>
</head>
<body>
  <div class="hero card">
    <h1>RoomVibe</h1>
    <p class="sub">Upload your wall → AI palette → <b>Use catalog</b> or <b>Upload artwork (preview)</b> → mockup → Buy (catalog only).</p>
    <div class="lead">
      <input id="leadEmail" class="input" type="email" placeholder="Your email for mockup tips & updates">
      <button id="leadBtn" class="btn">Get early access</button>
    </div>
    <label class="tiny"><input type="checkbox" id="leadConsent"> I agree to receive occasional emails from RoomVibe. I can unsubscribe anytime.</label>
    <div id="leadMsg" class="tiny"></div>
  </div>

  <div class="row" style="margin-top:16px">
    <div class="card" style="flex:1 1 460px">
      <h3>1) Upload wall photo</h3>
      <div id="drop">Drag & drop image here or <input type="file" id="file" accept="image/*"></div>

      <div style="display:flex; gap:8px; margin-top:10px; align-items:center">
        <label>Wall width (cm): </label>
        <input id="wallWidth" class="input" type="number" min="50" max="1000" placeholder="e.g. 300">
        <label style="margin-left:8px">Art width (% of wall):</label>
        <input id="artPct" class="input" type="number" min="20" max="90" value="45">
      </div>

      <div id="palette" class="palette"></div>
      <p id="status" class="muted"></p>

      <h3 style="margin-top:8px">2) Mode</h3>
      <div class="modes">
        <button id="modeCatalog" class="btn">Use catalog</button>
        <button id="modeUpload" class="btn secondary">Upload artwork (preview)</button>
      </div>

      <div id="uploadPane" style="display:none;margin-top:10px">
        <div class="row-slim">
          <input type="file" id="artFile" accept="image/*">
          <button id="mockOwnBtn" class="btn" disabled>Show on wall</button>
        </div>
        <label class="cb" style="margin-top:8px">
          <input type="checkbox" id="rights">
          <span class="muted">I confirm I can use this image for visualization purposes.</span>
        </label>
        <p class="muted" style="margin-top:6px">Note: Buying is available only for catalog items.</p>
      </div>

      <button id="suggestBtn" class="btn" style="margin-top:10px" disabled>3) Get suggestions (catalog)</button>
    </div>

    <div class="card" style="flex:1 1 460px">
      <h3>Suggestions</h3>
      <div id="grid" class="grid"></div>
    </div>
  </div>

  <div class="card" id="mockupCard" style="margin-top:16px">
    <h3>Mockup preview</h3>
    <img id="mockupImg" alt="Mockup preview"/>
    <p class="tiny">This is a visualization. Actual color/scale depends on wall lighting & camera perspective.</p>
  </div>

  <p style="margin-top:24px"><a class="btn" href="/api/health" target="_blank">Health check</a></p>

  <script>
    let MODE = 'catalog';
    let LAST_WALL_FILE = null;
    let ART_FILE = null;

    const fileInput = document.getElementById('file');
    const drop = document.getElementById('drop');
    const paletteEl = document.getElementById('palette');
    const statusEl = document.getElementById('status');
    const suggestBtn = document.getElementById('suggestBtn');
    const grid = document.getElementById('grid');
    const mockEl = document.getElementById('mockupImg');
    const mockCard = document.getElementById('mockupCard');
    const wallWidth = document.getElementById('wallWidth');
    const artPct = document.getElementById('artPct');

    const modeCatalogBtn = document.getElementById('modeCatalog');
    const modeUploadBtn = document.getElementById('modeUpload');
    const uploadPane = document.getElementById('uploadPane');
    const artInput = document.getElementById('artFile');
    const rights = document.getElementById('rights');
    const mockOwnBtn = document.getElementById('mockOwnBtn');

    const leadEmail = document.getElementById('leadEmail');
    const leadBtn = document.getElementById('leadBtn');
    const leadConsent = document.getElementById('leadConsent');
    const leadMsg = document.getElementById('leadMsg');

    // Lead capture (MailerLite)
    leadBtn.addEventListener('click', async ()=>{
      leadMsg.textContent = '';
      const email = (leadEmail.value||'').trim();
      if(!email){ leadMsg.textContent = 'Please enter your email.'; return; }
      if(!leadConsent.checked){ leadMsg.textContent = 'Please confirm email consent.'; return; }
      const res = await fetch('/api/lead', {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({ email, consent: 'true', source: 'roomvibe_app' })
      });
      if(res.ok){ leadMsg.textContent = 'Thanks! Check your inbox soon.'; leadEmail.value=''; leadConsent.checked=false; }
      else { const t = await res.text(); leadMsg.textContent = 'Error: '+t; }
    });

    function showPalette(colors){
      paletteEl.innerHTML = '';
      colors.forEach(hex=>{
        const sw = document.createElement('div');
        sw.className='sw';
        sw.title=hex;
        sw.style.background = hex;
        paletteEl.appendChild(sw);
      });
    }

    function updateModeUI(){
      if (MODE === 'catalog') {
        uploadPane.style.display = 'none';
        modeCatalogBtn.classList.remove('secondary');
        modeUploadBtn.classList.add('secondary');
      } else {
        uploadPane.style.display = 'block';
        modeCatalogBtn.classList.add('secondary');
        modeUploadBtn.classList.remove('secondary');
      }
    }

    async function uploadAndGetPalette(file){
      statusEl.textContent = 'Uploading…';
      LAST_WALL_FILE = file;
      const fd = new FormData();
      fd.append('file', file, file.name);
      const res = await fetch('/api/palette', { method:'POST', body: fd });
      if(!res.ok){ statusEl.textContent = 'Palette error.'; return; }
      const data = await res.json();
      statusEl.textContent = 'Palette detected.';
      showPalette(data.colors);
      suggestBtn.disabled = false;
      maybeToggleMockOwn();
    }

    function maybeToggleMockOwn(){
      mockOwnBtn.disabled = !(MODE === 'upload' && LAST_WALL_FILE && ART_FILE && rights.checked);
    }

    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.background='#fdfdfd'; });
    drop.addEventListener('dragleave', e=>{ e.preventDefault(); drop.style.background=''; });
    drop.addEventListener('drop', e=>{
      e.preventDefault(); drop.style.background='';
      const f = e.dataTransfer.files?.[0]; if(f) uploadAndGetPalette(f);
    });
    fileInput.addEventListener('change', e=>{
      const f = e.target.files?.[0]; if(f) uploadAndGetPalette(f);
    });

    modeCatalogBtn.addEventListener('click', ()=>{ MODE='catalog'; updateModeUI(); maybeToggleMockOwn(); });
    modeUploadBtn.addEventListener('click', ()=>{ MODE='upload'; updateModeUI(); maybeToggleMockOwn(); });

    artInput.addEventListener('change', e=>{
      ART_FILE = e.target.files?.[0] || null;
      maybeToggleMockOwn();
    });

    rights.addEventListener('change', maybeToggleMockOwn);

    mockOwnBtn.addEventListener('click', async ()=>{
      if (!LAST_WALL_FILE) { alert('Upload wall photo first.'); return; }
      if (!ART_FILE) { alert('Upload an artwork image.'); return; }
      if (!rights.checked) { alert('Please confirm usage rights.'); return; }
      const fd = new FormData();
      fd.append('wall', LAST_WALL_FILE, LAST_WALL_FILE.name);
      fd.append('artwork', ART_FILE, ART_FILE.name);
      fd.append('scale', (parseFloat(artPct.value||'45')/100).toString());
      const wcm = wallWidth.value ? String(wallWidth.value) : '';
      if (wcm) fd.append('wall_width_cm', wcm);
      const r = await fetch('/api/mockup', { method:'POST', body: fd });
      if(!r.ok){ alert('Mockup error'); return; }
      const data = await r.json();
      mockEl.src = data.url;
      mockCard.style.display = 'block';
      window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
    });

    suggestBtn.addEventListener('click', async ()=>{
      grid.innerHTML = '<p class="muted">Loading…</p>';
      const res = await fetch('/api/artworks');
      const {items} = await res.json();
      grid.innerHTML = '';
      items.forEach(item=>{
        const card = document.createElement('div');
        card.className='art';
        card.innerHTML = `
          <img src="${item.image_url}" alt="">
          <h4>${item.title}</h4>
          <p class="muted">€${item.price_eur}</p>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn btn-mock">Show on wall</button>
            <button class="btn btn-buy">Buy now</button>
          </div>
        `;
        // BUY NOW (direct-to-checkout ako imamo variant_id)
        card.querySelector('.btn-buy').addEventListener('click', async ()=>{
          const fd = new FormData();
          fd.append('product_url', item.product_url || '');
          if (item.variant_id) fd.append('variant_id', item.variant_id);
          fd.append('quantity', 1);
          const r = await fetch('/api/checkout-link', { method:'POST', body: fd });
          const {url} = await r.json();
          window.open(url, '_blank');
        });
        // MOCKUP iz kataloga
        card.querySelector('.btn-mock').addEventListener('click', async ()=>{
          if(!LAST_WALL_FILE){ alert('Upload wall photo first.'); return; }
          const fd = new FormData();
          fd.append('wall', LAST_WALL_FILE, LAST_WALL_FILE.name);
          fd.append('artwork_url', item.image_url);
          fd.append('artwork_ratio', item.ratio);
          fd.append('scale', (parseFloat(artPct.value||'45')/100).toString());
          const wcm = wallWidth.value ? String(wallWidth.value) : '';
          if (wcm) fd.append('wall_width_cm', wcm);
          const r = await fetch('/api/mockup', { method:'POST', body: fd });
          if(!r.ok){ alert('Mockup error'); return; }
          const data = await r.json();
          mockEl.src = data.url;
          mockCard.style.display = 'block';
          window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
        });
        grid.appendChild(card);
      });
    });

    // init
    updateModeUI();
  </script>
</body>
</html>
'''

@app.get("/", response_class=HTMLResponse)
def root():
    return HTMLResponse(content=HTML_PAGE)

# ------------ API: ARTWORKS (Shopify CSV) ------------
@app.get("/api/artworks")
async def get_artworks(limit: int = 30):
    path = _find_shopify_csv()
    items = []

    if path and os.path.exists(path):
        by_handle: Dict[str, List[Dict[str,str]]] = {}
        with open(path, newline="", encoding="utf-8-sig") as f:
            r = csv.DictReader(f)
            for row in r:
                handle = (_get(row, "Handle") or "").strip()
                if not handle: continue
                by_handle.setdefault(handle, []).append(row)

        for handle, rows in by_handle.items():
            # 1) izaberi varijantu (prior: ima dimenzije u nazivu → ima cijenu → prva)
            choice = None
            for row in rows:
                vt = _get(row, "Variant Title", "variant_title")
                if DIMENSION_RE.search(vt or ""):
                    choice = row; break
            if choice is None:
                priced = [r for r in rows if _to_float(_get(r,"Variant Price","Price")) > 0]
                choice = priced[0] if priced else rows[0]

            title_raw = (_get(choice, "Title") or "").strip()
            variant_title = (_get(choice, "Variant Title") or "").strip()
            title = _clean_title(title_raw)

            ratio = (
                _parse_ratio_from_text(variant_title)
                or _parse_ratio_from_text(title)
                or _parse_ratio_from_handle(handle)
                or 1.0
            )
            price = _to_float(_get(choice, "Variant Price", "Price"))

            # 2) skupi sve product-level slike (iz svih redova istog handle-a)
            images = []
            for row in rows:
                src = _get(row, "Image Src","Image URL")
                if src:
                    images.append({
                        "src": src,
                        "alt": _get(row, "Image Alt Text"),
                        "position": _get(row, "Image Position") or _get(row, "Image Position", "position") or 0
                    })
            variant_image = _get(choice, "Variant Image")
            image_url = _pick_best_image_for_product(variant_image, images)

            if image_url and "cdn.shopify.com" in image_url:
                sep = "&" if "?" in image_url else "?"
                image_url = f"{image_url}{sep}width=900"

            variant_id = (_get(choice, "Variant ID") or "").strip()
            base = f"https://{STORE_DOMAIN}/products/{handle}"
            product_url = f"{base}?variant={variant_id}" if variant_id else base

            display_title = title
            if variant_title and variant_title.lower() != "default title":
                display_title = f"{title} — {variant_title}"

            items.append({
                "id": f"{handle}-{variant_id}" if variant_id else handle,
                "title": display_title,
                "image_url": image_url,
                "ratio": ratio,
                "price_eur": price,
                "product_url": product_url,
                "variant_id": variant_id
            })
    else:
        # Fallback
        items = [
            {"id":"a1","title":"Good Vibes #12","ratio":1.43,"price_eur":950.0,
             "product_url":"https://irenart.studio/products/gv-12",
             "image_url":"https://via.placeholder.com/800x560?text=Good+Vibes+%2312"},
            {"id":"a2","title":"Energy in Motion #3","ratio":1.5,"price_eur":1600.0,
             "product_url":"https://irenart.studio/products/eim-3",
             "image_url":"https://via.placeholder.com/900x600?text=Energy+in+Motion+%233"},
            {"id":"a3","title":"Soft Neutrals #5","ratio":1.0,"price_eur":650.0,
             "product_url":"https://irenart.studio/products/sn-5",
             "image_url":"https://via.placeholder.com/700x700?text=Soft+Neutrals+%235"},
        ]

    limit = max(1, min(int(limit), 60))
    return {"items": items[:limit]}

# ------------ API: Palette (now real extraction) ------------
@app.post("/api/palette")
async def extract_palette(file: UploadFile = File(...)):
    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")
    colors = _dominant_colors_pil(img, k=5)
    return {"colors": colors, "mood": "auto"}

# ------------ API: Checkout link s UTM / direct-to-checkout ------------
@app.post("/api/checkout-link")
async def create_checkout_link(
    product_url: str = Form(""),
    variant_id: Optional[str] = Form(None),
    quantity: int = Form(1),
    discount: Optional[str] = Form(None),
):
    if variant_id:
        base = f"https://{STORE_DOMAIN}/cart/{variant_id}:{max(1, int(quantity))}"
    else:
        base = product_url or f"https://{STORE_DOMAIN}"

    u = urlparse(base)
    query = dict(parse_qsl(u.query)) if u.query else {}
    query.update({
        "utm_source": UTM_SOURCE,
        "utm_medium": UTM_MEDIUM,
        "utm_campaign": UTM_CAMPAIGN,
    })
    if discount:
        query["discount"] = discount

    new_query = urlencode(query)
    new_url = urlunparse((u.scheme or "https", u.netloc, u.path, u.params, new_query, u.fragment))
    return {"url": new_url}

# ------------ API: Mockup (real-scale aware) ------------
@app.post("/api/mockup")
async def make_mockup(
    wall: UploadFile = File(...),
    artwork_url: str = Form(""),
    artwork: UploadFile = File(None),
    artwork_ratio: float | None = Form(None),
    scale: float = Form(0.45),             # 0.2–0.9 širine zida
    wall_width_cm: float | None = Form(None),  # opcionalno
):
    # Zid
    wall_bytes = await wall.read()
    try:
        wall_img = Image.open(io.BytesIO(wall_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid wall image")
    ww, wh = wall_img.size

    # Artwork (file > url)
    if artwork is not None:
        art_bytes = await artwork.read()
        try: art_img = Image.open(io.BytesIO(art_bytes)).convert("RGB")
        except Exception: raise HTTPException(status_code=400, detail="Invalid artwork file")
    elif artwork_url:
        try:
            r = requests.get(artwork_url, timeout=10)
            r.raise_for_status()
            art_img = Image.open(io.BytesIO(r.content)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Cannot fetch artwork_url")
    else:
        raise HTTPException(status_code=400, detail="Provide artwork file or artwork_url")

    # Dimenzije na zidu: ako imamo wall_width_cm, onda prikaz ~ scale * wall_width_cm
    # tj. tv_px = ww * (scale)   (gdje je scale postotak zida), ali sad i "real-scale" pripada cm inputu
    tw = max(1, int(ww * max(0.2, min(float(scale), 0.9))))
    if artwork_ratio and float(artwork_ratio) > 0:
        th = int(tw / float(artwork_ratio))
    else:
        arw, arh = art_img.size
        aspect = arw / arh if arh else 1.0
        th = int(tw / aspect)

    art_resized = art_img.resize((tw, th))
    # Pozicija (gornja sredina)
    x = (ww - tw) // 2
    y = int(wh * 0.35)
    y = max(0, min(y, wh - th))

    comp = wall_img.copy()
    comp.paste(art_resized, (x, y))
    fname = f"m_{int(time.time())}.jpg"
    out_path = os.path.join(MOCK_DIR, fname)
    comp.save(out_path, "JPEG", quality=88)
    url = f"/static/mockups/{fname}"
    return {"url": url, "x": x, "y": y, "w": tw, "h": th, "wall_px": ww, "wall_width_cm": wall_width_cm}

# ------------ API: Lead capture (MailerLite) ------------
@app.post("/api/lead")
async def lead_capture(email: str = Form(...), consent: str = Form("false"), source: str = Form("roomvibe_app")):
    if not MAILERLITE_API_KEY:
        raise HTTPException(status_code=500, detail="MailerLite key not configured")
    payload = {
        "email": email,
        "fields": {"source": source}
    }
    if MAILERLITE_GROUP_ID:
        payload["groups"] = [MAILERLITE_GROUP_ID]

    try:
        res = requests.post(
            "https://connect.mailerlite.com/api/subscribers",
            json=payload,
            headers={
                "Authorization": f"Bearer {MAILERLITE_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=10
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"MailerLite error: {e}")

    if res.status_code not in (200, 201):
        raise HTTPException(status_code=res.status_code, detail=res.text)
    return JSONResponse({"ok": True})

# ------------ Webhooks (Stripe – stub) ------------
@app.post("/webhooks/stripe")
async def stripe_webhook():
    return JSONResponse({"received": True})
