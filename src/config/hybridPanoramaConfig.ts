export interface PanoramaViewpoint {
  id: string;
  label: string;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  panoramaUrl?: string; // Optional: URL to equirectangular panorama image (2:1 aspect ratio)
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

// Panorama URLs for each viewpoint (equirectangular 2:1 images)
// Set to undefined to use generated placeholder, or provide URL to custom panorama
export const HYBRID_PANORAMA_URLS: Record<string, string | undefined> = {
  'entrance': undefined,   // Will use placeholder - replace with actual panorama URL
  'center': undefined,     // Will use placeholder - replace with actual panorama URL
  'back-left': undefined,  // Will use placeholder - replace with actual panorama URL
  'back-right': undefined, // Will use placeholder - replace with actual panorama URL
};

export const hybridPanoramaConfig: HybridPanoramaConfig = {
  viewpoints: [
    {
      id: 'entrance',
      label: 'Entrance',
      initialYaw: 0,
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: HYBRID_PANORAMA_URLS['entrance']
    },
    {
      id: 'center',
      label: 'Center',
      initialYaw: 0,
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: HYBRID_PANORAMA_URLS['center']
    },
    {
      id: 'back-left',
      label: 'Back Left',
      initialYaw: -Math.PI / 4,
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: HYBRID_PANORAMA_URLS['back-left']
    },
    {
      id: 'back-right',
      label: 'Back Right',
      initialYaw: Math.PI / 4,
      initialPitch: 0,
      initialFov: Math.PI / 2,
      panoramaUrl: HYBRID_PANORAMA_URLS['back-right']
    }
  ],
  slotMappings: [
    { slotId: 'hybrid-north-1', viewpointId: 'entrance', x: 0.15, y: 0.35, width: 0.10, height: 0.15, yaw: -0.6, pitch: 0.05 },
    { slotId: 'hybrid-north-2', viewpointId: 'entrance', x: 0.28, y: 0.35, width: 0.10, height: 0.15, yaw: -0.3, pitch: 0.05 },
    { slotId: 'hybrid-north-3', viewpointId: 'entrance', x: 0.45, y: 0.32, width: 0.12, height: 0.18, yaw: 0, pitch: 0.05 },
    { slotId: 'hybrid-north-4', viewpointId: 'entrance', x: 0.62, y: 0.35, width: 0.10, height: 0.15, yaw: 0.3, pitch: 0.05 },
    { slotId: 'hybrid-north-5', viewpointId: 'entrance', x: 0.75, y: 0.35, width: 0.10, height: 0.15, yaw: 0.6, pitch: 0.05 },
    
    { slotId: 'hybrid-north-1', viewpointId: 'center', x: 0.12, y: 0.30, width: 0.12, height: 0.18, yaw: -0.5, pitch: 0.08 },
    { slotId: 'hybrid-north-2', viewpointId: 'center', x: 0.28, y: 0.30, width: 0.12, height: 0.18, yaw: -0.25, pitch: 0.08 },
    { slotId: 'hybrid-north-3', viewpointId: 'center', x: 0.45, y: 0.28, width: 0.14, height: 0.20, yaw: 0, pitch: 0.08 },
    { slotId: 'hybrid-north-4', viewpointId: 'center', x: 0.62, y: 0.30, width: 0.12, height: 0.18, yaw: 0.25, pitch: 0.08 },
    { slotId: 'hybrid-north-5', viewpointId: 'center', x: 0.78, y: 0.30, width: 0.12, height: 0.18, yaw: 0.5, pitch: 0.08 },
    
    { slotId: 'hybrid-east-1', viewpointId: 'entrance', x: 0.88, y: 0.35, width: 0.08, height: 0.12, yaw: 1.2, pitch: 0.05 },
    { slotId: 'hybrid-east-2', viewpointId: 'entrance', x: 0.90, y: 0.40, width: 0.08, height: 0.12, yaw: 1.4, pitch: 0.02 },
    { slotId: 'hybrid-east-3', viewpointId: 'center', x: 0.92, y: 0.35, width: 0.10, height: 0.15, yaw: 1.3, pitch: 0.05 },
    { slotId: 'hybrid-east-4', viewpointId: 'center', x: 0.94, y: 0.40, width: 0.10, height: 0.15, yaw: 1.5, pitch: 0.02 },
    
    { slotId: 'hybrid-west-1', viewpointId: 'entrance', x: 0.02, y: 0.35, width: 0.08, height: 0.12, yaw: -1.2, pitch: 0.05 },
    { slotId: 'hybrid-west-2', viewpointId: 'entrance', x: 0.04, y: 0.40, width: 0.08, height: 0.12, yaw: -1.4, pitch: 0.02 },
    { slotId: 'hybrid-west-3', viewpointId: 'center', x: 0.02, y: 0.35, width: 0.10, height: 0.15, yaw: -1.3, pitch: 0.05 },
    { slotId: 'hybrid-west-4', viewpointId: 'center', x: 0.04, y: 0.40, width: 0.10, height: 0.15, yaw: -1.5, pitch: 0.02 },
    
    { slotId: 'hybrid-south-1', viewpointId: 'back-left', x: 0.20, y: 0.35, width: 0.10, height: 0.15, yaw: -0.4, pitch: 0.05 },
    { slotId: 'hybrid-south-2', viewpointId: 'back-left', x: 0.35, y: 0.35, width: 0.10, height: 0.15, yaw: -0.1, pitch: 0.05 },
    { slotId: 'hybrid-south-3', viewpointId: 'back-right', x: 0.55, y: 0.35, width: 0.10, height: 0.15, yaw: 0.1, pitch: 0.05 },
    { slotId: 'hybrid-south-4', viewpointId: 'back-right', x: 0.70, y: 0.35, width: 0.10, height: 0.15, yaw: 0.4, pitch: 0.05 }
  ]
};

export const getPanoramaViewpoint = (id: string): PanoramaViewpoint | undefined => {
  return hybridPanoramaConfig.viewpoints.find(v => v.id === id);
};

export const getSlotMappingsForViewpoint = (viewpointId: string): PanoramaSlotMapping[] => {
  return hybridPanoramaConfig.slotMappings.filter(m => m.viewpointId === viewpointId);
};
