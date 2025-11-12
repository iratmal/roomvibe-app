# RoomVibe Widget

**RoomVibe** is a lightweight, embeddable React widget that lets visitors try original artworks and prints in room presets, select sizes, frames, wall colors, and purchase with one click.

## 🎨 Features

- **3 Room Presets**: Living Room, Hallway, Bedroom
- **Artwork Selection**: Browse from a catalog of artworks
- **Realistic Scaling**: Artwork scales proportionally based on size
- **Size & Frame Options**: Multiple size options and frame styles (none, black, white, oak)
- **Wall Color Picker**: Choose from swatches or custom color
- **Designer Mode**: Enter precise dimensions for custom sizing
- **One-Click Checkout**: Direct Shopify/ThriveCart integration
- **Email Capture**: MailerLite integration for lead generation
- **Share Links**: Generate shareable URLs with state preserved
- **Three Themes**: Azure (blue), Royal (purple), Sunset (orange)
- **Analytics Events**: Track user interactions with custom hooks

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5000` to see the demo.

### Build

```bash
# Build demo app
npm run build

# Build widget (UMD + ESM)
npm run build:umd
```

## 📦 Usage

### React Component (ESM)

```tsx
import { RoomVibe } from '@roomvibe/widget';

export default function Demo() {
  return (
    <RoomVibe
      mode="showcase"
      collection="originals"
      theme="azure"
      oneClickBuy
      checkoutType="shopify"
      checkoutLinkTemplate="https://yourshop.com/cart/..."
      onEvent={(e) => console.log('RoomVibe event:', e)}
    />
  );
}
```

### HTML Script Tag (UMD)

```html
<div id="roomvibe-root"></div>
<script
  src="https://cdn.example.com/roomvibe.widget.umd.js"
  data-target="#roomvibe-root"
  data-mode="showcase"
  data-collection="originals"
  data-theme="azure"
  data-one-click-buy="true"
  data-checkout-type="shopify"
  data-checkout-link-template="https://yourshop.com/cart/..."
  defer></script>
```

**Important**: When deploying the widget, ensure you also upload the following assets from `dist-widget/`:
- `artworks.json` - Artwork catalog data
- `rooms/` folder - Room preset images
- `art/` folder - Artwork images

These files must be served from the same domain/path as the widget script.

## ⚙️ Configuration

### Props/Attributes

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'showcase' \| 'designer'` | `'showcase'` | Display mode |
| `collection` | `string` | `'all'` | Filter artworks by collection |
| `theme` | `'azure' \| 'royal' \| 'sunset'` | `'azure'` | Color theme |
| `oneClickBuy` | `boolean` | `false` | Enable one-click checkout |
| `checkoutType` | `'shopify' \| 'thrivecart'` | - | Checkout platform |
| `checkoutLinkTemplate` | `string` | - | Custom checkout URL template |
| `onEvent` | `function` | - | Analytics event callback |

### Themes

Switch themes via the `theme` prop/attribute:

- **Azure (Blue)**: Clean, professional blue palette
- **Royal (Purple)**: Elegant purple tones
- **Sunset (Orange)**: Warm, energetic orange hues

## 📊 Analytics Events

RoomVibe emits the following events:

- `rv_view` - Widget loaded
- `rv_art_select` - Artwork selected
- `rv_size_change` - Size changed
- `rv_frame_change` - Frame changed
- `rv_wall_color_change` - Wall color changed
- `rv_room_change` - Room preset changed
- `rv_buy_click` - Buy button clicked
- `rv_email_submit` - Email submitted
- `rv_share_copy` - Share link copied
- `rv_designer_mode_toggle` - Designer mode toggled

### Listening to Events

```javascript
// Global hook
window.onRoomVibeEvent = (event) => {
  console.log('RoomVibe event:', event);
  // Send to your analytics platform
};

// Or via React prop
<RoomVibe onEvent={(event) => { ... }} />
```

## 🎭 Pricing Component

The widget includes a modern pricing component with three tiers:

- **Free**: Basic features
- **Designer Pro**: Advanced features for interior designers
- **Studio**: White label solution with API access

## 📁 Project Structure

```
roomvibe/
├── public/
│   ├── rooms/          # Room preset images
│   ├── art/            # Artwork images
│   └── artworks.json   # Artwork catalog
├── src/
│   ├── widget/         # Core widget components
│   │   ├── RoomVibe.tsx
│   │   ├── RoomViewer.tsx
│   │   ├── ArtworkSelector.tsx
│   │   ├── Controls.tsx
│   │   └── Pricing.tsx
│   ├── demo/           # Demo app
│   ├── lib/            # Utilities
│   │   ├── analytics.ts
│   │   ├── checkout.ts
│   │   ├── mailerlite.ts
│   │   └── shareLink.ts
│   ├── types.ts        # TypeScript definitions
│   ├── themes.css      # CSS variables for themes
│   └── index.css       # Global styles
├── index.html
├── package.json
├── vite.config.ts      # Demo build config
└── vite.config.umd.ts  # Widget build config
```

## 🔧 Customization

### Adding Artworks

Edit `public/artworks.json`:

```json
{
  "id": "unique-id",
  "title": "Artwork Title",
  "image": "/art/image.jpg",
  "ratio": 1.5,
  "sizes": ["80x60", "100x70"],
  "frameOptions": ["none", "black", "white", "oak"],
  "price": 1200,
  "checkout": {
    "type": "shopify",
    "template": "https://yourshop.com/cart/..."
  },
  "tags": ["original", "collection-name"]
}
```

### Adding Room Presets

1. Add image to `public/rooms/` (e.g., `office.jpg`)
2. Update `RoomPreset` type in `src/types.ts`
3. Add button in `RoomVibe.tsx`

## 🚢 Deployment

The widget is designed to work with Replit's autoscale deployment:

1. Set deployment target to "autoscale"
2. Configure health check endpoint
3. Set PORT=5000 secret

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using React, TypeScript, Vite, and Tailwind CSS.
