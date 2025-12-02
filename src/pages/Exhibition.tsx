import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Artwork {
  id: number;
  title: string;
  artistName: string;
  imageUrl: string;
  width: number;
  height: number;
  dimensionUnit: string;
  price: number | null;
  currency: string;
  buyUrl: string | null;
}

interface Collection {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  artworks: Artwork[];
}

interface ExhibitionConfig {
  userType: string;
  entitlements: {
    gallery_access: boolean;
  };
  capabilities: {
    exhibitionMode: boolean;
    buyButton: boolean;
  };
  data: {
    galleryScenes: Collection[];
  };
}

export function Exhibition() {
  const [config, setConfig] = useState<ExhibitionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchExhibition = async () => {
      const hash = window.location.hash;
      const match = hash.match(/exhibition\/([a-f0-9]+)/);
      const widgetId = match ? match[1] : null;

      if (!widgetId) {
        setError('Invalid exhibition link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/widget/config?widgetId=${encodeURIComponent(widgetId)}`);
        if (!response.ok) {
          throw new Error('Exhibition not found');
        }
        const data = await response.json();
        
        if (!data.entitlements?.gallery_access || !data.capabilities?.exhibitionMode) {
          setError('This exhibition is not available');
          setLoading(false);
          return;
        }
        
        setConfig(data);
      } catch (err) {
        setError('Failed to load exhibition');
      } finally {
        setLoading(false);
      }
    };

    fetchExhibition();
  }, []);

  const allArtworks = config?.data?.galleryScenes?.flatMap(scene => scene.artworks) || [];
  const hasArtworks = allArtworks.length > 0;

  const handlePrevSlide = () => {
    if (!hasArtworks) return;
    setCurrentSlide(prev => (prev === 0 ? allArtworks.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (!hasArtworks) return;
    setCurrentSlide(prev => (prev === allArtworks.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === 'ArrowRight') handleNextSlide();
      if (e.key === 'Escape') setSelectedArtwork(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allArtworks.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rv-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rv-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rv-textMuted">Loading exhibition...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rv-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-rv-text mb-2">Exhibition Not Available</h1>
          <p className="text-rv-textMuted">{error}</p>
          <a
            href="#/"
            className="mt-6 inline-block px-6 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const currentArtwork = hasArtworks ? allArtworks[currentSlide] : null;

  if (!hasArtworks && config) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">No Artworks Yet</h1>
          <p className="text-white/70">This exhibition doesn't have any published artworks yet. Check back soon!</p>
          <a
            href="#/"
            className="mt-6 inline-block px-6 py-2.5 rounded-full bg-rv-accent text-white font-semibold hover:bg-rv-accent/90 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2 text-white hover:text-rv-accent transition-colors">
            <img 
              src="/roomvibe-logo-transparent.png" 
              alt="RoomVibe" 
              className="h-8 w-auto brightness-200"
            />
          </a>
          <div className="text-sm text-white/70">
            {currentSlide + 1} / {allArtworks.length}
          </div>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        {currentArtwork && (
          <div className="max-w-5xl w-full">
            <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
              <img
                src={currentArtwork.imageUrl}
                alt={currentArtwork.title}
                className="w-full h-full object-contain"
                onClick={() => setSelectedArtwork(currentArtwork)}
              />
              
              <button
                onClick={handlePrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                aria-label="Previous artwork"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                aria-label="Next artwork"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold">{currentArtwork.title}</h2>
              <p className="text-white/70 mt-1">by {currentArtwork.artistName}</p>
              <p className="text-white/50 text-sm mt-2">
                {currentArtwork.width} × {currentArtwork.height} {currentArtwork.dimensionUnit}
                {currentArtwork.price && (
                  <span className="ml-3">
                    {currentArtwork.price.toLocaleString()} {currentArtwork.currency}
                  </span>
                )}
              </p>
              
              {config?.capabilities?.buyButton && currentArtwork.buyUrl && (
                <a
                  href={currentArtwork.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block px-6 py-2.5 rounded-full bg-rv-accent text-white font-semibold hover:bg-rv-accent/90 transition-colors"
                >
                  Inquire / Purchase
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allArtworks.map((artwork, index) => (
              <button
                key={artwork.id}
                onClick={() => setCurrentSlide(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentSlide ? 'border-rv-accent scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedArtwork && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <button
            onClick={() => setSelectedArtwork(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="max-w-6xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedArtwork.imageUrl}
              alt={selectedArtwork.title}
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <div className="text-center mt-4">
              <h3 className="text-xl font-bold">{selectedArtwork.title}</h3>
              <p className="text-white/70">by {selectedArtwork.artistName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
