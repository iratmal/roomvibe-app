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
  <title>RoomVibe — Art that fits your room</title>
  <meta name="description" content="Upload your wall, get AI color-matched art suggestions, see instant mockups, and buy in one click." />
  <link rel="icon" href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%23111111"/><text x="32" y="42" font-size="30" font-family="Verdana" text-anchor="middle" fill="%23C9A15B">RV</text></svg>' />
  <style>
    :root{
      /* paleta: siva + zlatni akcent + blagi color pops */
      --bg:#F4F5F7;
      --ink:#0F0F0F;
      --muted:#737581;
      --panel:#FFFFFF;
      --line:#E7E7EC;
      --gold:#C9A15B;     /* primarni akcent */
      --gold-2:#E4C891;   /* svjetliji zlatni */
      --pop-1:#6EC3C3;    /* teal pop */
      --pop-2:#E6A4B4;    /* blush pop */
      --btn:#111; --btn-ink:#fff;
      --rad:18px; --pad:16px;
    }
    *{box-sizing:border-box} html,body{margin:0;padding:0;scroll-behavior:smooth}
    body{background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}
    a{color:inherit}
    .wrap{max-width:1200px;margin:0 auto;padding:0 20px}

    /* NAV */
    .nav{position:sticky;top:0;z-index:50;background:rgba(244,245,247,.85);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid var(--line)}
    .nav-inner{display:flex;align-items:center;justify-content:space-between;padding:12px 0}
    .brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.2px}
    .badge{width:32px;height:32px;border-radius:10px;background:#111;color:var(--gold);display:grid;place-items:center;font-size:12px;box-shadow:0 1px 0 rgba(0,0,0,.08)}
    .nav-links{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
    .link{opacity:.86;text-decoration:none}
    .link:hover{opacity:1}
    .btn{background:var(--btn);color:var(--btn-ink);padding:10px 16px;border-radius:12px;border:1px solid #0000;cursor:pointer;text-decoration:none;display:inline-block}
    .btn.ghost{background:#fff;border:1px solid var(--line);color:#111}

    /* HERO */
    .hero{position:relative;margin:28px 0 18px}
    .hero-bg{
      position:absolute;inset:-50px 0 0 0;z-index:-1;
      background:
        radial-gradient(900px 340px at 20% -80px, rgba(201,161,91,.25), transparent 60%),
        radial-gradient(600px 260px at 90% 10%, rgba(110,195,195,.16), transparent 60%),
        linear-gradient(180deg,#fff 0%, #F4F5F7 70%);
      border-bottom:1px solid var(--line);
    }
    .hero-inner{display:grid;grid-template-columns:1.25fr .9fr;gap:24px}
    @media (max-width:1000px){ .hero-inner{grid-template-columns:1fr} }
    .hero-card{background:linear-gradient(180deg,#fff,#FAFAFB);border:1px solid var(--line);border-radius:24px;padding:28px;box-shadow:0 10px 30px rgba(17,17,17,.04)}
    h1{font-size:clamp(34px,4.4vw,56px);line-height:1.03;margin:0 0 10px;letter-spacing:-.5px}
    .sub{color:var(--muted);margin:0 0 16px;font-size:clamp(16px,1.5vw,18px)}
    .cta-row{display:flex;gap:12px;flex-wrap:wrap}
    .cta-accent{background:linear-gradient(90deg,var(--gold),var(--gold-2));color:#111;border:none}
    .cta-accent:hover{filter:saturate(105%)}

    /* hero vizual (kolaza sa tvojim fotkama) */
    .hero-viz{position:relative}
    .polaroid{background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px;box-shadow:0 14px 40px rgba(17,17,17,.08)}
    .polaroid img{display:block;width:100%;height:auto;border-radius:12px}
    .stack{display:grid;gap:14px}
    .stack .row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    @media (max-width:1000px){ .stack .row{grid-template-columns:1fr} }

    /* SECTIONS */
    .section{margin:36px 0}
    .muted{color:var(--muted)}

    /* FEATURES */
    .features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    @media (max-width:900px){ .features{grid-template-columns:1fr} }
    .fcard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 6px 18px rgba(17,17,17,.03)}
    .fic{width:40px;height:40px;border-radius:12px;background:#111;color:var(--gold);display:grid;place-items:center;font-weight:800;margin-bottom:10px}

    /* APP (naš UI) */
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    @media (max-width:900px){ .cols{grid-template-columns:1fr} }
    .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--rad);padding:var(--pad);box-shadow:0 6px 18px rgba(17,17,17,.03)}
    #drop{border:2px dashed #D4D7DD;border-radius:var(--rad);padding:28px;text-align:center;background:#fff}
    .input{padding:10px;border:1px solid #DADCE3;border-radius:12px;background:#fff}
    .palette{display:flex;gap:8px;margin-top:10px}
    .sw{width:40px;height:40px;border-radius:10px;border:1px solid #ECE3D7}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
    .art{border:1px solid var(--line);border-radius:14px;padding:10px;background:#fff}
    .art img{width:100%;height:160px;object-fit:cover;border-radius:10px}
    #mockupCard{display:none}
    #mockupImg{max-width:100%;border-radius:14px;border:1px solid var(--line)}

    /* HOW */
    .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
    @media (max-width:900px){ .steps{grid-template-columns:1fr 1fr} }
    .step{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px}
    .n{display:inline-block;background:var(--gold);color:#111;border-radius:10px;padding:4px 10px;font-weight:800;margin-bottom:6px}

    /* PRICING */
    .pricing-head{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
    .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    @media (max-width:900px){ .plans{grid-template-columns:1fr} }
    .plan{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;flex-direction:column;box-shadow:0 8px 22px rgba(17,17,17,.04)}
    .plan h3{margin:0 0 6px}
    .price{font-weight:900;font-size:30px;margin:8px 0}
    .per{color:var(--muted);font-size:14px}
    .badge{display:inline-block;background:#FBF6EB;border:1px solid #E8DBC5;color:#7A5B2B;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700}
    .features-list{margin:10px 0 14px;padding:0;list-style:none}
    .features-list li{margin:6px 0}
    .plan .btn{margin-top:auto}
    .dim{font-size:12px;color:var(--muted);margin-top:8px}

    /* TESTIMONIALS */
    .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    @media (max-width:900px){ .tgrid{grid-template-columns:1fr} }
    .tcard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px}
    .stars{color:#E0B74F;margin-bottom:6px}
    .tmeta{display:flex;align-items:center;gap:10px;margin-top:10px}
    .avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#111;color:#fff;font-weight:800}

    /* FOOTER */
    footer{margin:40px 0 60px}
    .foot{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:18px;border-top:1px solid var(--line);padding-top:18px;color:#6F727B}
    @media (max-width:900px){ .foot{grid-template-columns:1fr 1fr} }
    .foot h4{margin:0 0 8px;color:#111}
    .foot a{display:block;text-decoration:none;margin:6px 0;opacity:.9}
    .foot a:hover{opacity:1}
  </style>
</head>
<body>
  <!-- NAV -->
  <div class="nav">
    <div class="wrap nav-inner">
      <div class="brand"><div class="badge">RV</div><div>RoomVibe</div></div>
      <div class="nav-links">
        <a class="link" href="#app">App</a>
        <a class="link" href="#features">Features</a>
        <a class="link" href="#how">How it works</a>
        <a class="link" href="#pricing">Pricing</a>
        <a class="link" href="#testimonials">Testimonials</a>
        <a class="btn" href="#app">Start free</a>
      </div>
    </div>
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-bg"></div>
    <div class="wrap hero-inner">
      <div class="hero-card">
        <h1>Art that fits your room</h1>
        <p class="sub">Upload your wall. RoomVibe extracts your palette & scale, shows instant mockups of IrenArt pieces, and lets you buy in one click.</p>
        <div class="cta-row">
          <a class="btn cta-accent" href="#app">Start free</a>
          <a class="btn ghost" href="#pricing">See pricing</a>
        </div>
      </div>
      <div class="hero-viz">
        <div class="stack">
          <div class="polaroid">
            <img src="https://cdn.shopify.com/s/files/1/0787/0477/1421/files/whispersofthering3.jpg?v=1749636551" alt="Whispers of the Ring on wall">
          </div>
          <div class="row">
            <div class="polaroid">
              <img src="https://cdn.shopify.com/s/files/1/0787/0477/1421/files/TurquoiseMist2_d3e96df1-cae3-440d-8172-e19b1e50a56d.jpg?v=1746615212" alt="Turquoise Mist detail">
            </div>
            <div class="polaroid">
              <img src="https://cdn.shopify.com/s/files/1/0787/0477/1421/files/Optimism_print_2.jpg?v=1760684851" alt="Optimism print">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- FEATURES -->
  <div id="features" class="wrap section">
    <div class="features">
      <div class="fcard">
        <div class="fic">🎨</div>
        <h3>AI palette</h3>
        <p class="muted">We auto-extract your room colors for truly matching suggestions.</p>
      </div>
      <div class="fcard">
        <div class="fic">🖼️</div>
        <h3>Instant mockups</h3>
        <p class="muted">See the artwork on your wall in seconds — scale-aware, crisp, convincing.</p>
      </div>
      <div class="fcard">
        <div class="fic">🛒</div>
        <h3>One-click buy</h3>
        <p class="muted">Catalog items open direct checkout with UTM & discounts embedded.</p>
      </div>
    </div>
  </div>

  <!-- APP -->
  <div id="app" class="wrap section">
    <div class="cols">
      <div class="card">
        <h3>1) Upload wall photo</h3>
        <div id="drop">Drag &amp; drop image here or <input type="file" id="file" accept="image/*"></div>
        <div style="display:flex; gap:8px; margin-top:10px; align-items:center">
          <label>Wall width (cm): </label>
          <input id="wallWidth" class="input" type="number" min="50" max="1000" placeholder="e.g. 300">
        </div>
        <div id="palette" class="palette"></div>
        <p id="status" class="muted"></p>

        <h3 style="margin-top:8px">2) Mode</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="modeCatalog" class="btn">Use catalog</button>
          <button id="modeUpload" class="btn ghost">Upload artwork (preview)</button>
        </div>

        <div id="uploadPane" style="display:none;margin-top:10px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input type="file" id="artFile" accept="image/*">
            <button id="mockOwnBtn" class="btn" disabled>Show on wall</button>
          </div>
          <label style="display:flex;gap:8px;align-items:center;margin-top:8px">
            <input type="checkbox" id="rights">
            <span class="muted">I confirm I can use this image for visualization purposes.</span>
          </label>
          <p class="muted" style="margin-top:6px">Buying is available only for catalog items.</p>
        </div>

        <button id="suggestBtn" class="btn" style="margin-top:10px" disabled>3) Get suggestions (catalog)</button>
      </div>

      <div class="card">
        <h3>Suggestions</h3>
        <div id="grid" class="grid"></div>
      </div>
    </div>

    <div class="card" id="mockupCard" style="margin-top:16px">
      <h3>Mockup preview</h3>
      <img id="mockupImg" alt="Mockup preview"/>
      <p class="muted" style="margin-top:6px">Visualization only. Actual color/scale depends on lighting & camera perspective.</p>
    </div>
  </div>

  <!-- HOW IT WORKS -->
  <div id="how" class="wrap section">
    <h2>How it works</h2>
    <div class="steps">
      <div class="step"><span class="n">1</span><div>Upload a wall photo (phone is fine).</div></div>
      <div class="step"><span class="n">2</span><div>We extract your room's palette &amp; size.</div></div>
      <div class="step"><span class="n">3</span><div>Try curated IrenArt pieces or upload your own for preview.</div></div>
      <div class="step"><span class="n">4</span><div>Buy catalog art in one click — tracked sales.</div></div>
    </div>
  </div>

  <!-- PRICING -->
  <div id="pricing" class="wrap section">
    <div class="pricing-head">
      <h2>Pricing</h2>
      <span class="badge">Free plan available</span>
    </div>
    <div class="plans">
      <div class="plan">
        <h3>Free</h3>
        <div class="price">€0 <span class="per">/ mo</span></div>
        <ul class="features-list">
          <li>3 mockups / month</li>
          <li>AI palette</li>
          <li>Catalog suggestions</li>
        </ul>
        <a class="btn" href="#app">Start free</a>
        <div class="dim">No card required.</div>
      </div>

      <div class="plan" style="border-width:2px;border-color:#E8D9BF">
        <div class="badge" style="margin-bottom:6px">Most popular</div>
        <h3>Pro</h3>
        <div class="price">€9 <span class="per">/ mo</span></div>
        <ul class="features-list">
          <li>Unlimited mockups</li>
          <li>Priority processing</li>
          <li>Direct-to-checkout links</li>
        </ul>
        <a class="btn cta-accent" href="#app">Start Pro</a>
        <div class="dim">Cancel anytime.</div>
      </div>

      <div class="plan">
        <h3>Studio</h3>
        <div class="price">€29 <span class="per">/ mo</span></div>
        <ul class="features-list">
          <li>Client galleries</li>
          <li>Embeddable widget</li>
          <li>Team seats (3)</li>
        </ul>
        <a class="btn" href="#app">Start Studio</a>
        <div class="dim">Designed for designers.</div>
      </div>
    </div>
  </div>

  <!-- TESTIMONIALS -->
  <div id="testimonials" class="wrap section">
    <h2>Testimonials</h2>
    <div class="tgrid">
      <div class="tcard">
        <div class="stars">★★★★★</div>
        <div>“Placed ‘Whispers of the Ring’ on my living-room wall in seconds — the scale felt right immediately.”</div>
        <div class="tmeta"><div class="avatar">D</div><div><b>Dino</b><br><span class="muted">Zagreb</span></div></div>
      </div>
      <div class="tcard">
        <div class="stars">★★★★★</div>
        <div>“Loved the palette hints — I picked ‘Turquoise Mist’ and it fits my neutrals perfectly.”</div>
        <div class="tmeta"><div class="avatar">I</div><div><b>Iva</b><br><span class="muted">Interior design buyer</span></div></div>
      </div>
      <div class="tcard">
        <div class="stars">★★★★★</div>
        <div>“The mockup preview removed all doubt — one click to checkout felt seamless.”</div>
        <div class="tmeta"><div class="avatar">B</div><div><b>Branimir</b><br><span class="muted">Homeowner</span></div></div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer>
    <div class="wrap foot">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div class="badge">RV</div><strong>RoomVibe</strong>
        </div>
        <div>© RoomVibe — Luminastart j.d.o.o.</div>
        <div class="muted">Made for art lovers. Zagreb, EU.</div>
      </div>
      <div>
        <h4>Product</h4>
        <a href="#app">App</a>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#testimonials">Testimonials</a>
      </div>
      <div>
        <h4>Company</h4>
        <a href="mailto:hello@roomvibe.app">Contact</a>
        <a href="https://irenart.studio" target="_blank" rel="noopener">IrenArt Studio</a>
        <a href="#how">How it works</a>
      </div>
      <div>
        <h4>Legal</h4>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
      </div>
    </div>
  </footer>

  <!-- Placeholder legal sekcije da linkovi rade -->
  <div id="privacy" class="wrap section">
    <h2>Privacy</h2>
    <p class="muted">We only process images for visualization and do not share them with third parties. Full policy coming soon.</p>
  </div>
  <div id="terms" class="wrap section">
    <h2>Terms</h2>
    <p class="muted">By using RoomVibe, you agree to visualization-only previews and direct-to-checkout on partner stores.</p>
  </div>

  <script>
    /* ---- APP LOGIKA (kao prije) ---- */
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

    const modeCatalogBtn = document.getElementById('modeCatalog');
    const modeUploadBtn = document.getElementById('modeUpload');
    const uploadPane = document.getElementById('uploadPane');
    const artInput = document.getElementById('artFile');
    const rights = document.getElementById('rights');
    const mockOwnBtn = document.getElementById('mockOwnBtn');

    function showPalette(colors){
      paletteEl.innerHTML = '';
      (colors||[]).forEach(hex=>{
        const sw = document.createElement('div');
        sw.className='sw';
        sw.title=hex;
        sw.style.background = hex;
        paletteEl.appendChild(sw);
      });
    }

    async function uploadAndGetPalette(file){
      statusEl.textContent = 'Uploading…';
      LAST_WALL_FILE = file;
      const fd = new FormData();
      fd.append('file', file, file.name);
      const res = await fetch('/api/palette', { method:'POST', body: fd });
      if(!res.ok){ statusEl.textContent = 'Palette error.'; return; }
      const data = await res.json();
      statusEl.textContent = 'Palette detected (warm_neutrals).';
      showPalette(data.colors || ['#D4C5B9','#E8DDD3','#B89A7F','#9B8577','#F5EDE4']);
      suggestBtn.disabled = false;
      maybeToggleMockOwn();
    }

    function maybeToggleMockOwn(){
      mockOwnBtn.disabled = !(MODE === 'upload' && LAST_WALL_FILE && ART_FILE && rights.checked);
    }

    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.background='#fff'; });
    drop.addEventListener('dragleave', e=>{ e.preventDefault(); drop.style.background=''; });
    drop.addEventListener('drop', e=>{
      e.preventDefault(); drop.style.background='';
      const f = e.dataTransfer.files?.[0]; if(f) uploadAndGetPalette(f);
    });
    fileInput.addEventListener('change', e=>{
      const f = e.target.files?.[0]; if(f) uploadAndGetPalette(f);
    });

    modeCatalogBtn.addEventListener('click', ()=>{ MODE='catalog'; uploadPane.style.display='none'; maybeToggleMockOwn(); });
    modeUploadBtn.addEventListener('click', ()=>{ MODE='upload'; uploadPane.style.display='block'; maybeToggleMockOwn(); });

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
            <button class="btn">Buy now</button>
          </div>
        `;
        card.querySelector('.btn').addEventListener('click', async ()=>{
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
  </script>
</body>
</html>
'''
DESIGN_PAGE = r'''
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>RoomVibe — Design Playground (Variant B)</title>
  <!-- Tailwind JIT CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            rv: {
              purple: "#6D28D9", purpleHover:"#5B21B6", purpleActive:"#4C1D95", purpleFocus:"#A78BFA",
              teal: "#06B6D4", tealHover:"#0891B2", tealActive:"#0E7490", tealFocus:"#67E8F9",
              promo: "#DB2777", promoHover:"#BE185D", promoActive:"#9D174D", promoFocus:"#FBCFE8",
              ink:"#0B1020", paper:"#FAFAFA"
            }
          },
          borderRadius: { xl: "0.75rem" }
        }
      }
    }
  </script>
  <!-- React 18 + Babel (no build step) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-rv-paper text-rv-ink">
  <div class="max-w-6xl mx-auto px-6 py-10">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl md:text-4xl font-semibold tracking-tight">RoomVibe — Design Playground</h1>
      <a href="/" class="text-sm underline">← Back to app</a>
    </header>
    <div id="root"></div>
  </div>

  <script type="text/babel">
    const { useState } = React;

    const TOKENS = {
      primary: {
        bg: { default: "#6D28D9", hover: "#5B21B6", active: "#4C1D95", disabled: "#C4B5FD" },
        fg: { default: "#FFFFFF", disabled: "#FFFFFF" },
        focus: "#A78BFA",
      },
      secondary: {
        bg: { default: "#06B6D4", hover: "#0891B2", active: "#0E7490", disabled: "#BAE6FD" },
        fg: { default: "#0B1020", disabled: "#0B1020" },
        focus: "#67E8F9",
      },
      promo: {
        bg: { default: "#DB2777", hover: "#BE185D", active: "#9D174D", disabled: "#FBCFE8" },
        fg: { default: "#FFFFFF", disabled: "#FFFFFF" },
        focus: "#FBCFE8",
      },
      neutral: { dark: "#0B1020", light: "#FAFAFA" },
    };

    function Swatch({ role, hex, text, border }) {
      return (
        <div className="flex items-center gap-4 p-3 rounded-xl border border-zinc-200 bg-white">
          <div
            className="h-12 w-12 rounded-lg shadow"
            style={{ backgroundColor: hex, border: border ? \`2px solid \${border}\` : undefined }}
            aria-label={\`\${role} \${hex}\`}
          />
          <div className="flex flex-col">
            <span className="text-sm text-zinc-700 font-medium">{role}</span>
            <span className="text-xs tabular-nums text-zinc-500">{hex}</span>
          </div>
          <div className="ml-auto">
            <span
              className="text-xs px-2 py-1 rounded-md border"
              style={{ backgroundColor: hex, color: text, borderColor: "rgba(0,0,0,0.08)" }}
            >
              Sample text
            </span>
          </div>
        </div>
      );
    }

    function StatefulBtn({ kind, label }) {
      const [state, setState] = useState("default");
      const colors = TOKENS[kind];
      const bg = colors.bg[state];
      const fg = colors.fg.default;
      return (
        <button
          className="text-sm px-4 py-2 rounded-xl shadow-sm outline-none"
          onMouseEnter={() => setState("hover")}
          onMouseLeave={() => setState("default")}
          onMouseDown={() => setState("active")}
          onMouseUp={() => setState("hover")}
          style={{ backgroundColor: bg, color: fg, boxShadow: \`0 0 0 0px \${colors.focus}\` }}
          onFocus={(e) => (e.currentTarget.style.boxShadow = \`0 0 0 3px \${colors.focus}\`)}
          onBlur={(e) => (e.currentTarget.style.boxShadow = \`0 0 0 0px \${colors.focus}\`)}
        >
          {label} <span className="opacity-60">• {state}</span>
        </button>
      );
    }

    function App() {
      return (
        <div className="min-h-screen w-full" style={{ backgroundColor: TOKENS.neutral.light, color: TOKENS.neutral.dark }}>
          <div className="max-w-6xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Variant B: Royal Purple + Teal Pop
              </h2>
              <p className="mt-2 text-zinc-600 max-w-2xl">
                Primary CTA (purple) with strong contrast, secondary (teal) with dark text, promo (pink) with white text.
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-zinc-200">
                <h3 className="text-lg font-semibold mb-3">Core Swatches</h3>
                <div className="space-y-3">
                  <Swatch role="Primary CTA" hex={TOKENS.primary.bg.default} text={TOKENS.primary.fg.default} />
                  <Swatch role="Secondary" hex={TOKENS.secondary.bg.default} text={TOKENS.secondary.fg.default} />
                  <Swatch role="Promo" hex={TOKENS.promo.bg.default} text={TOKENS.promo.fg.default} />
                  <Swatch role="Neutral Dark" hex={TOKENS.neutral.dark} text={TOKENS.neutral.light} />
                  <Swatch role="Neutral Light" hex={TOKENS.neutral.light} text={TOKENS.neutral.dark} />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm border border-zinc-200">
                <h3 className="text-lg font-semibold mb-3">Buttons — Interactive States</h3>
                <div className="flex flex-col gap-3">
                  <StatefulBtn kind="primary" label="Buy now" />
                  <StatefulBtn kind="secondary" label="Add to cart" />
                  <StatefulBtn kind="promo" label="Limited offer" />
                  <div className="text-xs text-zinc-500 mt-2">
                    Focus ring colors — primary {TOKENS.primary.focus}, secondary {TOKENS.secondary.focus}, promo {TOKENS.promo.focus}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm border border-zinc-200">
              <h3 className="text-lg font-semibold mb-3">Design Tokens (HEX)</h3>
              <pre className="text-xs overflow-auto p-3 rounded-lg bg-zinc-50 border" style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify({
                  color: {
                    brand: { primary: "#6D28D9", secondary: "#06B6D4", promo: "#DB2777" },
                    neutral: { 900: "#0B1020", 50: "#FAFAFA" },
                    on: { primary: "#FFFFFF", secondary: "#0B1020", promo: "#FFFFFF" },
                  },
                  button: {
                    primary: { bg: { default: "#6D28D9", hover: "#5B21B6", active: "#4C1D95", disabled: "#C4B5FD" }, fg: "#FFFFFF", focus: "#A78BFA" },
                    secondary: { bg: { default: "#06B6D4", hover: "#0891B2", active: "#0E7490", disabled: "#BAE6FD" }, fg: "#0B1020", focus: "#67E8F9" },
                    promo: { bg: { default: "#DB2777", hover: "#BE185D", active: "#9D174D", disabled: "#FBCFE8" }, fg: "#FFFFFF", focus: "#FBCFE8" },
                  },
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
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
