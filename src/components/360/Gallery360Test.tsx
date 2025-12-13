import React from 'react';
import { Gallery360Scene } from './Gallery360Scene';
import { gallery360Presets } from '../../config/gallery360Presets';

export function Gallery360Test() {
  const [presetIndex, setPresetIndex] = React.useState(1);
  const preset = gallery360Presets[presetIndex];
  
  const currentViewpoint = preset.viewpoints[0];
  
  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg p-4 shadow-lg">
        <h2 className="text-lg font-bold mb-2">360 Gallery Test</h2>
        <div className="flex gap-2">
          {gallery360Presets.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPresetIndex(i)}
              className={`px-3 py-1 rounded text-sm ${
                i === presetIndex 
                  ? 'bg-[#264C61] text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Current: {preset.name} ({preset.id})
        </p>
        <p className="text-xs text-gray-500">
          Dimensions: {preset.dimensions.width}x{preset.dimensions.height}x{preset.dimensions.depth}m
        </p>
      </div>
      
      <Gallery360Scene
        preset={preset}
        slotAssignments={[]}
        currentViewpoint={currentViewpoint}
        onNavigate={() => {}}
        isEditor={false}
      />
    </div>
  );
}
