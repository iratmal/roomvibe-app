import React from 'react';
import { Artwork } from '../types';

interface ArtworkSelectorProps {
  artworks: Artwork[];
  selectedArt: Artwork | null;
  onSelect: (artwork: Artwork) => void;
}

const ArtworkSelector: React.FC<ArtworkSelectorProps> = ({
  artworks,
  selectedArt,
  onSelect
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Browse Artworks</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {artworks.map(artwork => (
          <button
            key={artwork.id}
            onClick={() => onSelect(artwork)}
            className={`group relative overflow-hidden rounded-lg transition-all ${
              selectedArt?.id === artwork.id
                ? 'ring-4 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <div className="aspect-square bg-gray-200">
              <img
                src={artwork.image}
                alt={artwork.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white text-sm font-semibold truncate">
                {artwork.title}
              </p>
              <p className="text-white/80 text-xs">
                €{artwork.price}
              </p>
            </div>
            
            {selectedArt?.id === artwork.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArtworkSelector;
