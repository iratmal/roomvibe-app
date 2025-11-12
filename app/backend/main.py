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
  <title>RoomVibe</title>
  <style>
    :root { --pad: 14px; --radius: 14px; }
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;max-width:980px;margin:40px auto;padding:0 16px}
    .row{display:flex;gap:16px;flex-wrap:wrap}
    .card{border:1px solid #eee;border-radius:var(--radius);padding:var(--pad)}
    .btn{background:black;color:#fff;padding:10px 16px;border-radius:12px;border:none;cursor:pointer}
    .btn.secondary{background:#f2f2f2;color:#111;border:1px solid #ddd}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    #drop{border:2px dashed #bbb;border-radius:var(--radius);padding:30px;text-align:center}
    .palette{display:flex;gap:8px;margin-top:10px}
    .sw{width:38px;height:38px;border-radius:8px;border:1px solid #ddd}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
    .art{border:1px solid #eee;border-radius:12px;padding:10px}
    .art img{width:100%;height:150px;object-fit:cover;border-radius:8px}
    .muted{color:#666}
    .input{padding:10px;border:1px solid #ddd;border-radius:10px}
    #mockupCard{display:none}
    #mockupImg{max-width:100%;border-radius:12px;border:1px solid #eee}
    .modes{display:flex;gap:8px;margin-top:10px}
    .row-slim{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    label.cb{display:flex;gap:8px;align-items:center}
  </style>
</head>
<body>
  <h1>RoomVibe</h1>
  <p class="muted">Upload your wall → AI palette → <b>Use catalog</b> or <b>Upload artwork (preview)</b> → mockup → Buy (catalog only).</p>

  <div class="row">
    <div class="card" style="flex:1 1 420px">
      <h3>1) Upload wall photo</h3>
      <div id="drop">Drag & drop image here or <input type="file" id="file" accept="image/*"></div>
      <div style="margin-top:10px">
        <label>Wall width (cm): </label>
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
        <div class="row-slim">
          <input type="file" id="artFile" accept="image/*">
          <button id="mockOwnBtn" class="btn" disabled>Show on wall</button>
        </div>
        <label class="cb" style="margin-top:8px">
          <input type="checkbox" id="rights">
          <span class="muted">I confirm I can use this image for visualization purposes.</span>
        </label>
        <p class="muted" style="margin-top:6px">Note: No buying for uploaded artwork. “Buy now” applies only to catalog items.</p>
      </div>

      <button id="suggestBtn" class="btn" style="margin-top:10px" disabled>3) Get suggestions (catalog)</button>
    </div>

    <div class="card" style="flex:1 1 420px">
      <h3>Suggestions</h3>
      <div id="grid" class="grid"></div>
    </div>
  </div>

  <div class="card" id="mockupCard" style="margin-top:16px">
    <h3>Mockup preview</h3>
    <img id="mockupImg" alt="Mockup preview"/>
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

    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.background='#fafafa'; });
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
        // MOCKUP iz kataloga (URL + ratio)
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
        by_handle = {}
        with open(path, newline="", encoding="utf-8-sig") as f:
            r = csv.DictReader(f)
            for row in r:
                handle = (_get(row, "Handle") or "").strip()
                if not handle:
                    continue
                by_handle.setdefault(handle, []).append(row)

        for handle, rows in by_handle.items():
            # Izaberi “najbolju” varijantu: s dimenzijom u nazivu, pa prva s cijenom, pa prva
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
            image_url = _pick_image(choice)
            if image_url and "cdn.shopify.com" in image_url:
                sep = "&" if "?" in image_url else "?"
                image_url = f"{image_url}{sep}width=900"

            variant_id = (_get(choice, "Variant ID") or "").strip()
            product_url = _product_url(handle, variant_id if variant_id else None)

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
