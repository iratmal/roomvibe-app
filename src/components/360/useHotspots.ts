import { useState, useCallback } from 'react';
import { Viewpoint, Hotspot } from '../../config/gallery360Presets';

export interface UseHotspotsResult {
  currentViewpoint: Viewpoint;
  setCurrentViewpoint: (viewpoint: Viewpoint) => void;
  navigateToViewpoint: (viewpointId: string) => void;
  getHotspotsForCurrentViewpoint: () => Hotspot[];
}

export function useHotspots(
  viewpoints: Viewpoint[],
  hotspots: Hotspot[],
  initialViewpointId?: string
): UseHotspotsResult {
  const initialViewpoint = viewpoints.find(v => v.id === initialViewpointId) || viewpoints[0];
  const [currentViewpoint, setCurrentViewpoint] = useState<Viewpoint>(initialViewpoint);

  const navigateToViewpoint = useCallback((viewpointId: string) => {
    const target = viewpoints.find(v => v.id === viewpointId);
    if (target) {
      setCurrentViewpoint(target);
    }
  }, [viewpoints]);

  const getHotspotsForCurrentViewpoint = useCallback(() => {
    return hotspots.filter(h => h.targetViewpoint !== currentViewpoint.id);
  }, [hotspots, currentViewpoint.id]);

  return {
    currentViewpoint,
    setCurrentViewpoint,
    navigateToViewpoint,
    getHotspotsForCurrentViewpoint
  };
}
