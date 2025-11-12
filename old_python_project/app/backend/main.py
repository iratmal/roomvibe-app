from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import os, csv, re, io, time, requests
from urllib.parse import urlparse, urlencode, urlunparse, parse_qsl
from dotenv import load_dotenv
from PIL import Image
from typing import Optional, List, Dict

load_dotenv()
app = FastAPI(title="RoomVibe")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ENV / constants
UTM_SOURCE   = os.getenv("UTM_SOURCE")   or "roomvibe"
UTM_MEDIUM   = os.getenv("UTM_MEDIUM")   or "app"
UTM_CAMPAIGN = os.getenv("UTM_CAMPAIGN") or "default"
STORE_DOMAIN = (os.getenv("SHOPIFY_STORE_DOMAIN") or "irenart.studio").strip().strip("/")

MAILERLITE_API_KEY  = (os.getenv("MAILERLITE_API_KEY") or "").strip()
MAILERLITE_GROUP_ID = (os.getenv("MAILERLITE_GROUP_ID") or "").strip()

# Static & Templates
STATIC_ROOT = os.path.join(os.getcwd(), "static")
TEMPLATES_DIR = os.path.join(STATIC_ROOT, "templates")
MOCK_DIR = os.path.join(STATIC_ROOT, "mockups")
os.makedirs(MOCK_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Regex for sizes
DIMENSION_RE = re.compile(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*cm)?', re.I)

# ---------- Helpers ----------
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
    return _parse_ratio_from_text(handle.replace("-", " "))

def _clean_title(s: str) -> str:
    return (s or "").strip().strip('"').strip("'")

def _get(row: Dict[str,str], *names) -> str:
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

# image choice heuristics
POS_HINTS = ("[raw]","raw","artwork-only","artwork only","product","packshot","flat","scan",
             "unframed","no frame","no-frame","no mockup","print only","canvas only")
NEG_HINTS = ("mock","mockup","interior","room","wall","living","bedroom","kitchen","sofa",
             "couch","styled","scene","frame","framed","gallery wall","home","office")

def _norm(s: str) -> str: return (s or "").lower()

def _score_image_choice(src: str, alt: str, position: int) -> float:
    from urllib.parse import urlparse
    import os as _os
    text = f"{_norm(alt)} {_norm(_os.path.basename(urlparse(src).path))}"
    score = 0.0
    if any(p in text for p in POS_HINTS): score += 10
    if any(n in text for n in NEG_HINTS): score -= 8
    try: p = int(position) if position not in (None, "") else 0
    except: p = 0
    if p > 0: score += max(0, 5 - min(p, 5))
    return score

def _pick_best_image_for_product(variant_image: str, images: List[Dict]) -> str:
    candidates, seen = [], set()
    for img in images or []:
        src = img.get("src") or ""
        if not src or src in seen: continue
        seen.add(src)
        candidates.append((_score_image_choice(src, img.get("alt") or "", img.get("position") or 0), src))
    if variant_image:
        candidates.append((_score_image_choice(variant_image, "variant", 0)+1.5, variant_image))
    if not candidates: return variant_image or ""
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]

# palette
def _dominant_colors_pil(img: Image.Image, k: int = 5) -> List[str]:
    base = img.copy(); base.thumbnail((512, 512))
    pal = base.convert("P", palette=Image.ADAPTIVE, colors=k)
    palette = pal.getpalette()[:k*3]
    counts = pal.getcolors() or []
    if not counts: return ["#CCCCCC"]
    idx_sorted = sorted(range(len(counts)), key=lambda i: counts[i][0], reverse=True)
    out = []
    for i in idx_sorted:
        r,g,b = palette[3*i:3*i+3]
        hexv = f"#{r:02X}{g:02X}{b:02X}"
        if hexv not in out: out.append(hexv)
        if len(out) >= k: break
    return out

# ---------- Health ----------
@app.get("/api/health")
async def health(): return {"status": "ok"}

# ---------- UI ----------
HTML_PAGE = r'''
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>RoomVibe — Art that fits your room</title>
<link rel="icon" href="/static/brand/variantB/favicon-32.png">
<style>
  :root{
    /* Midnight (default) */
    --bg:#0B1020; --text:#E9EDF5; --muted:#A3ADC2; --line:rgba(255,255,255,.08);
    --panel:rgba(255,255,255,.04); --card:#0F172A;
    --accent:#22D3EE; --accent-2:#F4D24B;
    --radius:16px; --pad:16px; --shadow:0 20px 60px rgba(0,0,0,.35);
  }
  [data-theme="sky"]{
    --bg:#EAF4FF; --text:#0B1020; --muted:#5B6B8A; --line:#DFE7F4;
    --panel:#FFFFFF; --card:#FFFFFF;
    --accent:#06B6D4; --accent-2:#F59E0B;
    --shadow:0 20px 50px rgba(11,16,32,.08);
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}
  a{color:var(--accent);text-decoration:none} a:hover{text-decoration:underline}
  .container{max-width:1200px;margin:0 auto;padding:0 20px}
  /* Nav */
  .nav{display:flex;align-items:center;justify-content:space-between;padding:18px 0}
  .brand{font-weight:900;letter-spacing:.2px}
  .brand b{background:linear-gradient(90deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
  .navlinks a{margin-left:20px;color:var(--muted)}
  .navlinks a:hover{color:var(--text)}
  .theme{border:1px solid var(--line);background:var(--panel);color:var(--text);padding:8px 12px;border-radius:999px;cursor:pointer}
  /* Hero */
  .hero{display:grid;grid-template-columns:1.1fr .9fr;gap:28px;align-items:center;padding:32px 0}
  .title{font-size:64px;line-height:1.02;margin:0 0 10px 0;font-weight:900;letter-spacing:-.6px}
  .subtitle{color:var(--muted);max-width:65ch}
  .cta{display:flex;gap:12px;margin-top:18px}
  .btn{border:none;border-radius:12px;padding:12px 18px;font-weight:800;cursor:pointer}
  .btn.primary{background:var(--accent);color:#0B1020}
  .btn.secondary{background:var(--panel);color:var(--text);border:1px solid var(--line)}
  .heroCard{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:var(--pad);box-shadow:var(--shadow)}
  /* App section */
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:var(--pad);box-shadow:var(--shadow)}
  .muted{color:var(--muted)}
  .input{width:100%;padding:12px;border:1px solid var(--line);border-radius:12px;background:transparent;color:var(--text)}
  #drop{border:1.5px dashed var(--line);border-radius:var(--radius);padding:28px;text-align:center;color:var(--muted)}
  .palette{display:flex;gap:8px;margin-top:10px}
  .sw{width:36px;height:36px;border-radius:8px;border:1px solid var(--line)}
  .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  /* Suggestions */
  .gridCards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
  .art{position:relative;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px}
  .art img{width:100%;height:160px;object-fit:cover;border-radius:10px}
  .price{position:absolute;top:12px;right:12px;background:rgba(0,0,0,.55);color:#fff;border-radius:10px;padding:6px 10px;font-weight:800;border:1px solid rgba(255,255,255,.2)}
  [data-theme="sky"] .price{background:#0B1020;color:#fff}
  .btnRow{display:flex;gap:8px;margin-top:10px}
  /* Testimonials */
  .tGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
  .t{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow)}
  .tHead{display:flex;gap:12px;align-items:center;margin-bottom:8px}
  .tHead img{width:44px;height:44px;border-radius:999px;object-fit:cover;border:1px solid var(--line)}
  /* Footer */
  footer{margin-top:48px;padding:32px 0;border-top:1px solid var(--line);color:var(--muted)}
  .footGrid{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:18px}
  .footTitle{font-weight:900;margin-bottom:8px;color:var(--text)}
  .newsletter{display:flex;gap:8px}
  .newsletter input{flex:1}
  /* Cookie */
  #cookie{position:fixed;left:16px;right:16px;bottom:16px;background:#101321;color:#fff;border-radius:12px;padding:14px;display:none;z-index:9999}
  #cookie .row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  #cookie button{background:var(--accent);color:#0B1020;border:none;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}
  #cookie a{color:#bfefff}
  @media (max-width: 980px){ .hero{grid-template-columns:1fr} .grid2{grid-template-columns:1fr} .footGrid{grid-template-columns:1fr 1fr} }
</style>
</head>
<body>
  <div id="root" data-theme="midnight">
    <nav class="container nav">
      <div class="brand">Room<b>Vibe</b></div>
      <div class="navlinks">
        <a href="#how">How it works</a>
        <a href="#testimonials">Testimonials</a>
        <a href="#pricing">Pricing</a>
        <button id="theme" class="theme" title="Toggle theme">🌙 Midnight</button>
      </div>
    </nav>

    <header class="container hero">
      <div>
        <h1 class="title">Art that fits your room.</h1>
        <p class="subtitle">Upload a wall photo, get a palette, preview artworks in place, and buy in one click. Made for interior lovers and gallery-level homes.</p>
        <div class="cta">
          <a class="btn primary" href="#app">Try it now</a>
          <a class="btn secondary" href="#pricing">See pricing</a>
        </div>
      </div>
      <div class="heroCard">
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

          <div class="row" style="margin-top:12px">
            <div style="flex:1">
              <label class="muted">Wall width (cm)</label>
              <input id="wallWidth" class="input" type="number" min="50" max="1000" placeholder="e.g. 300">
            </div>
            <div style="width:180px">
              <label class="muted">Max price (€)</label>
              <input id="maxPrice" class="input" type="number" min="0" step="50" placeholder="No limit">
            </div>
          </div>

          <div id="palette" class="palette"></div>
          <p id="status" class="muted"></p>

          <h3 style="margin-top:8px">2) Mode</h3>
          <div class="row">
            <button id="modeCatalog" class="btn secondary">Use catalog</button>
            <button id="modeUpload" class="btn">Upload artwork (preview)</button>
          </div>

          <div id="uploadPane" style="display:none;margin-top:6px">
            <div class="row">
              <input type="file" id="artFile" accept="image/*" class="input" style="padding:10px">
              <button id="mockOwnBtn" class="btn primary" disabled>Show on wall</button>
            </div>
            <label class="row" style="margin-top:8px;color:var(--muted)">
              <input type="checkbox" id="rights">
              <span>I confirm I can use this image for visualization purposes.</span>
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

      <div class="card" id="mockupCard" style="margin-top:16px;display:none">
        <h3>Mockup preview</h3>
        <img id="mockupImg" alt="Mockup preview" style="max-width:100%;border-radius:12px;border:1px solid var(--line)"/>
      </div>
    </main>

    <section id="how" class="container" style="margin-top:28px">
      <h3>How it works</h3>
      <p class="muted">AI palette detection + art matching. Swap pieces, adjust scale, export mockups for clients. When you’re ready, buy originals or prints.</p>
    </section>

    <section id="testimonials" class="container" style="margin-top:28px">
      <h3>What collectors say</h3>
      <div class="tGrid">
        <div class="t">
          <div class="tHead">
            <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=200&auto=format&fit=crop" alt="">
            <div><strong>Martin K.</strong><div class="muted" style="font-size:12px">Interior designer</div></div>
          </div>
          <div>“RoomVibe helped my client decide in minutes. The on-wall preview feels real.”</div>
        </div>
        <div class="t">
          <div class="tHead">
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" alt="">
            <div><strong>Elena P.</strong><div class="muted" style="font-size:12px">Home owner</div></div>
          </div>
          <div>“Loved the palette suggestions — found a piece that perfectly matches my living room.”</div>
        </div>
        <div class="t">
          <div class="tHead">
            <img src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop" alt="">
            <div><strong>Marco D.</strong><div class="muted" style="font-size:12px">Collector</div></div>
          </div>
          <div>“One-click checkout is smooth. This will boost conversion for any art shop.”</div>
        </div>
      </div>
    </section>

    <section id="pricing" class="container" style="margin-top:28px">
      <h3>Pricing</h3>
      <div class="grid2">
        <div class="card">
          <h4>Free</h4>
          <p class="muted">3 mockups / month</p>
          <ul class="muted">
            <li>Palette detection</li><li>Catalog mockups</li><li>Basic export</li>
          </ul>
          <a class="btn secondary" href="#app">Start free</a>
        </div>
        <div class="card">
          <h4>Pro <span style="background:var(--accent);color:#0B1020;padding:4px 8px;border-radius:8px;margin-left:6px;font-size:12px">€9/mo</span></h4>
          <p class="muted">Unlimited mockups</p>
          <ul class="muted">
            <li>Higher-res exports</li><li>Priority features</li><li>Email support</li>
          </ul>
          <a class="btn primary" href="#app">Go Pro</a>
        </div>
      </div>
    </section>

    <footer class="container">
      <div class="footGrid">
        <div>
          <div class="brand">Room<b>Vibe</b></div>
          <p class="muted" style="margin-top:6px">© <span id="y"></span> RoomVibe. All rights reserved.</p>
        </div>
        <div>
          <div class="footTitle">Product</div>
          <div><a href="#how">How it works</a></div>
          <div><a href="#pricing">Pricing</a></div>
        </div>
        <div>
          <div class="footTitle">Legal</div>
          <div><a href="/privacy">Privacy Policy</a></div>
          <div><a href="/terms">Terms of Service</a></div>
        </div>
        <div>
          <div class="footTitle">Newsletter</div>
          <form id="nl" class="newsletter">
            <input id="nlEmail" class="input" type="email" placeholder="you@example.com" required>
            <button class="btn primary" type="submit">Join</button>
          </form>
          <div id="nlMsg" class="muted" style="margin-top:6px"></div>
          <div style="margin-top:8px"><a href="mailto:hello@roomvibe.app">hello@roomvibe.app</a></div>
        </div>
      </div>
    </footer>

    <!-- Cookie -->
    <div id="cookie">
      <div class="row">
        <div>We use cookies for basic analytics and to improve your experience. <a href="/privacy">Learn more</a>.</div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button id="c-accept">Accept</button>
          <button id="c-decline" style="background:#ffffff;color:#0B1020;border:1px solid #e6e8ef">Decline</button>
        </div>
      </div>
    </div>
  </div>

<script>
  // Year
  document.getElementById('y').textContent = new Date().getFullYear();

  // Theme toggle
  const rootEl = document.getElementById('root');
  const themeBtn = document.getElementById('theme');
  const savedTheme = localStorage.getItem('rv_theme');
  if(savedTheme){ rootEl.setAttribute('data-theme', savedTheme); themeBtn.textContent = savedTheme==='sky' ? '☀️ Sky' : '🌙 Midnight'; }
  themeBtn.addEventListener('click', ()=>{
    const next = rootEl.getAttribute('data-theme')==='sky' ? 'midnight' : 'sky';
    rootEl.setAttribute('data-theme', next);
    themeBtn.textContent = next==='sky' ? '☀️ Sky' : '🌙 Midnight';
    localStorage.setItem('rv_theme', next);
  });

  // App elements
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
  const maxPriceInput = document.getElementById('maxPrice');

  let MODE = 'catalog', LAST_WALL_FILE = null, ART_FILE = null, ALL_ITEMS = [];

  function showPalette(colors){
    paletteEl.innerHTML = '';
    (colors||[]).forEach(hex=>{
      const sw = document.createElement('div');
      sw.className='sw'; sw.title=hex; sw.style.background = hex; paletteEl.appendChild(sw);
    });
  }
  function updateModeUI(){
    if (MODE === 'catalog'){ uploadPane.style.display = 'none'; }
    else { uploadPane.style.display = 'block'; }
  }
  function maybeToggleMockOwn(){
    mockOwnBtn.disabled = !(MODE === 'upload' && LAST_WALL_FILE && ART_FILE && rights.checked);
  }
  async function uploadAndGetPalette(file){
    statusEl.textContent = 'Uploading…'; LAST_WALL_FILE = file;
    const fd = new FormData(); fd.append('file', file, file.name);
    const res = await fetch('/api/palette', { method:'POST', body: fd });
    if(!res.ok){ statusEl.textContent = 'Palette error.'; return; }
    const data = await res.json();
    statusEl.textContent = 'Palette detected ('+(data.mood||'auto')+').';
    showPalette(data.colors); suggestBtn.disabled = false; maybeToggleMockOwn();
  }

  // DnD
  drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.opacity='0.85'; });
  drop.addEventListener('dragleave', e=>{ e.preventDefault(); drop.style.opacity='1'; });
  drop.addEventListener('drop', e=>{
    e.preventDefault(); drop.style.opacity='1';
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if(f) uploadAndGetPalette(f);
  });
  fileInput.addEventListener('change', e=>{
    const f = e.target.files && e.target.files[0]; if(f) uploadAndGetPalette(f);
  });

  // Mode
  modeCatalogBtn.addEventListener('click', ()=>{ MODE='catalog'; updateModeUI(); maybeToggleMockOwn(); });
  modeUploadBtn.addEventListener('click', ()=>{ MODE='upload'; updateModeUI(); maybeToggleMockOwn(); });

  // Upload artwork preview
  artInput.addEventListener('change', e=>{ ART_FILE = (e.target.files && e.target.files[0]) || null; maybeToggleMockOwn(); });
  rights.addEventListener('change', maybeToggleMockOwn);
  mockOwnBtn.addEventListener('click', async ()=>{
    if (!LAST_WALL_FILE) return alert('Upload wall photo first.');
    if (!ART_FILE) return alert('Upload an artwork image.');
    if (!rights.checked) return alert('Please confirm usage rights.');
    const fd = new FormData();
    fd.append('wall', LAST_WALL_FILE, LAST_WALL_FILE.name);
    fd.append('artwork', ART_FILE, ART_FILE.name);
    fd.append('scale', '0.45');
    const r = await fetch('/api/mockup', { method:'POST', body: fd });
    if(!r.ok) return alert('Mockup error');
    const data = await r.json();
    mockEl.src = data.url; mockCard.style.display = 'block';
    window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
  });

  // Suggestions + price filter
  function renderItems(items){
    grid.innerHTML = '';
    items.forEach(item=>{
      const card = document.createElement('div');
      card.className='art';
      card.innerHTML = `
        <span class="price">€${item.price_eur}</span>
        <img src="${item.image_url}" alt="">
        <h4 style="margin:8px 0 2px 0">${item.title}</h4>
        <div class="btnRow">
          <button class="btn" style="background:var(--panel);border:1px solid var(--line);color:var(--text)">Show on wall</button>
          <button class="btn primary">Buy now</button>
        </div>`;
      // Show on wall
      card.querySelectorAll('button')[0].addEventListener('click', async ()=>{
        if(!LAST_WALL_FILE) return alert('Upload wall photo first.');
        const fd = new FormData();
        fd.append('wall', LAST_WALL_FILE, LAST_WALL_FILE.name);
        fd.append('artwork_url', item.image_url);
        fd.append('artwork_ratio', item.ratio);
        fd.append('scale', '0.45');
        const r = await fetch('/api/mockup', { method:'POST', body: fd });
        if(!r.ok) return alert('Mockup error');
        const data = await r.json();
        mockEl.src = data.url; mockCard.style.display = 'block';
        window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
      });
      // Buy
      card.querySelectorAll('button')[1].addEventListener('click', async ()=>{
        const fd = new FormData();
        fd.append('product_url', item.product_url || '');
        if (item.variant_id) fd.append('variant_id', item.variant_id);
        fd.append('quantity', '1');
        const r = await fetch('/api/checkout-link', { method:'POST', body: fd });
        const out = await r.json();
        window.open(out.url, '_blank');
      });
      grid.appendChild(card);
    });
  }

  async function loadSuggestions(){
    grid.innerHTML = '<p class="muted">Loading…</p>';
    const res = await fetch('/api/artworks');
    const json = await res.json();
    ALL_ITEMS = json.items || [];
    applyPriceFilter();
  }
  function applyPriceFilter(){
    const maxP = parseFloat(maxPriceInput.value||'');
    let items = ALL_ITEMS.slice();
    if(!isNaN(maxP)) items = items.filter(i => (parseFloat(i.price_eur)||0) <= maxP);
    renderItems(items);
  }
  suggestBtn.addEventListener('click', loadSuggestions);
  maxPriceInput.addEventListener('input', applyPriceFilter);
  document.addEventListener('DOMContentLoaded', loadSuggestions);

  // GDPR
  const cookie = document.getElementById('cookie');
  const okCookie = localStorage.getItem('rv_cookie_ok');
  if(!okCookie){ cookie.style.display = 'block'; }
  document.getElementById('c-accept').addEventListener('click', ()=>{ localStorage.setItem('rv_cookie_ok','1'); cookie.style.display='none'; });
  document.getElementById('c-decline').addEventListener('click', ()=>{ localStorage.setItem('rv_cookie_ok','0'); cookie.style.display='none'; });

  // Newsletter (optional)
  const nl = document.getElementById('nl');
  if (nl) {
    nl.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('nlEmail').value || '';
      const fd = new FormData(); fd.append('email', email); fd.append('consent','true');
      try{
        const r = await fetch('/api/lead', { method:'POST', body: fd });
        document.getElementById('nlMsg').textContent = r.ok ? 'Thanks! Check your inbox.' : 'Please try again later.';
        if (r.ok) nl.reset();
      }catch(_){ document.getElementById('nlMsg').textContent = 'Please try again later.'; }
    });
  }
</script>
</body></html>
'''

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ---------- Design/Legal ----------
@app.get("/privacy", response_class=HTMLResponse)
def privacy():
    return HTMLResponse(content="""
    <html><head><title>Privacy Policy • RoomVibe</title></head>
    <body style="font-family:system-ui;max-width:860px;margin:40px auto;padding:0 16px;color:#0B1020">
    <h1>Privacy Policy</h1>
    <p>This is a lightweight demo policy. Replace with your actual GDPR-compliant policy.</p>
    <p><a href="/">← Back</a></p>
    </body></html>""")

@app.get("/terms", response_class=HTMLResponse)
def terms():
    return HTMLResponse(content="""
    <html><head><title>Terms of Service • RoomVibe</title></head>
    <body style="font-family:system-ui;max-width:860px;margin:40px auto;padding:0 16px;color:#0B1020">
    <h1>Terms of Service</h1>
    <p>By using RoomVibe you agree to the standard acceptable-use terms. Replace with your full ToS.</p>
    <p><a href="/">← Back</a></p>
    </body></html>""")

# ---------- API: Artworks ----------
@app.get("/api/artworks")
async def get_artworks(limit: int = 30):
    path = _find_shopify_csv()
    items: List[Dict] = []
    if path and os.path.exists(path):
        by_handle: Dict[str, List[Dict[str,str]]] = {}
        with open(path, newline="", encoding="utf-8-sig") as f:
            r = csv.DictReader(f)
            for row in r:
                handle = (_get(row, "Handle") or "").strip()
                if not handle: continue
                by_handle.setdefault(handle, []).append(row)

        for handle, rows in by_handle.items():
            choice = None
            for row in rows:
                vt = _get(row, "Variant Title", "variant_title")
                if DIMENSION_RE.search(vt or ""): choice = row; break
            if choice is None:
                priced = [r for r in rows if _to_float(_get(r,"Variant Price","Price")) > 0]
                choice = priced[0] if priced else rows[0]

            title_raw = (_get(choice, "Title") or "").strip()
            variant_title = (_get(choice, "Variant Title") or "").strip()
            title = _clean_title(title_raw)

            ratio = (_parse_ratio_from_text(variant_title) or
                     _parse_ratio_from_text(title) or
                     _parse_ratio_from_handle(handle) or 1.0)
            price = _to_float(_get(choice, "Variant Price", "Price"))

            images = []
            for row in rows:
                src = _get(row, "Image Src","Image URL")
                if src:
                    images.append({
                        "src": src,
                        "alt": _get(row, "Image Alt Text"),
                        "position": _get(row, "Image Position","position") or 0
                    })
            variant_image = _get(choice, "Variant Image")
            image_url = _pick_best_image_for_product(variant_image, images)
            if image_url and "cdn.shopify.com" in image_url:
                image_url += ("&" if "?" in image_url else "?") + "width=900"

            variant_id = (_get(choice, "Variant ID") or "").strip()
            base = f"https://{STORE_DOMAIN}/products/{handle}"
            product_url = f"{base}?variant={variant_id}" if variant_id else base

            display_title = title if not variant_title or variant_title.lower()=="default title" else f"{title} — {variant_title}"

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

# ---------- API: Palette ----------
@app.post("/api/palette")
async def extract_palette(file: UploadFile = File(...)):
    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        colors = _dominant_colors_pil(img, k=5)
        return {"colors": colors, "mood": "auto"}
    except Exception:
        return {"colors": ["#D4C5B9","#E8DDD3","#B89A7F","#9B8577","#F5EDE4"], "mood":"warm_neutrals"}

# ---------- API: Checkout link ----------
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
    query.update({"utm_source": UTM_SOURCE, "utm_medium": UTM_MEDIUM, "utm_campaign": UTM_CAMPAIGN})
    if discount: query["discount"] = discount
    new_query = urlencode(query)
    new_url = urlunparse((u.scheme or "https", u.netloc, u.path, u.params, new_query, u.fragment))
    return {"url": new_url}

# ---------- API: Mockup ----------
@app.post("/api/mockup")
async def make_mockup(
    wall: UploadFile = File(...),
    artwork_url: str = Form(""),
    artwork: UploadFile = File(None),
    artwork_ratio: Optional[float] = Form(None),
    scale: float = Form(0.45),
    wall_width_cm: Optional[float] = Form(None),
):
    wall_bytes = await wall.read()
    try:
        wall_img = Image.open(io.BytesIO(wall_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid wall image")
    ww, wh = wall_img.size

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

    tw = max(1, int(ww * max(0.2, min(float(scale), 0.9))))
    if artwork_ratio and float(artwork_ratio) > 0: th = int(tw / float(artwork_ratio))
    else:
        arw, arh = art_img.size
        aspect = arw / arh if arh else 1.0
        th = int(tw / aspect)

    art_resized = art_img.resize((tw, th))
    x = (ww - tw) // 2
    y = max(0, min(int(wh * 0.35), wh - th))
    comp = wall_img.copy(); comp.paste(art_resized, (x, y))

    fname = f"m_{int(time.time())}.jpg"
    out_path = os.path.join(MOCK_DIR, fname)
    comp.save(out_path, "JPEG", quality=88)
    url = f"/static/mockups/{fname}"
    return {"url": url, "x": x, "y": y, "w": tw, "h": th, "wall_px": ww, "wall_width_cm": wall_width_cm}

# ---------- API: Lead (MailerLite) ----------
@app.post("/api/lead")
async def lead_capture(email: str = Form(...), consent: str = Form("false"), source: str = Form("roomvibe_app")):
    if not MAILERLITE_API_KEY:
        return JSONResponse({"ok": False, "message": "MailerLite not configured"}, status_code=503)
    payload = {"email": email, "fields": {"source": source}}
    if MAILERLITE_GROUP_ID: payload["groups"] = [MAILERLITE_GROUP_ID]
    try:
        res = requests.post(
            "https://connect.mailerlite.com/api/subscribers",
            json=payload,
            headers={"Authorization": f"Bearer {MAILERLITE_API_KEY}",
                     "Content-Type": "application/json","Accept":"application/json"},
            timeout=10
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"MailerLite error: {e}")
    if res.status_code not in (200, 201): raise HTTPException(status_code=res.status_code, detail=res.text)
    return JSONResponse({"ok": True})

# ---------- Webhooks (Stripe stub) ----------
@app.post("/webhooks/stripe")
async def stripe_webhook(): return JSONResponse({"received": True})
