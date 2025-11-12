from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RoomVibe")

@app.get("/")
async def root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>RoomVibe</title>
    </head>
    <body>
        <h1>Welcome to RoomVibe</h1>
        <p><a href="/api/health">Check API Health</a></p>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/artworks")
async def get_artworks():
    return [
        {
            "id": 1,
            "title": "Abstract Sunset",
            "ratio": "16:9",
            "price_eur": 89.99,
            "product_url": "https://example.com/products/abstract-sunset",
            "image_url": "https://example.com/images/abstract-sunset.jpg"
        },
        {
            "id": 2,
            "title": "Modern Geometry",
            "ratio": "4:3",
            "price_eur": 129.50,
            "product_url": "https://example.com/products/modern-geometry",
            "image_url": "https://example.com/images/modern-geometry.jpg"
        },
        {
            "id": 3,
            "title": "Coastal Waves",
            "ratio": "1:1",
            "price_eur": 99.00,
            "product_url": "https://example.com/products/coastal-waves",
            "image_url": "https://example.com/images/coastal-waves.jpg"
        }
    ]

@app.post("/api/palette")
async def extract_palette(image: UploadFile = File(...)):
    placeholder_colors = [
        "#D4C5B9",
        "#E8DDD3",
        "#B89A7F",
        "#9B8577",
        "#F5EDE4"
    ]
    
    return {
        "colors": placeholder_colors,
        "mood": "warm_neutrals"
    }

@app.post("/api/checkout-link")
async def create_checkout_link(product_url: str = Form(...)):
    utm_source = os.getenv("utm_source", "roomvibe")
    utm_medium = os.getenv("utm_medium", "app")
    utm_campaign = os.getenv("utm_campaign", "default")
    
    separator = "&" if "?" in product_url else "?"
    
    tracking_url = f"{product_url}{separator}utm_source={utm_source}&utm_medium={utm_medium}&utm_campaign={utm_campaign}"
    
    return {"checkout_url": tracking_url}

@app.post("/webhooks/stripe")
async def stripe_webhook():
    return {"received": True}
