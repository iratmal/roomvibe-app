import { useState, useRef, useEffect, useCallback } from 'react';
import { GalleryPreset } from '../../data/galleryPresets';
import { PlacedArtwork } from '../../types/VirtualExhibition';

interface Artwork {
  id: number;
  title: string;
  artist_name: string;
  image_url: string;
  width: number;
  height: number;
  dimension_unit: string;
  price?: number | null;
  currency?: string;
  buy_url?: string | null;
}

interface GalleryWallEditorProps {
  preset: GalleryPreset;
  availableArtworks: Artwork[];
  placedArtworks: PlacedArtwork[];
  onPlacementsChange: (placements: PlacedArtwork[]) => void;
}

export function GalleryWallEditor({
  preset,
  availableArtworks,
  placedArtworks,
  onPlacementsChange
}: GalleryWallEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const getArtworkSizeInCanvas = (artwork: PlacedArtwork, canvasWidth: number, canvasHeight: number) => {
    const baseSize = 100;
    const aspectRatio = artwork.width / artwork.height;
    let width = baseSize * artwork.scale;
    let height = width / aspectRatio;
    
    const maxWidth = canvasWidth * 0.3;
    const maxHeight = canvasHeight * 0.4;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width, height };
  };

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, artworkId: number) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const artwork = placedArtworks.find(a => a.id === artworkId);
    if (!artwork || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = artwork.x * rect.width;
    const currentY = artwork.y * rect.height;
    
    setDragOffset({
      x: clientX - rect.left - currentX,
      y: clientY - rect.top - currentY
    });
    setDraggingId(artworkId);
    setSelectedId(artworkId);
  }, [placedArtworks]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingId === null || !canvasRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = (clientX - rect.left - dragOffset.x) / rect.width;
    const newY = (clientY - rect.top - dragOffset.y) / rect.height;
    
    const clampedX = Math.max(0.05, Math.min(0.95, newX));
    const clampedY = Math.max(0.05, Math.min(0.95, newY));
    
    const updatedPlacements = placedArtworks.map(a =>
      a.id === draggingId ? { ...a, x: clampedX, y: clampedY } : a
    );
    onPlacementsChange(updatedPlacements);
  }, [draggingId, dragOffset, placedArtworks, onPlacementsChange]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);

  const handleDropFromSidebar = (artwork: Artwork) => {
    if (placedArtworks.length >= preset.maxArtworks) {
      alert(`Maximum ${preset.maxArtworks} artworks allowed in this space`);
      return;
    }
    
    if (placedArtworks.some(p => p.id === artwork.id)) {
      alert('This artwork is already placed in the exhibition');
      return;
    }
    
    const newPlacement: PlacedArtwork = {
      id: artwork.id,
      title: artwork.title,
      artistName: artwork.artist_name,
      imageUrl: artwork.image_url,
      width: artwork.width,
      height: artwork.height,
      dimensionUnit: artwork.dimension_unit,
      price: artwork.price,
      currency: artwork.currency,
      buyUrl: artwork.buy_url,
      x: 0.3 + (placedArtworks.length * 0.15) % 0.4,
      y: 0.4,
      scale: 1.0
    };
    
    onPlacementsChange([...placedArtworks, newPlacement]);
    setSelectedId(artwork.id);
  };

  const handleRemoveArtwork = (artworkId: number) => {
    onPlacementsChange(placedArtworks.filter(a => a.id !== artworkId));
    if (selectedId === artworkId) setSelectedId(null);
  };

  const handleScaleChange = (artworkId: number, newScale: number) => {
    onPlacementsChange(
      placedArtworks.map(a =>
        a.id === artworkId ? { ...a, scale: newScale } : a
      )
    );
  };

  const availableToAdd = availableArtworks.filter(
    a => !placedArtworks.some(p => p.id === a.id)
  );

  return (
    <div className="flex gap-6 h-full">
      <div className="w-56 flex-shrink-0 flex flex-col">
        <h4 className="text-sm font-semibold text-[#264C61] mb-3">Collection Artworks</h4>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {availableToAdd.length === 0 && placedArtworks.length === 0 && (
            <p className="text-xs text-slate-500 italic">No artworks in this collection yet</p>
          )}
          {availableToAdd.map(artwork => (
            <button
              key={artwork.id}
              onClick={() => handleDropFromSidebar(artwork)}
              className="w-full flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-[#264C61]/40 hover:bg-slate-50 transition-all text-left"
            >
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{artwork.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{artwork.artist_name}</p>
              </div>
              <svg className="w-4 h-4 text-[#264C61] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))}
        </div>
        
        {placedArtworks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-600 mb-2">Placed ({placedArtworks.length}/{preset.maxArtworks})</h4>
            <div className="space-y-1">
              {placedArtworks.map(artwork => (
                <div
                  key={artwork.id}
                  className={`flex items-center gap-2 p-1.5 rounded ${
                    selectedId === artwork.id ? 'bg-[#264C61]/10' : 'bg-slate-50'
                  }`}
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <span className="flex-1 text-[10px] text-slate-700 truncate">{artwork.title}</span>
                  <button
                    onClick={() => handleRemoveArtwork(artwork.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div
          ref={canvasRef}
          className="relative flex-1 rounded-xl overflow-hidden bg-cover bg-center shadow-lg"
          style={{ backgroundImage: `url(${preset.image})`, minHeight: '400px' }}
          onClick={() => setSelectedId(null)}
        >
          {placedArtworks.map(artwork => {
            const canvasWidth = canvasRef.current?.clientWidth || 800;
            const canvasHeight = canvasRef.current?.clientHeight || 500;
            const size = getArtworkSizeInCanvas(artwork, canvasWidth, canvasHeight);
            
            return (
              <div
                key={artwork.id}
                className={`absolute cursor-move transition-shadow ${
                  selectedId === artwork.id ? 'ring-2 ring-[#C9A24A] ring-offset-2 shadow-xl z-10' : 'shadow-lg hover:shadow-xl'
                }`}
                style={{
                  left: `calc(${artwork.x * 100}% - ${size.width / 2}px)`,
                  top: `calc(${artwork.y * 100}% - ${size.height / 2}px)`,
                  width: size.width,
                  height: size.height
                }}
                onMouseDown={(e) => handleDragStart(e, artwork.id)}
                onTouchStart={(e) => handleDragStart(e, artwork.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(artwork.id);
                }}
              >
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover bg-white p-1"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  draggable={false}
                />
              </div>
            );
          })}
          
          {placedArtworks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center max-w-xs">
                <svg className="w-12 h-12 mx-auto mb-3 text-[#264C61]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-600">Click artworks from the sidebar to add them to your exhibition</p>
              </div>
            </div>
          )}
        </div>
        
        {selectedId !== null && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#264C61]">
                  {placedArtworks.find(a => a.id === selectedId)?.title}
                </h4>
                <p className="text-xs text-slate-500">
                  {placedArtworks.find(a => a.id === selectedId)?.artistName}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600">Size:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={placedArtworks.find(a => a.id === selectedId)?.scale || 1}
                    onChange={(e) => handleScaleChange(selectedId, parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-xs text-slate-600 w-10">
                    {((placedArtworks.find(a => a.id === selectedId)?.scale || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveArtwork(selectedId)}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
