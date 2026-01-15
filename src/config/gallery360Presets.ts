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

export interface PartitionWall {
  id: string;
  position: [number, number, number];
  rotation: number;
  width: number;
  height: number;
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
  floorType?: 'solid' | 'wood' | 'tile' | 'concrete';
  wallType?: 'standard' | 'brick';
  hasPartitionWalls?: boolean;
  partitionWalls?: PartitionWall[];
  partitionWallColor?: string;
  viewpoints: Viewpoint[];
  hotspots: Hotspot[];
  slots: Slot[];
  renderMode?: '3D' | 'HYBRID_360';
}

export const gallery360Presets: Gallery360Preset[] = [
  // 1. Classic Gallery (DEFAULT - first position)
  {
    id: 'white-cube-v1',
    name: 'Classic Gallery',
    description: 'Contemporary museum space with gallery lighting and tiled floor',
    dimensions: { width: 20, height: 4.5, depth: 16 },
    wallColor: '#f5f2ed',
    floorColor: '#e8e4dc',
    ceilingColor: '#B0B0B0',
    floorType: 'tile',
    renderMode: '3D',
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
      // South Wall - artworks on sides, avoiding center portal (3.5m wide = ±1.75m from center)
      // Increased spacing: 3.5m center-to-center to prevent large artworks from touching
      { id: 'wall-south-1', wallId: 'south', position: [-7.75, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Left 1' },
      { id: 'wall-south-2', wallId: 'south', position: [-4.25, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Left 2' },
      { id: 'wall-south-3', wallId: 'south', position: [4.25, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Right 1' },
      { id: 'wall-south-4', wallId: 'south', position: [7.75, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Right 2' }
    ]
  },
  // 2. Modern Gallery
  {
    id: 'modern-gallery-v2',
    name: 'Modern Gallery',
    description: 'Contemporary minimalist gallery with natural daylight and skylights',
    dimensions: { width: 24, height: 5.5, depth: 18 },
    wallColor: '#E8E4E0',
    floorColor: '#B8B4AC',
    ceilingColor: '#F8F6F4',
    hasColumns: false,
    columnColor: '#D0CCC8',
    hasSkylights: true,
    floorType: 'concrete',
    hasPartitionWalls: true,
    partitionWalls: [
      { id: 'modern-partition-left', position: [-6, 1.6, 0], rotation: 0, width: 4, height: 3.2 },
      { id: 'modern-partition-right', position: [6, 1.6, 0], rotation: 0, width: 4, height: 3.2 },
    ],
    partitionWallColor: '#E0DCD8',
    renderMode: '3D',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.65, 8.7],
        lookAt: [0, 1.8, -9],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.65, 3],
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
      { id: 'partition-left-front', wallId: 'modern-partition-left', position: [-6, 1.6, 0.12], rotation: [0, 0, 0], width: 1.0, height: 0.8, label: 'Left Partition - Front' },
      { id: 'partition-left-back', wallId: 'modern-partition-left', position: [-6, 1.6, -0.12], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'Left Partition - Back' },
      { id: 'partition-right-front', wallId: 'modern-partition-right', position: [6, 1.6, 0.12], rotation: [0, 0, 0], width: 1.0, height: 0.8, label: 'Right Partition - Front' },
      { id: 'partition-right-back', wallId: 'modern-partition-right', position: [6, 1.6, -0.12], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'Right Partition - Back' }
    ]
  },
  // 3. Industrial Loft Gallery
  {
    id: 'industrial-loft',
    name: 'Industrial Loft Gallery',
    description: 'Industrial gallery with exposed brick, polished concrete and white partitions',
    dimensions: { width: 26, height: 6, depth: 18 },
    wallColor: '#C4A882',
    floorColor: '#D4D0C8',
    ceilingColor: '#F8F6F2',
    hasColumns: false,
    hasSkylights: false,
    floorType: 'concrete',
    wallType: 'brick',
    hasPartitionWalls: true,
    partitionWalls: [
      { id: 'partition-1', position: [-6, 1.65, -1], rotation: 0, width: 3.2, height: 3.3 },
      { id: 'partition-2', position: [6, 1.65, -1], rotation: 0, width: 3.2, height: 3.3 }
    ],
    partitionWallColor: '#FFFFFF',
    renderMode: '3D',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.65, 8.5],
        lookAt: [0, 1.8, -9],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.65, 2],
        lookAt: [0, 1.65, -9],
        label: 'Center'
      },
      {
        id: 'back-left',
        position: [-9, 1.65, -4],
        lookAt: [-13, 1.65, -4],
        label: 'Back Left'
      },
      {
        id: 'back-right',
        position: [9, 1.65, -4],
        lookAt: [13, 1.65, -4],
        label: 'Back Right'
      }
    ],
    hotspots: [
      { id: 'h1', position: [0, 0.1, 5], targetViewpoint: 'center', rotation: 0 },
      { id: 'h2', position: [0, 0.1, -2], targetViewpoint: 'entrance', rotation: Math.PI },
      { id: 'h3', position: [-7, 0.1, 3], targetViewpoint: 'back-left', rotation: -Math.PI / 4 },
      { id: 'h4', position: [7, 0.1, 3], targetViewpoint: 'back-right', rotation: Math.PI / 4 }
    ],
    slots: [
      // North Wall (brick) - 4 artworks with windows between
      { id: 'wall-north-1', wallId: 'north', position: [-9, 2.4, -8.95], rotation: [0, 0, 0], width: 1.2, height: 0.9, label: 'North Wall - Far Left' },
      { id: 'wall-north-2', wallId: 'north', position: [-3, 2.4, -8.95], rotation: [0, 0, 0], width: 1.4, height: 1.0, label: 'North Wall - Left' },
      { id: 'wall-north-3', wallId: 'north', position: [3, 2.4, -8.95], rotation: [0, 0, 0], width: 1.4, height: 1.0, label: 'North Wall - Right' },
      { id: 'wall-north-4', wallId: 'north', position: [9, 2.4, -8.95], rotation: [0, 0, 0], width: 1.2, height: 0.9, label: 'North Wall - Far Right' },
      // East Wall (brick) - 3 artworks between windows
      { id: 'wall-east-1', wallId: 'east', position: [12.95, 2.4, -5], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Upper' },
      { id: 'wall-east-2', wallId: 'east', position: [12.95, 2.4, 0], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Center' },
      { id: 'wall-east-3', wallId: 'east', position: [12.95, 2.4, 5], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Lower' },
      // West Wall (brick) - 3 artworks between windows
      { id: 'wall-west-1', wallId: 'west', position: [-12.95, 2.4, -5], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Upper' },
      { id: 'wall-west-2', wallId: 'west', position: [-12.95, 2.4, 0], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Center' },
      { id: 'wall-west-3', wallId: 'west', position: [-12.95, 2.4, 5], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Lower' },
      // Partition Wall 1 (left) - both sides
      { id: 'partition-1-front', wallId: 'partition-1', position: [-6, 1.65, -0.88], rotation: [0, 0, 0], width: 0.9, height: 0.7, label: 'Left Partition - Front' },
      { id: 'partition-1-back', wallId: 'partition-1', position: [-6, 1.65, -1.12], rotation: [0, Math.PI, 0], width: 0.9, height: 0.7, label: 'Left Partition - Back' },
      // Partition Wall 2 (right) - both sides  
      { id: 'partition-2-front', wallId: 'partition-2', position: [6, 1.65, -0.88], rotation: [0, 0, 0], width: 0.9, height: 0.7, label: 'Right Partition - Front' },
      { id: 'partition-2-back', wallId: 'partition-2', position: [6, 1.65, -1.12], rotation: [0, Math.PI, 0], width: 0.9, height: 0.7, label: 'Right Partition - Back' },
      // South Wall - avoiding entrance portal
      { id: 'wall-south-1', wallId: 'south', position: [-9, 2.4, 8.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'South Wall - Left' },
      { id: 'wall-south-2', wallId: 'south', position: [9, 2.4, 8.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'South Wall - Right' }
    ]
  },
  // 4. Daylight Atrium Gallery
  {
    id: 'daylight-atrium',
    name: 'Daylight Atrium Gallery',
    description: 'Bright, minimalist gallery with high ceilings and natural daylight atmosphere',
    dimensions: { width: 24, height: 6, depth: 18 },
    wallColor: '#F0EDE8',
    floorColor: '#E8E2D8',
    ceilingColor: '#FAFAF8',
    hasColumns: false,
    hasSkylights: false,
    floorType: 'wood',
    wallType: 'standard',
    hasPartitionWalls: true,
    partitionWalls: [
      { id: 'atrium-partition-left', position: [-5.5, 1.8, 0], rotation: 0, width: 3.5, height: 3.6 },
      { id: 'atrium-partition-right', position: [5.5, 1.8, 0], rotation: 0, width: 3.5, height: 3.6 }
    ],
    partitionWallColor: '#F5F3F0',
    renderMode: '3D',
    viewpoints: [
      {
        id: 'entrance',
        position: [0, 1.65, 8.5],
        lookAt: [0, 1.8, -9],
        label: 'Entrance'
      },
      {
        id: 'center',
        position: [0, 1.65, 2],
        lookAt: [0, 1.65, -9],
        label: 'Center'
      },
      {
        id: 'back-left',
        position: [-8, 1.65, -4],
        lookAt: [-12, 1.65, -4],
        label: 'Back Left'
      },
      {
        id: 'back-right',
        position: [8, 1.65, -4],
        lookAt: [12, 1.65, -4],
        label: 'Back Right'
      }
    ],
    hotspots: [
      { id: 'h1', position: [0, 0.1, 5], targetViewpoint: 'center', rotation: 0 },
      { id: 'h2', position: [0, 0.1, -2], targetViewpoint: 'entrance', rotation: Math.PI },
      { id: 'h3', position: [-6, 0.1, 3], targetViewpoint: 'back-left', rotation: -Math.PI / 4 },
      { id: 'h4', position: [6, 0.1, 3], targetViewpoint: 'back-right', rotation: Math.PI / 4 },
      { id: 'h5', position: [-4, 0.1, -3], targetViewpoint: 'back-left', rotation: Math.PI / 2 },
      { id: 'h6', position: [4, 0.1, -3], targetViewpoint: 'back-right', rotation: -Math.PI / 2 }
    ],
    slots: [
      // North Wall (far/back wall) - 4 artworks with tighter spacing, larger scale for readability
      { id: 'wall-north-1', wallId: 'north', position: [-6, 2.2, -8.95], rotation: [0, 0, 0], width: 1.5, height: 1.1, label: 'North Wall - Far Left' },
      { id: 'wall-north-2', wallId: 'north', position: [-2, 2.2, -8.95], rotation: [0, 0, 0], width: 1.75, height: 1.25, label: 'North Wall - Left' },
      { id: 'wall-north-3', wallId: 'north', position: [2, 2.2, -8.95], rotation: [0, 0, 0], width: 1.75, height: 1.25, label: 'North Wall - Right' },
      { id: 'wall-north-4', wallId: 'north', position: [6, 2.2, -8.95], rotation: [0, 0, 0], width: 1.5, height: 1.1, label: 'North Wall - Far Right' },
      // East Wall - 3 artworks
      { id: 'wall-east-1', wallId: 'east', position: [11.95, 2.2, -4], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Upper' },
      { id: 'wall-east-2', wallId: 'east', position: [11.95, 2.2, 1], rotation: [0, -Math.PI / 2, 0], width: 1.3, height: 1.0, label: 'East Wall - Center' },
      { id: 'wall-east-3', wallId: 'east', position: [11.95, 2.2, 6], rotation: [0, -Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'East Wall - Lower' },
      // West Wall - 3 artworks
      { id: 'wall-west-1', wallId: 'west', position: [-11.95, 2.2, -4], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Upper' },
      { id: 'wall-west-2', wallId: 'west', position: [-11.95, 2.2, 1], rotation: [0, Math.PI / 2, 0], width: 1.3, height: 1.0, label: 'West Wall - Center' },
      { id: 'wall-west-3', wallId: 'west', position: [-11.95, 2.2, 6], rotation: [0, Math.PI / 2, 0], width: 1.2, height: 0.9, label: 'West Wall - Lower' },
      // Partition Wall Left - both sides
      { id: 'atrium-partition-left-front', wallId: 'atrium-partition-left', position: [-5.5, 1.8, 0.12], rotation: [0, 0, 0], width: 1.0, height: 0.8, label: 'Left Partition - Front' },
      { id: 'atrium-partition-left-back', wallId: 'atrium-partition-left', position: [-5.5, 1.8, -0.12], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'Left Partition - Back' },
      // Partition Wall Right - both sides
      { id: 'atrium-partition-right-front', wallId: 'atrium-partition-right', position: [5.5, 1.8, 0.12], rotation: [0, 0, 0], width: 1.0, height: 0.8, label: 'Right Partition - Front' },
      { id: 'atrium-partition-right-back', wallId: 'atrium-partition-right', position: [5.5, 1.8, -0.12], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'Right Partition - Back' },
      // South Wall - avoiding entrance portal
      { id: 'wall-south-1', wallId: 'south', position: [-8, 2.2, 8.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'South Wall - Left' },
      { id: 'wall-south-2', wallId: 'south', position: [8, 2.2, 8.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.8, label: 'South Wall - Right' }
    ]
  },
  // 5. Hybrid Studio Gallery (experimental) - panorama-based Street-View style renderer
  {
    id: 'hybrid-studio',
    name: 'Hybrid Studio Gallery',
    description: 'Immersive panorama gallery with Street-View style navigation',
    dimensions: { width: 20, height: 4.5, depth: 16 },
    wallColor: '#F5F3F0',
    floorColor: '#E0DCD8',
    ceilingColor: '#FAFAF8',
    floorType: 'solid',
    wallType: 'standard',
    hasSkylights: false,
    hasColumns: false,
    hasPartitionWalls: false,
    renderMode: 'HYBRID_360',
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
      // North Wall - 5 artworks (compatible with Classic layout, unique IDs)
      { id: 'hybrid-north-1', wallId: 'north', position: [-6, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 1' },
      { id: 'hybrid-north-2', wallId: 'north', position: [-3, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 2' },
      { id: 'hybrid-north-3', wallId: 'north', position: [0, 2.0, -7.95], rotation: [0, 0, 0], width: 1.2, height: 0.9, label: 'North Wall - 3' },
      { id: 'hybrid-north-4', wallId: 'north', position: [3, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 4' },
      { id: 'hybrid-north-5', wallId: 'north', position: [6, 2.0, -7.95], rotation: [0, 0, 0], width: 1.0, height: 0.75, label: 'North Wall - 5' },
      // East Wall - 4 artworks
      { id: 'hybrid-east-1', wallId: 'east', position: [9.95, 2.0, -4.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 1' },
      { id: 'hybrid-east-2', wallId: 'east', position: [9.95, 2.0, -1.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 2' },
      { id: 'hybrid-east-3', wallId: 'east', position: [9.95, 2.0, 1.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 3' },
      { id: 'hybrid-east-4', wallId: 'east', position: [9.95, 2.0, 4.5], rotation: [0, -Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'East Wall - 4' },
      // West Wall - 2 artworks
      { id: 'hybrid-west-1', wallId: 'west', position: [-9.95, 2.0, -3], rotation: [0, Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'West Wall - 1' },
      { id: 'hybrid-west-2', wallId: 'west', position: [-9.95, 2.0, 1], rotation: [0, Math.PI / 2, 0], width: 1.0, height: 0.75, label: 'West Wall - 2' },
      // South Wall - artworks on sides, avoiding center portal
      { id: 'hybrid-south-1', wallId: 'south', position: [-7.75, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Left 1' },
      { id: 'hybrid-south-2', wallId: 'south', position: [-4.25, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Left 2' },
      { id: 'hybrid-south-3', wallId: 'south', position: [4.25, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Right 1' },
      { id: 'hybrid-south-4', wallId: 'south', position: [7.75, 2.0, 7.95], rotation: [0, Math.PI, 0], width: 1.0, height: 0.75, label: 'South Wall - Right 2' }
    ]
  }
];

// Default gallery preset ID (Classic Gallery is default)
export const DEFAULT_GALLERY_PRESET_ID = 'white-cube-v1';

export const getPresetById = (id: string): Gallery360Preset | undefined => {
  return gallery360Presets.find(p => p.id === id);
};

export const getDefaultPreset = (): Gallery360Preset => {
  return gallery360Presets[0]; // Classic Gallery is always first
};
