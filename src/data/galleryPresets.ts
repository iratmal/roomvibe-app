export interface GalleryPreset {
  id: string;
  name: string;
  description: string;
  image: string;
  wallArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  maxArtworks: number;
  scaleFactor: number;
}

export const galleryPresets: GalleryPreset[] = [
  {
    id: 'white-cube',
    name: 'White Cube Gallery',
    description: 'Clean, minimalist exhibition space with pristine white walls',
    image: '/gallery-presets/white-cube.jpg',
    wallArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.6 },
    maxArtworks: 6,
    scaleFactor: 1.0
  },
  {
    id: 'modern-loft',
    name: 'Modern Loft Gallery',
    description: 'Industrial-style space with exposed brick and natural light',
    image: '/gallery-presets/modern-loft.jpg',
    wallArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.65 },
    maxArtworks: 6,
    scaleFactor: 0.95
  },
  {
    id: 'concrete-room',
    name: 'Minimalist Concrete Room',
    description: 'Contemporary gallery with raw concrete walls',
    image: '/gallery-presets/concrete-room.jpg',
    wallArea: { x: 0.1, y: 0.12, width: 0.8, height: 0.58 },
    maxArtworks: 6,
    scaleFactor: 1.05
  },
  {
    id: 'classic-museum',
    name: 'Classic Museum Wall',
    description: 'Traditional museum setting with elegant wall treatments',
    image: '/gallery-presets/classic-museum.jpg',
    wallArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.65 },
    maxArtworks: 6,
    scaleFactor: 1.0
  }
];
