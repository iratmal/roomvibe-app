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
    name: 'Modern Gallery',
    description: 'Contemporary museum space with warm walls and modern ceiling',
    dimensions: { width: 18, height: 4.2, depth: 14 },
    wallColor: '#ddd8d0',
    floorColor: '#c4b8a8',
    ceilingColor: '#f0ede8',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.65, 5],
        lookAt: [0, 1.7, -6],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.65, 0],
        lookAt: [0, 1.7, -6.5],
        label: 'Center'
      },
      {
        id: 'back-left',
        position: [-5, 1.65, -3],
        lookAt: [8, 1.7, 0],
        label: 'Back Left'
      },
      {
        id: 'back-right',
        position: [5, 1.65, -3],
        lookAt: [-8, 1.7, 0],
        label: 'Back Right'
      }
    ],
    hotspots: [
      { id: 'h1', position: [0, 0.1, 2.5], targetViewpoint: 'center', rotation: 0 },
      { id: 'h2', position: [0, 0.1, -2.5], targetViewpoint: 'entrance', rotation: Math.PI },
      { id: 'h3', position: [-3.5, 0.1, -1.5], targetViewpoint: 'back-left', rotation: -Math.PI / 4 },
      { id: 'h4', position: [3.5, 0.1, -1.5], targetViewpoint: 'back-right', rotation: Math.PI / 4 },
      { id: 'h5', position: [0, 0.1, 0], targetViewpoint: 'center', rotation: Math.PI },
      { id: 'h6', position: [-3, 0.1, 1.5], targetViewpoint: 'back-left', rotation: Math.PI / 2 },
      { id: 'h7', position: [3, 0.1, 1.5], targetViewpoint: 'back-right', rotation: -Math.PI / 2 }
    ],
    slots: [
      { id: 'wall-north-1', wallId: 'north', position: [-5.5, 1.9, -6.95], rotation: [0, 0, 0], width: 1.8, height: 1.4, label: 'North Wall - Left' },
      { id: 'wall-north-2', wallId: 'north', position: [0, 1.9, -6.95], rotation: [0, 0, 0], width: 2.2, height: 1.8, label: 'North Wall - Center' },
      { id: 'wall-north-3', wallId: 'north', position: [5.5, 1.9, -6.95], rotation: [0, 0, 0], width: 1.8, height: 1.4, label: 'North Wall - Right' },
      { id: 'wall-east-1', wallId: 'east', position: [8.95, 1.9, -3], rotation: [0, -Math.PI / 2, 0], width: 1.8, height: 1.4, label: 'East Wall - Upper' },
      { id: 'wall-east-2', wallId: 'east', position: [8.95, 1.9, 3], rotation: [0, -Math.PI / 2, 0], width: 1.8, height: 1.4, label: 'East Wall - Lower' },
      { id: 'wall-west-1', wallId: 'west', position: [-8.95, 1.9, -3], rotation: [0, Math.PI / 2, 0], width: 1.8, height: 1.4, label: 'West Wall - Upper' },
      { id: 'wall-west-2', wallId: 'west', position: [-8.95, 1.9, 3], rotation: [0, Math.PI / 2, 0], width: 1.8, height: 1.4, label: 'West Wall - Lower' },
      { id: 'wall-south-1', wallId: 'south', position: [0, 1.9, 6.95], rotation: [0, Math.PI, 0], width: 2.5, height: 1.8, label: 'South Wall - Center' }
    ]
  }
];

export const getPresetById = (id: string): Gallery360Preset | undefined => {
  return gallery360Presets.find(p => p.id === id);
};
