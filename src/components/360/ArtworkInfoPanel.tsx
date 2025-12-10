import React, { useEffect } from 'react';

export interface ArtworkPanelData {
  slotId: string;
  artworkId: string | null;
  artworkUrl?: string;
  artworkTitle?: string;
  artistName?: string;
  width?: number;
  height?: number;
  medium?: string;
  collection?: string;
  description?: string;
  price?: string;
  externalUrl?: string;
}

interface ArtworkInfoPanelProps {
  artwork: ArtworkPanelData | null;
  open: boolean;
  onClose: () => void;
}

export function ArtworkInfoPanel({ artwork, open, onClose }: ArtworkInfoPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!artwork) return null;

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-10"
          onClick={onClose}
        />
      )}
      
      <div
        className={`
          fixed top-0 left-0 h-full w-[340px] bg-white/[0.97] shadow-xl z-20
          flex flex-col transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
          onClick={onClose}
          aria-label="Close panel"
        >
          ×
        </button>

        <div className="p-5 pt-12 overflow-y-auto flex-1">
          {artwork.artworkUrl && (
            <div className="mb-4 rounded overflow-hidden shadow-sm">
              <img 
                src={artwork.artworkUrl} 
                alt={artwork.artworkTitle || 'Artwork'} 
                className="w-full h-auto"
              />
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {artwork.artworkTitle || 'Untitled'}
          </h2>
          
          {artwork.artistName && (
            <p className="text-sm text-gray-600 mb-3">
              {artwork.artistName}
            </p>
          )}

          {(artwork.width && artwork.height) && (
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">Size:</span> {artwork.width} × {artwork.height} cm
            </p>
          )}

          {artwork.medium && (
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">Medium:</span> {artwork.medium}
            </p>
          )}

          {artwork.collection && (
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-medium">Collection:</span> {artwork.collection}
            </p>
          )}

          {artwork.description && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              {artwork.description}
            </p>
          )}

          {artwork.price && (
            <p className="text-lg font-semibold text-[#264C61] mt-4">
              {artwork.price}
            </p>
          )}

          {artwork.externalUrl && (
            <a
              href={artwork.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#264C61] text-white rounded-xl text-sm font-semibold hover:bg-[#1D3A4A] transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              View Details / Buy
            </a>
          )}
        </div>
      </div>
    </>
  );
}
