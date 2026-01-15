export interface PanoramaViewpoint {
  id: string;
  label: string;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  panoramaUrl?: string;
}

export interface PanoramaSlotMapping {
  slotId: string;
  viewpointId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  yaw: number;
  pitch: number;
}

export interface HybridPanoramaConfig {
  viewpoints: PanoramaViewpoint[];
  slotMappings: PanoramaSlotMapping[];
}

// SINGLE-SPACE NAVIGATION MODEL
// All viewpoints use the SAME panorama image
// Different camera orientations create the feeling of movement within ONE gallery space

// Base industrial gallery panorama - used for ALL positions
const BASE_PANORAMA_URL = '/panoramas/industrial-gallery.jpg';

export interface PanoramaAssetConfig {
  url: string | undefined;
  resolution?: number;
  label: string;
}

// All viewpoints share the same panorama - single space model
export const HYBRID_PANORAMA_ASSETS: Record<string, PanoramaAssetConfig> = {
  'entrance': {
    url: BASE_PANORAMA_URL,
    resolution: 4096,
    label: 'Entrance'
  },
  'center': {
    url: BASE_PANORAMA_URL,
    resolution: 4096,
    label: 'Center'
  },
  'back': {
    url: BASE_PANORAMA_URL,
    resolution: 4096,
    label: 'Back'
  },
  'left': {
    url: BASE_PANORAMA_URL,
    resolution: 4096,
    label: 'Left View'
  },
  'right': {
    url: BASE_PANORAMA_URL,
    resolution: 4096,
    label: 'Right View'
  },
  'forward': {
    url: BASE_PANORAMA_URL,
    resolution: 4096,
    label: 'Forward'
  }
};

export const HYBRID_PANORAMA_URLS: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(HYBRID_PANORAMA_ASSETS).map(([key, config]) => [key, config.url])
);

export function getPanoramaResolution(viewpointId: string): number {
  return HYBRID_PANORAMA_ASSETS[viewpointId]?.resolution || 4096;
}

export function getPanoramaLabel(viewpointId: string): string {
  return HYBRID_PANORAMA_ASSETS[viewpointId]?.label || viewpointId;
}

// SINGLE-SPACE VIEWPOINTS
// Same panorama, different camera orientations
// Yaw: horizontal rotation (radians) - 0 = forward, negative = left, positive = right
// Pitch: vertical tilt - 0 = level, negative = up, positive = down
// FOV: field of view - smaller = zoomed in

export const hybridPanoramaConfig: HybridPanoramaConfig = {
  viewpoints: [
    {
      id: 'entrance',
      label: 'Entrance',
      initialYaw: 0,           // Looking straight ahead into gallery
      initialPitch: 0,
      initialFov: Math.PI / 2, // 90 degree FOV
      panoramaUrl: BASE_PANORAMA_URL
    },
    {
      id: 'center',
      label: 'Center',
      initialYaw: 0,           // Centered view
      initialPitch: -0.05,     // Slightly looking up at walls
      initialFov: Math.PI / 2.2, // Slightly tighter view
      panoramaUrl: BASE_PANORAMA_URL
    },
    {
      id: 'forward',
      label: 'Forward',
      initialYaw: 0,           // Looking forward
      initialPitch: 0,
      initialFov: Math.PI / 2.5, // Tighter FOV = stepped forward
      panoramaUrl: BASE_PANORAMA_URL
    },
    {
      id: 'back',
      label: 'Back',
      initialYaw: Math.PI,     // 180 degree turn - looking back at entrance
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: BASE_PANORAMA_URL
    },
    {
      id: 'left',
      label: 'Left',
      initialYaw: -Math.PI / 2, // 90 degrees left
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: BASE_PANORAMA_URL
    },
    {
      id: 'right',
      label: 'Right',
      initialYaw: Math.PI / 2,  // 90 degrees right
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: BASE_PANORAMA_URL
    }
  ],
  slotMappings: [
    // NORTH WALL (visible from entrance, center, forward)
    // Entrance view - distant
    { slotId: 'hybrid-north-1', viewpointId: 'entrance', x: 0.20, y: 0.38, width: 0.08, height: 0.12, yaw: -0.5, pitch: 0.05 },
    { slotId: 'hybrid-north-2', viewpointId: 'entrance', x: 0.35, y: 0.36, width: 0.09, height: 0.14, yaw: -0.25, pitch: 0.05 },
    { slotId: 'hybrid-north-3', viewpointId: 'entrance', x: 0.50, y: 0.34, width: 0.10, height: 0.16, yaw: 0, pitch: 0.05 },
    { slotId: 'hybrid-north-4', viewpointId: 'entrance', x: 0.65, y: 0.36, width: 0.09, height: 0.14, yaw: 0.25, pitch: 0.05 },
    { slotId: 'hybrid-north-5', viewpointId: 'entrance', x: 0.80, y: 0.38, width: 0.08, height: 0.12, yaw: 0.5, pitch: 0.05 },
    
    // Center view - closer
    { slotId: 'hybrid-north-1', viewpointId: 'center', x: 0.15, y: 0.35, width: 0.10, height: 0.16, yaw: -0.6, pitch: 0.05 },
    { slotId: 'hybrid-north-2', viewpointId: 'center', x: 0.32, y: 0.33, width: 0.11, height: 0.18, yaw: -0.3, pitch: 0.05 },
    { slotId: 'hybrid-north-3', viewpointId: 'center', x: 0.50, y: 0.30, width: 0.14, height: 0.22, yaw: 0, pitch: 0.05 },
    { slotId: 'hybrid-north-4', viewpointId: 'center', x: 0.68, y: 0.33, width: 0.11, height: 0.18, yaw: 0.3, pitch: 0.05 },
    { slotId: 'hybrid-north-5', viewpointId: 'center', x: 0.85, y: 0.35, width: 0.10, height: 0.16, yaw: 0.6, pitch: 0.05 },
    
    // Forward view - closest
    { slotId: 'hybrid-north-1', viewpointId: 'forward', x: 0.08, y: 0.32, width: 0.12, height: 0.20, yaw: -0.8, pitch: 0.05 },
    { slotId: 'hybrid-north-2', viewpointId: 'forward', x: 0.28, y: 0.28, width: 0.14, height: 0.24, yaw: -0.35, pitch: 0.05 },
    { slotId: 'hybrid-north-3', viewpointId: 'forward', x: 0.50, y: 0.25, width: 0.18, height: 0.28, yaw: 0, pitch: 0.05 },
    { slotId: 'hybrid-north-4', viewpointId: 'forward', x: 0.72, y: 0.28, width: 0.14, height: 0.24, yaw: 0.35, pitch: 0.05 },
    { slotId: 'hybrid-north-5', viewpointId: 'forward', x: 0.92, y: 0.32, width: 0.12, height: 0.20, yaw: 0.8, pitch: 0.05 },

    // EAST WALL (visible from right view)
    { slotId: 'hybrid-east-1', viewpointId: 'right', x: 0.25, y: 0.35, width: 0.12, height: 0.18, yaw: -0.4, pitch: 0.05 },
    { slotId: 'hybrid-east-2', viewpointId: 'right', x: 0.45, y: 0.33, width: 0.14, height: 0.20, yaw: 0, pitch: 0.05 },
    { slotId: 'hybrid-east-3', viewpointId: 'right', x: 0.65, y: 0.35, width: 0.12, height: 0.18, yaw: 0.4, pitch: 0.05 },
    { slotId: 'hybrid-east-4', viewpointId: 'right', x: 0.80, y: 0.37, width: 0.10, height: 0.16, yaw: 0.7, pitch: 0.05 },

    // WEST WALL (visible from left view) - only 2 slots per user requirement
    { slotId: 'hybrid-west-1', viewpointId: 'left', x: 0.35, y: 0.33, width: 0.14, height: 0.20, yaw: -0.2, pitch: 0.05 },
    { slotId: 'hybrid-west-2', viewpointId: 'left', x: 0.60, y: 0.33, width: 0.14, height: 0.20, yaw: 0.3, pitch: 0.05 },

    // SOUTH WALL (visible from back view - looking at entrance)
    { slotId: 'hybrid-south-1', viewpointId: 'back', x: 0.25, y: 0.35, width: 0.10, height: 0.16, yaw: -0.4, pitch: 0.05 },
    { slotId: 'hybrid-south-2', viewpointId: 'back', x: 0.42, y: 0.33, width: 0.12, height: 0.18, yaw: -0.15, pitch: 0.05 },
    { slotId: 'hybrid-south-3', viewpointId: 'back', x: 0.58, y: 0.33, width: 0.12, height: 0.18, yaw: 0.15, pitch: 0.05 },
    { slotId: 'hybrid-south-4', viewpointId: 'back', x: 0.75, y: 0.35, width: 0.10, height: 0.16, yaw: 0.4, pitch: 0.05 }
  ]
};

export const getPanoramaViewpoint = (id: string): PanoramaViewpoint | undefined => {
  return hybridPanoramaConfig.viewpoints.find(v => v.id === id);
};

export const getSlotMappingsForViewpoint = (viewpointId: string): PanoramaSlotMapping[] => {
  return hybridPanoramaConfig.slotMappings.filter(m => m.viewpointId === viewpointId);
};
