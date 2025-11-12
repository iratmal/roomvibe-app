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
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>RoomVibe • Art that fits your room</title>

  <!-- Favicons -->
  <link rel="icon" type="image/png" sizes="32x32" href="/static/brand/variantB/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/static/brand/variantB/favicon-16.png">
  <link rel="apple-touch-icon" href="/static/brand/variantB/apple-touch-icon.png">

  <style>
    :root{
      --ink:#0B1020; --paper:#FAFAFA;
      --purple:#6D28D9; --purpleH:#5B21B6; --purpleA:#4C1D95; --purpleFocus:#A78BFA;
      --teal:#06B6D4; --tealH:#0891B2; --tealA:#0E7490; --tealFocus:#67E8F9;
      --promo:#DB2777;
      --radius:14px; --pad:14px; --shadow:0 10px 25px rgba(11,16,32,0.08);
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif}
    a{color:var(--teal);text-decoration:none}
    a:hover{text-decoration:underline}
    .container{max-width:1080px;margin:0 auto;padding:0 20px}

    /* NAV */
    .nav{display:flex;align-items:center;justify-content:space-between;padding:18px 0}
    .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px}
    .brand img{width:32px;height:32px;border-radius:10px}
    .nav a.link{font-size:14px;margin-left:16px;color:#445;opacity:.9}
    .nav a.link:hover{opacity:1}

    /* HERO */
    .hero{display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:center;padding:28px 0 8px}
    .h1{font-size:46px;line-height:1.05;margin:0 0 10px 0;font-weight:800;letter-spacing:-.3px}
    .sub{color:#556;max-width:56ch}
    .ctaRow{display:flex;gap:12px;margin-top:16px}
    .btn{border:none;border-radius:12px;padding:12px 16px;font-weight:600;cursor:pointer}
    .btn.primary{background:var(--purple);color:#fff}
    .btn.primary:hover{background:var(--purpleH)}
    .btn.primary:active{background:var(--purpleA)}
    .btn.secondary{background:var(--teal);color:#0B1020}
    .btn.secondary:hover{background:var(--tealH)}
    .btn.secondary:active{background:var(--tealA)}
    .badge{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #e6e8ef;color:#334;padding:8px 12px;border-radius:999px;font-size:12px}

    /* CARDS & FORMS */
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .card{background:#fff;border:1px solid #ececf2;border-radius:var(--radius);padding:var(--pad);box-shadow:var(--shadow)}
    .muted{color:#667085}
    .input{padding:10px;border:1px solid #ddd;border-radius:10px}
    #drop{border:2px dashed #cfd5e1;border-radius:var(--radius);padding:30px;text-align:center;color:#556;background:#fbfcff}
    .palette{display:flex;gap:8px;margin-top:10px}
    .sw{width:38px;height:38px;border-radius:8px;border:1px solid #e6e8ef}

    .gridCards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
    .art{border:1px solid #ececf2;border-radius:12px;padding:10px;background:#fff}
    .art img{width:100%;height:150px;object-fit:cover;border-radius:8px}

    /* MOCKUP */
    #mockupCard{display:none}
    #mockupImg{max-width:100%;border-radius:12px;border:1px solid #ececf2}

    /* FOOTER */
    footer{margin-top:40px;padding:28px 0;border-top:1px solid #ececf2;color:#667085}
    .footGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}
    .footTitle{font-weight:700;margin-bottom:8px;color:#334}

    /* GDPR cookie */
    #cookie{position:fixed;left:16px;right:16px;bottom:16px;background:#101321;color:#fff;border-radius:12px;padding:14px;display:none;z-index:9999}
    #cookie .row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    #cookie button{background:var(--teal);color:#0B1020;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
    #cookie a{color:#bfefff}
  </style>
</head>
<body>
  <nav class="container nav">
    <div class="brand">
      <img src="/static/brand/variantB/android-chrome-512x512.png" alt="RoomVibe"/>
      <span>Room<strong style="color:var(--teal)">Vibe</strong></span>
    </div>
    <div>
      <a class="link" href="/design">Design</a>
      <a class="link" href="#how">How it works</a>
      <a class="link" href="#pricing">Pricing</a>
    </div>
  </nav>

  <header class="container hero">
    <div>
      <div class="badge">✨ New — Variant B theme is live</div>
      <h1 class="h1">Art that fits your room.</h1>
      <p class="sub">Upload a wall photo, get a palette, preview artworks in place, and buy in one click. Perfect for interior lovers and gallery-level homes.</p>
      <div class="ctaRow">
        <a class="btn primary" href="#app">Try it now</a>
        <a class="btn secondary" href="#pricing">See pricing</a>
      </div>
    </div>
    <div class="card">
      <strong>Quick start</strong>
      <ol class="muted" style="margin:10px 0 0 18px;line-height:1.6">
        <li>Upload your wall photo</li>
        <li>Get color palette</li>
        <li>Preview suggestions</li>
        <li>Buy originals or prints</li>
      </ol>
    </div>
  </header>

  <main id="app" class="container" style="margin-top:10px">
    <div class="grid2">
      <div class="card">
        <h3>1) Upload wall photo</h3>
        <div id="drop">Drag & drop image here or <input type="file" id="file" accept="image/*"></div>
        <div style="margin-top:10px">
          <label>Wall width (cm): </label>
          <input id="wallWidth" class="input" type="number" min="50" max="1000" placeholder="e.g. 300">
        </div>
        <div id="palette" class="palette"></div>
        <p id="status" class="muted"></p>

        <h3 style="margin-top:8px">2) Mode</h3>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button id="modeCatalog" class="btn secondary">Use catalog</button>
          <button id="modeUpload" class="btn" style="background:#fff;border:1px solid #e6e8ef">Upload artwork (preview)</button>
        </div>

        <div id="uploadPane" style="display:none;margin-top:6px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input type="file" id="artFile" accept="image/*">
            <button id="mockOwnBtn" class="btn primary" disabled>Show on wall</button>
          </div>
          <label style="display:flex;gap:8px;align-items:center;margin-top:8px">
            <input type="checkbox" id="rights">
            <span class="muted">I confirm I can use this image for visualization purposes.</span>
          </label>
          <p class="muted" style="margin-top:6px">Note: “Buy now” applies only to catalog items.</p>
        </div>

        <button id="suggestBtn" class="btn primary" style="margin-top:10px" disabled>3) Get suggestions (catalog)</button>
      </div>

      <div class="card">
        <h3>Suggestions</h3>
        <div id="grid" class="gridCards"></div>
      </div>
    </div>

    <div class="card" id="mockupCard" style="margin-top:16px">
      <h3>Mockup preview</h3>
      <img id="mockupImg" alt="Mockup preview"/>
    </div>
  </main>

  <section id="how" class="container" style="margin-top:30px">
    <h3>How it works</h3>
    <p class="muted">AI palette detection + art matching. Swap pieces, adjust scale, export mockups for clients. When you’re ready, buy originals or prints.</p>
  </section>

  <section id="pricing" class="container" style="margin-top:20px">
    <h3>Pricing</h3>
    <p class="muted">Freemium (3 mockups/month). Pro €9/month for unlimited mockups, higher-res exports, and priority features.</p>
  </section>

  <footer class="container">
    <div class="footGrid">
      <div>
        <div class="brand" style="gap:8px">
          <img src="/static/brand/variantB/android-chrome-512x512.png" alt="RoomVibe"/>
          <div>Room<strong style="color:var(--teal)">Vibe</strong></div>
        </div>
        <p class="muted" style="margin-top:6px">© <span id="y"></span> RoomVibe. All rights reserved.</p>
      </div>
      <div>
        <div class="footTitle">Legal</div>
        <div><a href="/privacy" class="link">Privacy Policy</a></div>
        <div><a href="/terms" class="link">Terms of Service</a></div>
      </div>
      <div>
        <div class="footTitle">Contact</div>
        <div><a href="mailto:hello@roomvibe.app" class="link">hello@roomvibe.app</a></div>
        <div><a href="#how" class="link">How it works</a></div>
      </div>
    </div>
  </footer>

  <!-- GDPR Cookie -->
  <div id="cookie">
    <div class="row">
      <div>We use cookies for basic analytics and to improve your experience. <a href="/privacy">Learn more</a>.</div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button id="c-accept">Accept</button>
        <button id="c-decline" style="background:#ffffff;color:#0B1020;border:1px solid #e6e8ef">Decline</button>
      </div>
    </div>
  </div>

  <script>
    // Year
    document.getElementById('y').textContent = new Date().getFullYear();

    // Palette logic (unchanged)
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

    let MODE = 'catalog';
    let LAST_WALL_FILE = null;
    let ART_FILE = null;

    function showPalette(colors){
      paletteEl.innerHTML = '';
      colors.forEach(hex=>{
        const sw = document.createElement('div');
        sw.className='sw'; sw.title=hex; sw.style.background = hex;
        paletteEl.appendChild(sw);
      });
    }
    function updateModeUI(){
      if (MODE === 'catalog') {
        uploadPane.style.display = 'none';
        modeCatalogBtn.classList.add('secondary');
        modeUploadBtn.classList.remove('secondary');
      } else {
        uploadPane.style.display = 'block';
        modeCatalogBtn.classList.remove('secondary');
        modeUploadBtn.classList.add('secondary');
      }
    }
    function maybeToggleMockOwn(){
      mockOwnBtn.disabled = !(MODE === 'upload' && LAST_WALL_FILE && ART_FILE && rights.checked);
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
    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.background='#f6f7fb'; });
    drop.addEventListener('dragleave', e=>{ e.preventDefault(); drop.style.background='#fbfcff'; });
    drop.addEventListener('drop', e=>{
      e.preventDefault(); drop.style.background='#fbfcff';
      const f = e.dataTransfer.files?.[0]; if(f) uploadAndGetPalette(f);
    });
    fileInput.addEventListener('change', e=>{
      const f = e.target.files?.[0]; if(f) uploadAndGetPalette(f);
    });
    modeCatalogBtn.addEventListener('click', ()=>{ MODE='catalog'; updateModeUI(); maybeToggleMockOwn(); });
    modeUploadBtn.addEventListener('click', ()=>{ MODE='upload'; updateModeUI(); maybeToggleMockOwn(); });
    artInput.addEventListener('change', e=>{ ART_FILE = e.target.files?.[0] || null; maybeToggleMockOwn(); });
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
      mockEl.src = data.url; mockCard.style.display = 'block';
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
            <button class="btn" style="background:var(--purple);color:#fff">Show on wall</button>
            <button class="btn secondary">Buy now</button>
          </div>
        `;
        card.querySelectorAll('button')[0].addEventListener('click', async ()=>{
          if(!LAST_WALL_FILE){ alert('Upload wall photo first.'); return; }
          const fd = new FormData();
          fd.append('wall', LAST_WALL_FILE, LAST_WALL_FILE.name);
          fd.append('artwork_url', item.image_url);
          fd.append('artwork_ratio', item.ratio);
          fd.append('scale', 0.45);
          const r = await fetch('/api/mockup', { method:'POST', body: fd });
          if(!r.ok){ alert('Mockup error'); return; }
          const data = await r.json();
          mockEl.src = data.url; mockCard.style.display = 'block';
          window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
        });
        card.querySelectorAll('button')[1].addEventListener('click', async ()=>{
          const fd = new FormData();
          fd.append('product_url', item.product_url || '');
          if (item.variant_id) fd.append('variant_id', item.variant_id);
          fd.append('quantity', 1);
          const r = await fetch('/api/checkout-link', { method:'POST', body: fd });
          const {url} = await r.json();
          window.open(url, '_blank');
        });
        grid.appendChild(card);
      });
    });

    // GDPR banner
    const cookie = document.getElementById('cookie');
    const ok = localStorage.getItem('rv_cookie_ok');
    if(!ok){ cookie.style.display = 'block'; }
    document.getElementById('c-accept').onclick = ()=>{ localStorage.setItem('rv_cookie_ok','1'); cookie.style.display='none'; };
    document.getElementById('c-decline').onclick = ()=>{ localStorage.setItem('rv_cookie_ok','0'); cookie.style.display='none'; };
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
