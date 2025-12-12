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
  hasColumns?: boolean;
  columnColor?: string;
  hasSkylights?: boolean;
  floorType?: 'solid' | 'wood' | 'tile';
  viewpoints: Viewpoint[];
  hotspots: Hotspot[];
  slots: Slot[];
}

export const gallery360Presets: Gallery360Preset[] = [
  {
    id: 'modern-gallery-v2',
    name: 'Modern Gallery',
    description: 'High-realism museum space with skylights, columns, and wood floor',
    dimensions: { width: 24, height: 6.5, depth: 18 },
    wallColor: '#f5f5f5',
    floorColor: '#8B7355',
    ceilingColor: '#fafafa',
    hasColumns: true,
    columnColor: '#1a1a1a',
    hasSkylights: true,
    floorType: 'wood',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.65, 8.5],
        lookAt: [0, 1.65, -9],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.65, 0],
        lookAt: [0, 1.65, -9],
        label: 'Center'
      },
      {
        id: 'back-left',
        position: [-7, 1.65, -4],
        lookAt: [-12, 1.65, -4],
        label: 'Back Left'
      },
      {
        id: 'back-right',
        position: [7, 1.65, -4],
        lookAt: [12, 1.65, -4],
        label: 'Back Right'
      }
    ],
    hotspots: [
      { id: 'h1', position: [0, 0.1, 3.5], targetViewpoint: 'center', rotation: 0 },
      { id: 'h2', position: [0, 0.1, -3.5], targetViewpoint: 'entrance', rotation: Math.PI },
      { id: 'h3', position: [-5, 0.1, -2], targetViewpoint: 'back-left', rotation: -Math.PI / 4 },
      { id: 'h4', position: [5, 0.1, -2], targetViewpoint: 'back-right', rotation: Math.PI / 4 },
      { id: 'h5', position: [0, 0.1, 0], targetViewpoint: 'center', rotation: Math.PI },
      { id: 'h6', position: [-4, 0.1, 2], targetViewpoint: 'back-left', rotation: Math.PI / 2 },
      { id: 'h7', position: [4, 0.1, 2], targetViewpoint: 'back-right', rotation: -Math.PI / 2 }
    ],
    slots: [
      { id: 'wall-north-1', wallId: 'north', position: [-7, 1.6, -8.95], rotation: [0, 0, 0], width: 1.2, height: 0.9, label: 'North Wall - Left' },
      { id: 'wall-north-2', wallId: 'north', position: [0, 1.6, -8.95], rotation: [0, 0, 0], width: 1.5, height: 1.1, label: 'North Wall - Center' },
      { id: 'wall-north-3', wallId: 'north', position: [7, 1.6, -8.95], rotation: [0, 0, 0], width: 1.2, height: 0.9, label: 'North Wall - Right' },
      { id: 'wall-east-1', wallId: 'east', position: [11.95, 1.6, -4], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Upper' },
      { id: 'wall-east-2', wallId: 'east', position: [11.95, 1.6, 4], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Lower' },
      { id: 'wall-west-1', wallId: 'west', position: [-11.95, 1.6, -4], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Upper' },
      { id: 'wall-west-2', wallId: 'west', position: [-11.95, 1.6, 4], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Lower' },
      { id: 'wall-south-1', wallId: 'south', position: [0, 1.6, 8.95], rotation: [0, Math.PI, 0], width: 1.5, height: 1.1, label: 'South Wall - Center' }
    ]
  },
  {
    id: 'white-cube-v1',
    name: 'Classic Gallery',
    description: 'Contemporary museum space with gallery lighting and tiled floor',
    dimensions: { width: 20, height: 4.5, depth: 16 },
    wallColor: '#f5f2ed',
    floorColor: '#e8e4dc',
    ceilingColor: '#B0B0B0',
    floorType: 'tile',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.65, 6],
        lookAt: [0, 1.65, -8],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.65, 0],
        lookAt: [0, 1.65, -8],
        label: 'Center'
      },
      {
        id: 'back-left',
        position: [-6, 1.65, -4],
        lookAt: [-10, 1.65, -4],
        label: 'Back Left'
      },
      {
        id: 'back-right',
        position: [6, 1.65, -4],
        lookAt: [10, 1.65, -4],
        label: 'Back Right'
      }
    ],
    hotspots: [
      { id: 'h1', position: [0, 0.1, 3], targetViewpoint: 'center', rotation: 0 },
      { id: 'h2', position: [0, 0.1, -3], targetViewpoint: 'entrance', rotation: Math.PI },
      { id: 'h3', position: [-4, 0.1, -2], targetViewpoint: 'back-left', rotation: -Math.PI / 4 },
      { id: 'h4', position: [4, 0.1, -2], targetViewpoint: 'back-right', rotation: Math.PI / 4 },
      { id: 'h5', position: [0, 0.1, 0], targetViewpoint: 'center', rotation: Math.PI },
      { id: 'h6', position: [-3.5, 0.1, 2], targetViewpoint: 'back-left', rotation: Math.PI / 2 },
      { id: 'h7', position: [3.5, 0.1, 2], targetViewpoint: 'back-right', rotation: -Math.PI / 2 }
    ],
    slots: [
      // North Wall - 5 artworks (1.0m wide + 0.5m gap = 1.5m center-to-center)
      { id: 'wall-north-1', wallId: 'north', position: [-6, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 1' },
      { id: 'wall-north-2', wallId: 'north', position: [-3, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 2' },
      { id: 'wall-north-3', wallId: 'north', position: [0, 2.0, -7.95], rotation: [0, 0, 0], width: 1.2, height: 0.9, label: 'North Wall - 3' },
      { id: 'wall-north-4', wallId: 'north', position: [3, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 4' },
      { id: 'wall-north-5', wallId: 'north', position: [6, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 5' },
      // East Wall - 4 artworks (1.0m wide + 0.5m gap = 1.5m center-to-center)
      { id: 'wall-east-1', wallId: 'east', position: [9.95, 2.0, -4.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 1' },
      { id: 'wall-east-2', wallId: 'east', position: [9.95, 2.0, -1.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 2' },
      { id: 'wall-east-3', wallId: 'east', position: [9.95, 2.0, 1.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 3' },
      { id: 'wall-east-4', wallId: 'east', position: [9.95, 2.0, 4.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 4' },
      // West Wall - 4 artworks (1.0m wide + 0.5m gap = 1.5m center-to-center)
      { id: 'wall-west-1', wallId: 'west', position: [-9.95, 2.0, -4.5], rotation: [0, Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'West Wall - 1' },
      { id: 'wall-west-2', wallId: 'west', position: [-9.95, 2.0, -1.5], rotation: [0, Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'West Wall - 2' },
      { id: 'wall-west-3', wallId: 'west', position: [-9.95, 2.0, 1.5], rotation: [0, Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'West Wall - 3' },
      { id: 'wall-west-4', wallId: 'west', position: [-9.95, 2.0, 4.5], rotation: [0, Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'West Wall - 4' },
      // South Wall - 5 artworks (1.0m wide + 0.5m gap = 1.5m center-to-center)
      { id: 'wall-south-1', wallId: 'south', position: [-6, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - 1' },
      { id: 'wall-south-2', wallId: 'south', position: [-3, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - 2' },
      { id: 'wall-south-3', wallId: 'south', position: [0, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.2, height: 0.9, label: 'South Wall - 3' },
      { id: 'wall-south-4', wallId: 'south', position: [3, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - 4' },
      { id: 'wall-south-5', wallId: 'south', position: [6, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - 5' }
    ]
  }
];

export const getPresetById = (id: string): Gallery360Preset | undefined => {
  return gallery360Presets.find(p => p.id === id);
};
