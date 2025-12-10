import React, { useState, useEffect } from 'react';
import { Gallery360Scene } from './Gallery360Scene';
import { useHotspots } from './useHotspots';
import { useArtworkSlots, SlotAssignment } from './useArtworkSlots';
import { gallery360Presets, getPresetById } from '../../config/gallery360Presets';

interface Viewer360Props {
  exhibitionId: string;
  presetId?: string;
  initialAssignments?: SlotAssignment[];
  onArtworkClick?: (slotId: string, assignment: SlotAssignment) => void;
  className?: string;
}

export function Viewer360({
  exhibitionId,
  presetId = 'modern-gallery-v2',
  initialAssignments = [],
  onArtworkClick,
  className = ''
}: Viewer360Props) {
  const preset = getPresetById(presetId) || gallery360Presets[0];
  
  const { 
    currentViewpoint, 
    navigateToViewpoint 
  } = useHotspots(preset.viewpoints, preset.hotspots, 'entrance');
  
  const { 
    slotAssignments, 
    loadAssignments 
  } = useArtworkSlots(preset.slots);

  useEffect(() => {
    if (initialAssignments.length > 0) {
      loadAssignments(initialAssignments);
    }
  }, [initialAssignments, loadAssignments]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Gallery360Scene
        preset={preset}
        slotAssignments={slotAssignments}
        currentViewpoint={currentViewpoint}
        onNavigate={navigateToViewpoint}
        onArtworkClick={onArtworkClick}
        isEditor={false}
      />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg px-3 py-2">
        {preset.viewpoints.map(vp => (
          <button
            key={vp.id}
            onClick={() => navigateToViewpoint(vp.id)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              currentViewpoint.id === vp.id
                ? 'bg-[#C9A24A] text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {vp.label}
          </button>
        ))}
      </div>

      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
        <span className="opacity-70">Current view:</span> {currentViewpoint.label}
      </div>
    </div>
  );
}
