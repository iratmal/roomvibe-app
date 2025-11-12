from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, csv, re, io, time, requests
from urllib.parse import urlparse, urlencode, urlunparse, parse_qsl
from dotenv import load_dotenv
from PIL import Image
from typing import Optional

load_dotenv()

app = FastAPI(title="RoomVibe")

# ---- CORS (korisno za budući embed/widget)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------ ENV / konstante ------------
UTM_SOURCE   = os.getenv("UTM_SOURCE")   or os.getenv("utm_source")   or "roomvibe"
UTM_MEDIUM   = os.getenv("UTM_MEDIUM")   or os.getenv("utm_medium")   or "app"
UTM_CAMPAIGN = os.getenv("UTM_CAMPAIGN") or os.getenv("utm_campaign") or "default"
STORE_DOMAIN = (os.getenv("SHOPIFY_STORE_DOMAIN") or "irenart.studio").strip().strip("/")

# Static za mockup eksport
STATIC_ROOT = os.path.join(os.getcwd(), "static")
MOCK_DIR = os.path.join(STATIC_ROOT, "mockups")
os.makedirs(MOCK_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")

# Regex za dimenzije, npr. "150x100 cm" ili "150 x 100"
DIMENSION_RE = re.compile(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*cm)?', re.I)

# ------------ Helpers ------------
def _to_float(x):
    if x is None:
        return 0.0
    s = str(x).strip().replace(",", ".")
    try:
        return float(s)
    except:
        return 0.0

def _parse_ratio_from_text(txt: str) -> float:
    if not txt:
        return 1.0
    m = DIMENSION_RE.search(txt)
    if not m:
        return 1.0
    w = _to_float(m.group(1)); h = _to_float(m.group(2))
    return (w / h) if (w > 0 and h > 0) else 1.0

def _parse_ratio_from_handle(handle: str) -> float:
    if not handle:
        return 1.0
    txt = handle.replace("-", " ")
    return _parse_ratio_from_text(txt)

def _clean_title(s: str) -> str:
    return (s or "").strip().strip('"').strip("'")

def _pick_image(row):
    # Shopify CSV: preferiraj Variant Image, pa Image Src, pa Image URL
    return row.get("Variant Image") or row.get("Image Src") or row.get("Image URL") or ""

def _product_url(handle: str, variant_id: Optional[str]):
    base = f"https://{STORE_DOMAIN}/products/{handle}"
    return f"{base}?variant={variant_id}" if variant_id else base

def _find_shopify_csv():
    # traži data/shopify_products.csv ili prvi *.csv u /data (prefer 'shopify'/'product' u nazivu)
    data_dir = os.path.join(os.getcwd(), "data")
    if not os.path.isdir(data_dir):
        return None
    explicit = os.path.join(data_dir, "shopify_products.csv")
    if os.path.exists(explicit):
        return explicit
    cands = [os.path.join(data_dir, n) for n in os.listdir(data_dir) if n.lower().endswith(".csv")]
    cands.sort(key=lambda p: ("shopify" not in p.lower(), "product" not in p.lower(), len(p)))
    return cands[0] if cands else None

def _get(row, *names):
    # tolerantno čitanje headera (case-insensitive)
    for name in names:
        if name in row and row[name] not in (None, ""):
            return row[name]
    low = {k.lower(): v for k, v in row.items()}
    for name in names:
        v = low.get(name.lower())
        if v not in (None, ""):
            return v
    return ""

# --- Image picking heuristics (prefer "artwork-only", avoid mockups) ---
POS_HINTS = (
    "[raw]", "raw", "artwork-only", "artwork only", "product", "packshot",
    "flat", "scan", "unframed", "no frame", "no-frame", "no mockup",
    "print only", "canvas only"
)
NEG_HINTS = (
    "mock", "mockup", "interior", "room", "wall", "living", "bedroom",
    "kitchen", "sofa", "couch", "styled", "scene", "frame", "framed",
    "gallery wall", "home", "office"
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
    # prefer earlier positions (1 najbolji)
    try:
        p = int(position) if position not in (None, "") else 0
    except:
        p = 0
    if p > 0:
        score += max(0, 5 - min(p, 5))
    return score

def _pick_best_image_for_product(handle: str, variant_image: str, images: list[dict]) -> str:
    candidates = []
    seen = set()
    for img in images or []:
        src = img.get("src") or ""
        if not src or src in seen:
            continue
        seen.add(src)
        alt = img.get("alt") or ""
        position = img.get("position") or 0
        candidates.append((_score_image_choice(src, alt, position), src))
    if variant_image:
        # blagi bonus varijantnoj slici (često je artwork-only)
        candidates.append((_score_image_choice(variant_image, "variant", 0) + 1.5, variant_image))
    if not candidates:
        return variant_image or ""
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]

# ------------ Health ------------
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# ------ SAFE HTML PAGE (triple-single quotes da izbjegnemo """ bug) ------
HTML_PAGE = r'''
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RoomVibe — Match art to your space</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg:#0b0c10;
      --panel:#121319cc; /* glass */
      --muted:#98a2b3;
      --ring:#c8a34a;   /* zlatna */
      --accent:#e9d9a1;
      --text:#eef2f6;
      --pad:16px;
      --radius:16px;
      --shadow:0 10px 30px rgba(0,0,0,.35);
      --shadow-sm:0 4px 18px rgba(0,0,0,.25);
      --border:1px solid rgba(255,255,255,.08);
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;
      font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
      color:var(--text);
      background:
        radial-gradient(1200px 600px at 10% -10%, #1d2030 0%, transparent 60%),
        radial-gradient(1200px 600px at 120% 10%, #2b2130 0%, transparent 60%),
        linear-gradient(180deg,#0b0c10, #0d0f14 60%, #0b0c10);
      min-height:100%;
    }
    a{color:var(--accent);text-decoration:none}
    .wrap{max-width:1100px;margin:0 auto;padding:28px 18px 40px}
    header{
      display:flex;align-items:center;justify-content:space-between;gap:14px;
      padding:14px 0 6px;
    }
    .brand{display:flex;align-items:center;gap:12px}
    .logo{
      width:40px;height:40px;border-radius:12px;
      background: radial-gradient(120% 120% at 20% 10%, #f7e9bd, #c8a34a 60%, #6e551f 100%);
      box-shadow:var(--shadow-sm);
      border:var(--border);
    }
    .brand h1{
      font-family:"Playfair Display", serif;
      font-size:26px;letter-spacing:.4px;margin:0;line-height:1;
    }
    .tag{color:var(--muted);font-size:13px;margin-top:2px}
    .cta{
      display:flex;gap:10px;align-items:center;flex-wrap:wrap;
    }
    .btn{
      background:linear-gradient(180deg,#f7e9bd,#c8a34a 70%, #a1852f);
      color:#1a1a1a;border:none;border-radius:12px;padding:10px 16px;font-weight:700;cursor:pointer;
      box-shadow:var(--shadow-sm);
    }
    .btn.secondary{
      background:transparent;border:var(--border);color:var(--text)
    }
    .hero{
      margin-top:18px;
      padding:22px;
      border-radius:22px;
      border:var(--border);
      background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      box-shadow:var(--shadow);
    }
    .hero h2{margin:0 0 6px;font-size:28px}
    .hero p{margin:0;color:var(--muted)}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
    @media (max-width:900px){ .grid2{grid-template-columns:1fr} }

    .card{
      border:var(--border);border-radius:18px;padding:var(--pad);
      background:var(--panel);backdrop-filter: blur(10px);
      box-shadow:var(--shadow-sm);
    }
    .card h3{margin:0 0 10px}
    .muted{color:var(--muted)}
    .input{
      width:100%;padding:12px;border-radius:12px;border:var(--border);background:#0f1116;color:var(--text)
    }
    .drop{
      border:2px dashed rgba(255,255,255,.12);
      border-radius:14px;padding:26px;text-align:center
    }
    .palette{display:flex;gap:8px;margin-top:12px}
    .sw{width:42px;height:42px;border-radius:9px;border:1px solid rgba(255,255,255,.15)}
    .modes{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
    .art{
      border:var(--border);border-radius:14px;padding:10px;background:#0e1117;box-shadow:var(--shadow-sm);
      transition:transform .18s ease, box-shadow .18s ease;
    }
    .art:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.35)}
    .art img{width:100%;height:170px;object-fit:cover;border-radius:10px}
    .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .price{color:#e7e3d7;font-weight:700}
    .footer{
      margin-top:28px;color:var(--muted);font-size:13px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap
    }
    #mockupCard{display:none}
    #mockupImg{max-width:100%;border-radius:14px;border:var(--border);box-shadow:var(--shadow)}
    .pill{
      display:inline-flex;align-items:center;gap:8px;
      background:rgba(255,255,255,.06);
      border:var(--border);
      color:var(--accent);
      padding:6px 10px;border-radius:999px;font-size:12px
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <div class="logo" aria-hidden="true"></div>
        <div>
          <h1>RoomVibe</h1>
          <div class="tag">Match art to your space — instantly.</div>
        </div>
      </div>
      <div class="cta">
        <a class="pill" href="/api/health" target="_blank">Health · ok</a>
        <button id="suggestBtn" class="btn" disabled>Get suggestions</button>
      </div>
    </header>

    <section class="hero">
      <h2>Upload your wall, see the vibe.</h2>
      <p>AI palette → curated suggestions → 1-click buy for catalog items. Or preview your own artwork (no purchase).</p>
    </section>

    <div class="grid2">
      <div class="card">
        <h3>1) Upload wall photo</h3>
        <div id="drop" class="drop">Drag & drop image here or <input type="file" id="file" accept="image/*"></div>

        <div style="margin-top:12px">
          <label>Wall width (cm):</label>
          <input id="wallWidth" class="input" type="number" min="50" max="1000" placeholder="e.g. 300">
        </div>

        <div id="palette" class="palette"></div>
        <p id="status" class="muted"></p>

        <h3 style="margin-top:8px">2) Mode</h3>
        <div class="modes">
          <button id="modeCatalog" class="btn">Use catalog</button>
          <button id="modeUpload" class="btn secondary">Upload artwork (preview)</button>
        </div>

        <div id="uploadPane" style="display:none;margin-top:10px">
          <div class="row">
            <input type="file" id="artFile" accept="image/*" class="input" style="max-width:320px">
            <button id="mockOwnBtn" class="btn" disabled>Show on wall</button>
          </div>
          <label style="display:flex;gap:8px;align-items:center;margin-top:8px">
            <input type="checkbox" id="rights">
            <span class="muted">I confirm I can use this image for visualization purposes.</span>
          </label>
          <p class="muted" style="margin-top:6px">Note: “Buy now” is available for catalog items only.</p>
        </div>
      </div>

      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3>Suggestions</h3>
          <span class="muted" style="font-size:13px">Powered by IrenArt Studio</span>
        </div>
        <div id="grid" class="grid"></div>
      </div>
    </div>

    <div class="card" id="mockupCard" style="margin-top:16px">
      <h3>Mockup preview</h3>
      <img id="mockupImg" alt="Mockup preview"/>
    </div>

    <div class="footer">
      <div>© RoomVibe · A project by IrenArt Studio</div>
      <div><span class="muted">Tip:</span> mark “artwork-only” images in Shopify with <code>[RAW]</code> ALT text for best results.</div>
    </div>
  </div>

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

    const modeCatalogBtn = document.getElementById('modeCatalog');
    const modeUploadBtn = document.getElementById('modeUpload');
    const uploadPane = document.getElementById('uploadPane');
    const artInput = document.getElementById('artFile');
    const rights = document.getElementById('rights');
    const mockOwnBtn = document.getElementById('mockOwnBtn');

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
      statusEl.textContent = 'Palette detected ('+data.mood+').';
      showPalette(data.colors);
      suggestBtn.disabled = false;
      maybeToggleMockOwn();
    }
    function maybeToggleMockOwn(){
      mockOwnBtn.disabled = !(MODE === 'upload' && LAST_WALL_FILE && ART_FILE && rights.checked);
    }
    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.background='rgba(255,255,255,.04)'; });
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
      fd.append('scale', 0.45);
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
          <h4 style="margin:8px 0 6px">${item.title}</h4>
          <div class="row" style="justify-content:space-between">
            <span class="price">€${item.price_eur}</span>
            <div class="row" style="gap:8px">
              <button class="btn btn-mock" style="padding:8px 12px">Show on wall</button>
              <button class="btn btn-buy" style="padding:8px 12px">Buy now</button>
            </div>
          </div>
        `;
        card.querySelector('.btn-buy').addEventListener('click', async ()=>{
          const fd = new FormData();
          fd.append('product_url', item.product_url || '');
          if (item.variant_id) fd.append('variant_id', item.variant_id);
          fd.append('quantity', 1);
          const r = await fetch('/api/checkout-link', { method:'POST', body: fd });
          const {url} = await r.json();
          window.open(url, '_blank');
        });
        card.querySelector('.btn-mock').addEventListener('click', async ()=>{
          if(!LAST_WALL_FILE){ alert('Upload wall photo first.'); return; }
          const fd = new FormData();
          fd.append('wall', LAST_WALL_FILE, LAST_WALL_FILE.name);
          fd.append('artwork_url', item.image_url);
          fd.append('artwork_ratio', item.ratio);
          fd.append('scale', 0.45);
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
        # 1) Učitaj sve redove
        with open(path, newline="", encoding="utf-8-sig") as f:
            r = csv.DictReader(f)
            rows_all = list(r)

        # 2) Grupiraj varijante po Handle i skupi SVE slike po Handle
        by_handle = {}
        images_by_handle = {}
        for row in rows_all:
            handle = (_get(row, "Handle") or "").strip()
            if not handle:
                continue
            by_handle.setdefault(handle, []).append(row)

            img_src = _get(row, "Image Src", "Image URL")
            if img_src:
                images_by_handle.setdefault(handle, []).append({
                    "src": img_src,
                    "alt": _get(row, "Image Alt Text", "Alt Text"),
                    "position": _get(row, "Image Position", "Position", "#"),
                })

        # 3) Iz svake grupe: najbolja varijanta + najbolja "artwork-only" fotka
        for handle, rows in by_handle.items():
            # Varijanta: ima dimenziju u nazivu > prva s cijenom > prva
            choice = None
            for row in rows:
                vt = _get(row, "Variant Title", "variant_title")
                if DIMENSION_RE.search(vt or ""):
                    choice = row
                    break
            if choice is None:
                rows_with_price = [r for r in rows if _to_float(_get(r, "Variant Price", "Price")) > 0]
                choice = rows_with_price[0] if rows_with_price else rows[0]

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
            variant_id = (_get(choice, "Variant ID") or "").strip()
            product_url = _product_url(handle, variant_id if variant_id else None)

            # --- PAMETNI ODABIR SLIKE (izbjegni mockupove) ---
            variant_img = _get(choice, "Variant Image") or ""
            image_url = _pick_best_image_for_product(
                handle=handle,
                variant_image=variant_img,
                images=images_by_handle.get(handle, []),
            )
            if image_url and "cdn.shopify.com" in image_url:
                sep = "&" if "?" in image_url else "?"
                image_url = f"{image_url}{sep}width=900"

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
        # Fallback (ako CSV nije nađen)
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

# ------------ API: Palette (placeholder) ------------
@app.post("/api/palette")
async def extract_palette(file: UploadFile = File(...)):
    placeholder_colors = ["#D4C5B9", "#E8DDD3", "#B89A7F", "#9B8577", "#F5EDE4"]
    return {"colors": placeholder_colors, "mood": "warm_neutrals"}

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

# ------------ API: Mockup (URL ili FILE) ------------
@app.post("/api/mockup")
async def make_mockup(
    wall: UploadFile = File(...),
    artwork_url: str = Form(""),
    artwork: UploadFile = File(None),      # uploadani artwork file (preview only)
    artwork_ratio: float | None = Form(None),
    scale: float = Form(0.45),             # 0.2–0.9 širine zida
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
        try:
            art_img = Image.open(io.BytesIO(art_bytes)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid artwork file")
    elif artwork_url:
        try:
            r = requests.get(artwork_url, timeout=10)
            r.raise_for_status()
            art_img = Image.open(io.BytesIO(r.content)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Cannot fetch artwork_url")
    else:
        raise HTTPException(status_code=400, detail="Provide artwork file or artwork_url")

    # Dimenzije na zidu
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

    # Spremi u static/mockups
    fname = f"m_{int(time.time())}.jpg"
    out_path = os.path.join(MOCK_DIR, fname)
    comp.save(out_path, "JPEG", quality=88)
    url = f"/static/mockups/{fname}"
    return {"url": url, "x": x, "y": y, "w": tw, "h": th}

# ------------ Webhooks (Stripe – stub) ------------
@app.post("/webhooks/stripe")
async def stripe_webhook():
    return JSONResponse({"received": True})
