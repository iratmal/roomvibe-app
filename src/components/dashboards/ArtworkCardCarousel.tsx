import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ArtworkImage {
  id: number;
  image_url: string;
  display_order: number;
  is_mockup: boolean;
  is_cover: boolean;
}

interface ArtworkCardCarouselProps {
  artworkId: number;
  primaryImageUrl: string;
  title: string;
}

export function ArtworkCardCarousel({ artworkId, primaryImageUrl, title }: ArtworkCardCarouselProps) {
  const [images, setImages] = useState<ArtworkImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/artist/artworks/${artworkId}/images`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            setImages(data.images);
          } else {
            setImages([{
              id: 0,
              image_url: primaryImageUrl,
              display_order: 0,
              is_mockup: false,
              is_cover: true
            }]);
          }
        } else {
          setImages([{
            id: 0,
            image_url: primaryImageUrl,
            display_order: 0,
            is_mockup: false,
            is_cover: true
          }]);
        }
      } catch (error) {
        console.error('Error fetching artwork images:', error);
        setImages([{
          id: 0,
          image_url: primaryImageUrl,
          display_order: 0,
          is_mockup: false,
          is_cover: true
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [artworkId, primaryImageUrl]);

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  useEffect(() => {
    setImageLoadError(false);
    setImageLoaded(false);
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="w-full bg-rv-surface relative flex items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[420px] lg:min-h-[480px]" style={{ aspectRatio: '3 / 4' }}>
        <div className="w-8 h-8 border-2 border-rv-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="w-full bg-rv-surface relative group overflow-hidden min-h-[360px] sm:min-h-[420px] lg:min-h-[480px]" style={{ aspectRatio: '3 / 4' }}>
      {!imageLoaded && !imageLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-rv-surface">
          <div className="w-8 h-8 border-2 border-rv-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {imageLoadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-rv-textMuted bg-rv-surface">
          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          src={getImageUrl(currentImage?.image_url || primaryImageUrl)}
          alt={`${title} - Image ${currentIndex + 1}`}
          className={`w-full h-full object-cover object-center ${imageLoaded ? '' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.warn('Image failed to load:', currentImage?.image_url);
            setImageLoadError(true);
          }}
        />
      )}

      {hasMultipleImages && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-1 rounded-full">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(e, index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white scale-110'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs font-medium rounded-full">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}

      {currentImage?.is_mockup && (
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#C9A24A] text-white text-xs font-semibold rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
          Mockup
        </span>
      )}
    </div>
  );
}
