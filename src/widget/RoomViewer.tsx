import React from 'react';
import { RoomPreset, Artwork, FrameOption } from '../types';

interface RoomViewerProps {
  room: RoomPreset;
  artwork: Artwork | null;
  size: string;
  frame: FrameOption;
  wallColor: string;
  designerWidth?: number;
}

const RoomViewer: React.FC<RoomViewerProps> = ({
  room,
  artwork,
  size,
  frame,
  wallColor,
  designerWidth
}) => {
  // Calculate artwork dimensions based on size
  const getArtworkDimensions = () => {
    if (!artwork || !size) return { width: 0, height: 0 };
    
    const [widthStr, heightStr] = size.split('x');
    const width = parseInt(widthStr);
    const height = parseInt(heightStr);
    
    // If designer mode with custom width, recalculate
    if (designerWidth) {
      return {
        width: designerWidth,
        height: Math.round(designerWidth / artwork.ratio)
      };
    }
    
    return { width, height };
  };

  const dimensions = getArtworkDimensions();
  
  // Calculate display size (scale down for preview)
  const maxDisplayWidth = 600;
  const scale = Math.min(1, maxDisplayWidth / (dimensions.width || 1));
  const displayWidth = dimensions.width * scale;
  const displayHeight = dimensions.height * scale;

  const frameColors = {
    none: 'transparent',
    black: '#000000',
    white: '#FFFFFF',
    oak: '#D4A574'
  };

  return (
    <div 
      className="relative rounded-lg overflow-hidden shadow-lg"
      style={{ 
        backgroundColor: wallColor,
        minHeight: '400px',
        backgroundImage: `url(/rooms/${room}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Room overlay to adjust brightness */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: wallColor, 
          opacity: 0.7,
          mixBlendMode: 'multiply'
        }} 
      />
      
      {/* Artwork display */}
      {artwork && dimensions.width > 0 && (
        <div className="relative z-10 flex items-center justify-center min-h-[400px] p-8">
          <div
            className="relative shadow-2xl"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
          >
            {/* Frame */}
            {frame !== 'none' && (
              <div
                className="absolute inset-0"
                style={{
                  border: `${scale * 10}px solid ${frameColors[frame]}`,
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
                }}
              />
            )}
            
            {/* Artwork image */}
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-full object-cover"
              style={{
                padding: frame !== 'none' ? `${scale * 10}px` : '0'
              }}
            />
          </div>
        </div>
      )}
      
      {/* Dimensions overlay (Designer mode) */}
      {designerWidth && dimensions.width > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow text-sm">
          <strong>Dimensions:</strong> {dimensions.width} × {dimensions.height} cm
        </div>
      )}
    </div>
  );
};

export default RoomViewer;
