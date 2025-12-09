export interface Slot {
  id: string;
  wallId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  label: string;
}

export interface Viewpoint {
  id: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  label: string;
}

export interface Hotspot {
  id: string;
  position: [number, number, number];
  targetViewpoint: string;
  rotation: number;
}

export interface Gallery360Preset {
  id: string;
  name: string;
  description: string;
  dimensions: { width: number; height: number; depth: number };
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  viewpoints: Viewpoint[];
  hotspots: Hotspot[];
  slots: Slot[];
}

export const gallery360Presets: Gallery360Preset[] = [
  {
    id: 'white-cube-v1',
    name: 'White Cube Gallery',
    description: 'Classic minimalist gallery space with clean white walls',
    dimensions: { width: 14, height: 4, depth: 10 },
    wallColor: '#fafafa',
    floorColor: '#e8e8e8',
    ceilingColor: '#ffffff',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.6, 3.5],
        lookAt: [0, 1.8, -4],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.6, 0],
        lookAt: [0, 1.8, -4.5],
        label: 'Center'
      },
      {
        id: 'back-left',
        position: [-3.5, 1.6, -2],
        lookAt: [6, 1.8, 0],
        label: 'Back Left'
      },
      {
        id: 'back-right',
        position: [3.5, 1.6, -2],
        lookAt: [-6, 1.8, 0],
        label: 'Back Right'
      }
    ],
    hotspots: [
      { id: 'h1', position: [0, 0.1, 1.5], targetViewpoint: 'center', rotation: 0 },
      { id: 'h2', position: [0, 0.1, -1.5], targetViewpoint: 'entrance', rotation: Math.PI },
      { id: 'h3', position: [-2.5, 0.1, -1], targetViewpoint: 'back-left', rotation: -Math.PI / 4 },
      { id: 'h4', position: [2.5, 0.1, -1], targetViewpoint: 'back-right', rotation: Math.PI / 4 },
      { id: 'h5', position: [0, 0.1, 0], targetViewpoint: 'center', rotation: Math.PI },
      { id: 'h6', position: [-2, 0.1, 1], targetViewpoint: 'back-left', rotation: Math.PI / 2 },
      { id: 'h7', position: [2, 0.1, 1], targetViewpoint: 'back-right', rotation: -Math.PI / 2 }
    ],
    slots: [
      { id: 'wall-north-1', wallId: 'north', position: [-4, 2, -4.95], rotation: [0, 0, 0], width: 2, height: 1.5, label: 'North Wall - Left' },
      { id: 'wall-north-2', wallId: 'north', position: [0, 2, -4.95], rotation: [0, 0, 0], width: 2.5, height: 2, label: 'North Wall - Center' },
      { id: 'wall-north-3', wallId: 'north', position: [4, 2, -4.95], rotation: [0, 0, 0], width: 2, height: 1.5, label: 'North Wall - Right' },
      { id: 'wall-east-1', wallId: 'east', position: [6.95, 2, -2], rotation: [0, -Math.PI / 2, 0], width: 2, height: 1.5, label: 'East Wall - Upper' },
      { id: 'wall-east-2', wallId: 'east', position: [6.95, 2, 2], rotation: [0, -Math.PI / 2, 0], width: 2, height: 1.5, label: 'East Wall - Lower' },
      { id: 'wall-west-1', wallId: 'west', position: [-6.95, 2, -2], rotation: [0, Math.PI / 2, 0], width: 2, height: 1.5, label: 'West Wall - Upper' },
      { id: 'wall-west-2', wallId: 'west', position: [-6.95, 2, 2], rotation: [0, Math.PI / 2, 0], width: 2, height: 1.5, label: 'West Wall - Lower' },
      { id: 'wall-south-1', wallId: 'south', position: [0, 2, 4.95], rotation: [0, Math.PI, 0], width: 3, height: 2, label: 'South Wall - Center' }
    ]
  }
];

export const getPresetById = (id: string): Gallery360Preset | undefined => {
  return gallery360Presets.find(p => p.id === id);
};
