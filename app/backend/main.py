from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from urllib.parse import urlparse, urlencode, urlunparse, parse_qsl
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RoomVibe")

# (opcionalno) CORS – pomaže kasnije za embed/widget
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# ---- UI (homepage) ----
@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>RoomVibe</title>
      <style>
        :root { --pad: 14px; --radius: 14px; }
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;
             max-width:980px;margin:40px auto;padding:0 16px}
        .row{display:flex;gap:16px;flex-wrap:wrap}
        .card{border:1px solid #eee;border-radius:var(--radius);padding:var(--pad)}
        .btn{background:black;color:#fff;padding:10px 16px;border-radius:12px;
             border:none;cursor:pointer}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        #drop{border:2px dashed #bbb;border-radius:var(--radius);padding:30px;text-align:center}
        .palette{display:flex;gap:8px;margin-top:10px}
        .sw{width:38px;height:38px;border-radius:8px;border:1px solid #ddd}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
        .art{border:1px solid #eee;border-radius:12px;padding:10px}
        .art img{width:100%;height:150px;object-fit:cover;border-radius:8px}
        .muted{color:#666}
        .input{padding:10px;border:1px solid #ddd;border-radius:10px}
      </style>
    </head>
    <body>
      <h1>RoomVibe</h1>
      <p class="muted">Upload your wall → AI palette → suggestions → mockup → <b>Buy in 1 click</b>.</p>

      <div class="row">
        <div class="card" style="flex:1 1 380px">
          <h3>1) Upload wall photo</h3>
          <div id="drop">Drag & drop image here or <input type="file" id="file" accept="image/*"></div>
          <div style="margin-top:10px">
            <label>Wall width (cm): </label>
            <input id="wallWidth" class="input" type="number" min="50" max="1000" placeholder="e.g. 300">
          </div>
          <div id="palette" class="palette"></div>
          <p id="status" class="muted"></p>
          <button id="suggestBtn" class="btn" disabled>2) Get suggestions</button>
        </div>

        <div class="card" style="flex:1 1 380px">
          <h3>3) Suggestions</h3>
          <div id="grid" class="grid"></div>
        </div>
      </div>

      <p style="margin-top:24px"><a class="btn" href="/api/health" target="_blank">Health check</a></p>

      <script>
        const fileInput = document.getElementById('file');
        const drop = document.getElementById('drop');
        const paletteEl = document.getElementById('palette');
        const statusEl = document.getElementById('status');
        const suggestBtn = document.getElementById('suggestBtn');
        const grid = document.getElementById('grid');

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

        async function uploadAndGetPalette(file){
          statusEl.textContent = 'Uploading…';
          const fd = new FormData();
          fd.append('file', file, file.name); // IMPORTANT: field name = file
          const res = await fetch('/api/palette', { method:'POST', body: fd });
          if(!res.ok){ statusEl.textContent = 'Palette error.'; return; }
          const data = await res.json();
          statusEl.textContent = 'Palette detected ('+data.mood+').';
          showPalette(data.colors);
          suggestBtn.disabled = false;
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
              <button class="btn">Buy now</button>
            `;
            card.querySelector('button').addEventListener('click', async ()=>{
              const fd = new FormData();
              fd.append('product_url', item.product_url);
              const r = await fetch('/api/checkout-link', { method:'POST', body: fd });
              const {url} = await r.json();
              window.open(url, '_blank');
            });
            grid.appendChild(card);
          });
        });
      </script>
    </body>
    </html>
    """

# ---- API ----

@app.get("/api/artworks")
async def get_artworks():
    # Napomena: vraćamo {"items":[...]} da UI može raditi
    return {
        "items": [
            {
                "id": "a1",
                "title": "Good Vibes #12",
                "ratio": 1.43,
                "price_eur": 950.0,
                "product_url": "https://irenart.studio/products/gv-12",
                "image_url": "https://via.placeholder.com/800x560?text=Good+Vibes+%2312"
            },
            {
                "id": "a2",
                "title": "Energy in Motion #3",
                "ratio": 1.5,
                "price_eur": 1600.0,
                "product_url": "https://irenart.studio/products/eim-3",
                "image_url": "https://via.placeholder.com/900x600?text=Energy+in+Motion+%233"
            },
            {
                "id": "a3",
                "title": "Soft Neutrals #5",
                "ratio": 1.0,
                "price_eur": 650.0,
                "product_url": "https://irenart.studio/products/sn-5",
                "image_url": "https://via.placeholder.com/700x700?text=Soft+Neutrals+%235"
            }
        ]
    }

@app.post("/api/palette")
async def extract_palette(file: UploadFile = File(...)):
    # Za sada placeholder boje; kasnije zamjenjujemo stvarnim izvlačenjem palete
    placeholder_colors = ["#D4C5B9", "#E8DDD3", "#B89A7F", "#9B8577", "#F5EDE4"]
    return {"colors": placeholder_colors, "mood": "warm_neutrals"}

# UTM varijable: čitamo UPPERCASE (preporučeno), s fallbackom na lowercase
UTM_SOURCE = os.getenv("UTM_SOURCE") or os.getenv("utm_source") or "roomvibe"
UTM_MEDIUM = os.getenv("UTM_MEDIUM") or os.getenv("utm_medium") or "app"
UTM_CAMPAIGN = os.getenv("UTM_CAMPAIGN") or os.getenv("utm_campaign") or "default"

@app.post("/api/checkout-link")
async def create_checkout_link(product_url: str = Form(...)):
    u = urlparse(product_url)
    query = dict(parse_qsl(u.query)) if u.query else {}
    query.update({
        "utm_source": UTM_SOURCE,
        "utm_medium": UTM_MEDIUM,
        "utm_campaign": UTM_CAMPAIGN,
    })
    new_query = urlencode(query)
    new_url = urlunparse((u.scheme or "https", u.netloc, u.path, u.params, new_query, u.fragment))
    return {"url": new_url}

@app.post("/webhooks/stripe")
async def stripe_webhook():
    # Stub – poslije dodajemo verifikaciju potpisa i logiku
    return JSONResponse({"received": True})
