export interface HybridSlotPosition {
  slotId: string;
  viewpointId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HybridStudioSlotsConfig {
  entrance: HybridSlotPosition[];
  center: HybridSlotPosition[];
  'back-left': HybridSlotPosition[];
  'back-right': HybridSlotPosition[];
}

export const hybridStudioSlots: HybridStudioSlotsConfig = {
  entrance: [
    { slotId: 'hybrid-north-1', viewpointId: 'entrance', x: 0.22, y: 0.42, width: 0.07, height: 0.11 },
    { slotId: 'hybrid-north-2', viewpointId: 'entrance', x: 0.34, y: 0.42, width: 0.08, height: 0.12 },
    { slotId: 'hybrid-north-3', viewpointId: 'entrance', x: 0.50, y: 0.42, width: 0.10, height: 0.14 },
    { slotId: 'hybrid-north-4', viewpointId: 'entrance', x: 0.66, y: 0.42, width: 0.08, height: 0.12 },
    { slotId: 'hybrid-north-5', viewpointId: 'entrance', x: 0.78, y: 0.42, width: 0.07, height: 0.11 },

    { slotId: 'hybrid-east-1', viewpointId: 'entrance', x: 0.92, y: 0.40, width: 0.05, height: 0.08 },
    { slotId: 'hybrid-east-2', viewpointId: 'entrance', x: 0.94, y: 0.46, width: 0.05, height: 0.08 },

    { slotId: 'hybrid-west-1', viewpointId: 'entrance', x: 0.08, y: 0.40, width: 0.05, height: 0.08 },
    { slotId: 'hybrid-west-2', viewpointId: 'entrance', x: 0.06, y: 0.46, width: 0.05, height: 0.08 },
  ],

  center: [
    { slotId: 'hybrid-north-1', viewpointId: 'center', x: 0.18, y: 0.38, width: 0.09, height: 0.13 },
    { slotId: 'hybrid-north-2', viewpointId: 'center', x: 0.33, y: 0.38, width: 0.10, height: 0.14 },
    { slotId: 'hybrid-north-3', viewpointId: 'center', x: 0.50, y: 0.38, width: 0.12, height: 0.16 },
    { slotId: 'hybrid-north-4', viewpointId: 'center', x: 0.67, y: 0.38, width: 0.10, height: 0.14 },
    { slotId: 'hybrid-north-5', viewpointId: 'center', x: 0.82, y: 0.38, width: 0.09, height: 0.13 },

    { slotId: 'hybrid-east-1', viewpointId: 'center', x: 0.88, y: 0.36, width: 0.06, height: 0.10 },
    { slotId: 'hybrid-east-2', viewpointId: 'center', x: 0.90, y: 0.42, width: 0.06, height: 0.10 },
    { slotId: 'hybrid-east-3', viewpointId: 'center', x: 0.92, y: 0.48, width: 0.06, height: 0.10 },
    { slotId: 'hybrid-east-4', viewpointId: 'center', x: 0.94, y: 0.54, width: 0.05, height: 0.08 },

    { slotId: 'hybrid-west-1', viewpointId: 'center', x: 0.12, y: 0.36, width: 0.06, height: 0.10 },
    { slotId: 'hybrid-west-2', viewpointId: 'center', x: 0.10, y: 0.42, width: 0.06, height: 0.10 },
  ],

  'back-left': [
    { slotId: 'hybrid-south-1', viewpointId: 'back-left', x: 0.35, y: 0.40, width: 0.08, height: 0.12 },
    { slotId: 'hybrid-south-2', viewpointId: 'back-left', x: 0.50, y: 0.40, width: 0.08, height: 0.12 },

    { slotId: 'hybrid-west-1', viewpointId: 'back-left', x: 0.78, y: 0.40, width: 0.07, height: 0.11 },
    { slotId: 'hybrid-west-2', viewpointId: 'back-left', x: 0.88, y: 0.40, width: 0.06, height: 0.10 },
  ],

  'back-right': [
    { slotId: 'hybrid-south-3', viewpointId: 'back-right', x: 0.50, y: 0.40, width: 0.08, height: 0.12 },
    { slotId: 'hybrid-south-4', viewpointId: 'back-right', x: 0.65, y: 0.40, width: 0.08, height: 0.12 },

    { slotId: 'hybrid-east-1', viewpointId: 'back-right', x: 0.22, y: 0.40, width: 0.07, height: 0.11 },
    { slotId: 'hybrid-east-2', viewpointId: 'back-right', x: 0.12, y: 0.40, width: 0.06, height: 0.10 },
  ],
};

export function getHybridSlotsForViewpoint(viewpointId: string): HybridSlotPosition[] {
  return hybridStudioSlots[viewpointId as keyof HybridStudioSlotsConfig] || [];
}

export const HYBRID_SLOT_DEBUG = {
  showBoundingBoxes: false,
};
