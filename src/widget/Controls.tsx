import React from 'react';
import { Artwork, FrameOption } from '../types';

interface ControlsProps {
  artwork: Artwork | null;
  selectedSize: string;
  selectedFrame: FrameOption;
  wallColor: string;
  designerMode: boolean;
  designerWidth?: number;
  onSizeChange: (size: string) => void;
  onFrameChange: (frame: FrameOption) => void;
  onWallColorChange: (color: string) => void;
  onDesignerWidthChange: (width: number | undefined) => void;
  onDesignerModeToggle: () => void;
}

const WALL_COLOR_SWATCHES = [
  { name: 'White', color: '#FFFFFF' },
  { name: 'Cream', color: '#F5F5DC' },
  { name: 'Light Gray', color: '#D3D3D3' },
  { name: 'Sage', color: '#9DC183' },
  { name: 'Sky Blue', color: '#87CEEB' },
  { name: 'Blush', color: '#FFB6C1' },
  { name: 'Charcoal', color: '#36454F' }
];

const Controls: React.FC<ControlsProps> = ({
  artwork,
  selectedSize,
  selectedFrame,
  wallColor,
  designerMode,
  designerWidth,
  onSizeChange,
  onFrameChange,
  onWallColorChange,
  onDesignerWidthChange,
  onDesignerModeToggle
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg p-4">
        <h3 className="font-semibold mb-3">Artwork Details</h3>
        {artwork ? (
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {artwork.title}</p>
            <p><strong>Price:</strong> €{artwork.price}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {artwork.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-200 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select an artwork</p>
        )}
      </div>

      {/* Size Selection */}
      <div>
        <label className="block text-sm font-semibold mb-2">Size (cm)</label>
        <div className="grid grid-cols-2 gap-2">
          {artwork?.sizes.map(size => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`py-2 px-3 rounded text-sm ${
                selectedSize === size
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-gray-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Selection */}
      <div>
        <label className="block text-sm font-semibold mb-2">Frame</label>
        <div className="grid grid-cols-2 gap-2">
          {artwork?.frameOptions.map(frame => (
            <button
              key={frame}
              onClick={() => onFrameChange(frame)}
              className={`py-2 px-3 rounded text-sm capitalize ${
                selectedFrame === frame
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-gray-300'
              }`}
            >
              {frame}
            </button>
          ))}
        </div>
      </div>

      {/* Wall Color */}
      <div>
        <label className="block text-sm font-semibold mb-2">Wall Color</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {WALL_COLOR_SWATCHES.map(swatch => (
            <button
              key={swatch.color}
              onClick={() => onWallColorChange(swatch.color)}
              className={`aspect-square rounded border-2 ${
                wallColor === swatch.color ? 'border-primary' : 'border-gray-300'
              }`}
              style={{ backgroundColor: swatch.color }}
              title={swatch.name}
            />
          ))}
        </div>
        <input
          type="color"
          value={wallColor}
          onChange={(e) => onWallColorChange(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>

      {/* Designer Mode */}
      <div className="border-t pt-4">
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Designer Mode</span>
          <button
            onClick={onDesignerModeToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              designerMode ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                designerMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        
        {designerMode && (
          <div>
            <label className="block text-sm mb-2">Custom Width (cm)</label>
            <input
              type="number"
              min="10"
              max="300"
              value={designerWidth || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : undefined;
                onDesignerWidthChange(val);
              }}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;
