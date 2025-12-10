import { useState, useCallback } from 'react';
import { Slot } from '../../config/gallery360Presets';

export interface SlotAssignment {
  slotId: string;
  artworkId: string | null;
  artworkUrl?: string;
  artworkTitle?: string;
  artistName?: string;
  width?: number;
  height?: number;
  priceAmount?: number | null;
  priceCurrency?: string;
  buyUrl?: string | null;
  description?: string | null;
}

export interface UseArtworkSlotsResult {
  slotAssignments: SlotAssignment[];
  assignArtwork: (slotId: string, artworkId: string | null, artworkData?: Partial<SlotAssignment>) => void;
  getAssignment: (slotId: string) => SlotAssignment | undefined;
  clearSlot: (slotId: string) => void;
  clearAllSlots: () => void;
  loadAssignments: (assignments: SlotAssignment[]) => void;
  resetToSlots: (newSlots: Slot[]) => void;
}

export function useArtworkSlots(slots: Slot[]): UseArtworkSlotsResult {
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignment[]>(
    slots.map(slot => ({ slotId: slot.id, artworkId: null }))
  );

  const assignArtwork = useCallback((
    slotId: string, 
    artworkId: string | null, 
    artworkData?: Partial<SlotAssignment>
  ) => {
    setSlotAssignments(prev => 
      prev.map(sa => 
        sa.slotId === slotId 
          ? { ...sa, artworkId, ...artworkData }
          : sa
      )
    );
  }, []);

  const getAssignment = useCallback((slotId: string) => {
    return slotAssignments.find(sa => sa.slotId === slotId);
  }, [slotAssignments]);

  const clearSlot = useCallback((slotId: string) => {
    setSlotAssignments(prev => 
      prev.map(sa => 
        sa.slotId === slotId 
          ? { slotId, artworkId: null }
          : sa
      )
    );
  }, []);

  const clearAllSlots = useCallback(() => {
    setSlotAssignments(slots.map(slot => ({ slotId: slot.id, artworkId: null })));
  }, [slots]);

  const loadAssignments = useCallback((assignments: SlotAssignment[]) => {
    setSlotAssignments(prev => 
      prev.map(existing => {
        const loaded = assignments.find(a => a.slotId === existing.slotId);
        return loaded || existing;
      })
    );
  }, []);

  const resetToSlots = useCallback((newSlots: Slot[]) => {
    setSlotAssignments(newSlots.map(slot => ({ slotId: slot.id, artworkId: null })));
  }, []);

  return {
    slotAssignments,
    assignArtwork,
    getAssignment,
    clearSlot,
    clearAllSlots,
    loadAssignments,
    resetToSlots
  };
}
