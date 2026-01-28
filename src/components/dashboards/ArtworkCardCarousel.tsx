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
  cardImageId?: number | null;
}

export function ArtworkCardCarousel({ artworkId, primaryImageUrl, title, cardImageId }: ArtworkCardCarouselProps) {
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
            // Use cardImageId directly to find the correct image
            // cardImageId: 0 = cover image, positive number = gallery image ID, null/undefined = default to first
            let orderedImages = [...data.images];
            
            if (cardImageId !== null && cardImageId !== undefined) {
              // Find the image matching cardImageId directly by ID
              const matchIndex = orderedImages.findIndex((img: ArtworkImage) => {
                if (cardImageId === 0) {
                  return img.id === 0 || img.is_cover;
                }
                return img.id === cardImageId;
              });
              
              // Move matched image to first position
              if (matchIndex > 0) {
                const [matchedImg] = orderedImages.splice(matchIndex, 1);
                orderedImages.unshift(matchedImg);
              }
            }
            // If cardImageId is null/undefined, keep original order (cover first by default)
            
            setImages(orderedImages);
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
  }, [artworkId, cardImageId, primaryImageUrl]);

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

  // Reset to first image when cardImageId or primaryImageUrl changes (e.g., after card image update)
  useEffect(() => {
    setCurrentIndex(0);
    setImageLoadError(false);
    setImageLoaded(false);
  }, [cardImageId, primaryImageUrl]);

  if (isLoading) {
    return (
      <div className="w-full bg-neutral-200 relative flex items-center justify-center overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <div className="w-8 h-8 border-2 border-rv-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="w-full bg-neutral-200 relative group overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
      <div className="absolute inset-4 flex items-center justify-center">
        {!imageLoaded && !imageLoadError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-rv-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {imageLoadError ? (
          <div className="flex flex-col items-center justify-center text-rv-textMuted">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        ) : (
          <img
            src={getImageUrl(currentImage?.image_url || primaryImageUrl)}
            alt={`${title} - Image ${currentIndex + 1}`}
            className={`max-w-full max-h-full object-contain shadow-md ${imageLoaded ? '' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.warn('Image failed to load:', currentImage?.image_url);
              setImageLoadError(true);
            }}
          />
        )}
      </div>

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
