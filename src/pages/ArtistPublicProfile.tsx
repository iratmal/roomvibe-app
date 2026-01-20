import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ArtistProfile {
  displayName: string;
  locationCity: string;
  locationCountry: string;
  bio: string;
  primaryStyleTags: string[];
  primaryMedium: string;
  profileImageUrl: string;
  headerImageUrl: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  pinterestUrl: string;
  etsyUrl: string;
  languages: string[];
  visibleToDesigners: boolean;
  visibleToGalleries: boolean;
}

interface ArtworkVariant {
  width: string;
  height: string;
  unit?: string;
  price: string;
  currency: string;
  availability: string;
}

interface GalleryImage {
  id: number;
  image_url: string;
  display_order: number;
  is_mockup: boolean;
}

interface Artwork {
  id: number;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  priceAmount: number | null;
  priceCurrency: string;
  dimensionUnit: string;
  buyUrl: string;
  medium: string;
  styleTags: string[];
  availability: string;
  likeCount: number;
  variants?: ArtworkVariant[];
  galleryImages?: GalleryImage[];
}

interface ArtistPublicProfileProps {
  slug: string;
  onContactClick?: (artistId: number) => void;
  onViewInRoom?: (artwork: Artwork) => void;
}

interface PublishedExhibition {
  id: number;
  title: string;
}

export function ArtistPublicProfile({ slug, onContactClick, onViewInRoom }: ArtistPublicProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artistId, setArtistId] = useState<number | null>(null);
  const [publishedExhibition, setPublishedExhibition] = useState<PublishedExhibition | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  
  const isOwner = user && artistId && user.id === artistId;
  
  // Public contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  
  // Likes state - track which artworks user has liked (cookie-based)
  const [likedArtworks, setLikedArtworks] = useState<Set<number>>(new Set());
  
  // Track current image index for each artwork carousel
  const [artworkImageIndex, setArtworkImageIndex] = useState<Record<number, number>>({});
  
  // Zoom lightbox state
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
    loadLikedArtworks();
    
    // Refetch when window gains focus (e.g., user returns from Dashboard)
    const handleFocus = () => {
      fetchProfile();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [slug]);

  const loadLikedArtworks = () => {
    try {
      const liked = localStorage.getItem('likedArtworks');
      if (liked) {
        setLikedArtworks(new Set(JSON.parse(liked)));
      }
    } catch (e) {
      console.error('Error loading liked artworks:', e);
    }
  };

  const saveLikedArtworks = (likes: Set<number>) => {
    try {
      localStorage.setItem('likedArtworks', JSON.stringify([...likes]));
    } catch (e) {
      console.error('Error saving liked artworks:', e);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setArtistId(null);

      const response = await fetch(`${API_URL}/api/public/artist/${slug}?_t=${Date.now()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Artist not found or profile is private');
        } else {
          setError('Failed to load artist profile');
        }
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
      setArtworks(data.artworks.map((a: any) => ({ ...a, likeCount: a.likeCount || 0 })));
      setArtistId(data.artistId);
      setPublishedExhibition(data.publishedExhibition || null);
    } catch (err) {
      console.error('Error fetching artist profile:', err);
      setError('Failed to load artist profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPublicMessage = async () => {
    if (!artistId || !contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setMessageError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setMessageError('Please enter a valid email address');
      return;
    }

    setSendingMessage(true);
    setMessageError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/public/contact-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          senderName: contactName,
          senderEmail: contactEmail,
          message: contactMessage
        })
      });

      if (response.ok) {
        setMessageSent(true);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
        setTimeout(() => {
          setShowContactModal(false);
          setMessageSent(false);
        }, 3000);
      } else {
        const data = await response.json();
        setMessageError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const openArtworkDetail = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setDetailImageIndex(0);
    setSelectedVariantIndex(null);
  };

  const closeArtworkDetail = () => {
    setSelectedArtwork(null);
    setDetailImageIndex(0);
    setSelectedVariantIndex(null);
  };

  // Zoom lightbox handlers - stable, constrained zoom with centered focus
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.15;

  const openZoom = useCallback((imageUrl: string) => {
    setZoomImageUrl(imageUrl);
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
  }, []);

  const closeZoom = useCallback(() => {
    setZoomImageUrl(null);
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  // Constrain pan position to keep image visible (prevent black space)
  const constrainPosition = useCallback((pos: { x: number; y: number }, scale: number) => {
    if (scale <= 1) return { x: 0, y: 0 };
    
    // Calculate max allowed offset based on zoom level
    // As zoom increases, more panning is allowed
    const maxOffset = Math.max(0, (scale - 1) * 150);
    
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, pos.x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, pos.y))
    };
  }, []);

  const handleZoomWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Smooth, consistent zoom step
    const direction = e.deltaY > 0 ? -1 : 1;
    
    setZoomScale(prev => {
      const newScale = prev + (direction * ZOOM_STEP);
      const clampedScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);
      
      // Reset position when zooming out to minimum
      if (clampedScale <= MIN_ZOOM) {
        setZoomPosition({ x: 0, y: 0 });
      }
      
      return clampedScale;
    });
  }, []);

  const handleZoomMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - zoomPosition.x, y: e.clientY - zoomPosition.y });
    }
  }, [zoomScale, zoomPosition]);

  const handleZoomMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      const newPos = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setZoomPosition(constrainPosition(newPos, zoomScale));
    }
  }, [isDragging, dragStart, zoomScale, constrainPosition]);

  const handleZoomMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch events for mobile pinch-to-zoom
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [touchStartScale, setTouchStartScale] = useState(1);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setTouchStartDistance(getTouchDistance(e.touches));
      setTouchStartScale(zoomScale);
    } else if (e.touches.length === 1 && zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - zoomPosition.x, 
        y: e.touches[0].clientY - zoomPosition.y 
      });
    }
  }, [zoomScale, zoomPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistance > 0) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = (currentDistance / touchStartDistance) * touchStartScale;
      const clampedScale = Math.min(Math.max(scale, MIN_ZOOM), MAX_ZOOM);
      setZoomScale(clampedScale);
      
      if (clampedScale <= MIN_ZOOM) {
        setZoomPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoomScale > 1) {
      const newPos = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      };
      setZoomPosition(constrainPosition(newPos, zoomScale));
    }
  }, [touchStartDistance, touchStartScale, isDragging, dragStart, zoomScale, constrainPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTouchStartDistance(0);
  }, []);

  // Close zoom on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomImageUrl) {
        closeZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomImageUrl, closeZoom]);

  const openContactAboutArtwork = (artwork: Artwork) => {
    const sizeInfo = selectedVariantIndex !== null && artwork.variants?.[selectedVariantIndex]
      ? `${artwork.variants[selectedVariantIndex].width} × ${artwork.variants[selectedVariantIndex].height} ${artwork.variants[selectedVariantIndex].unit || artwork.dimensionUnit}`
      : `${artwork.width} × ${artwork.height} ${artwork.dimensionUnit}`;
    
    setContactMessage(`Hi, I'm interested in "${artwork.title}" (${sizeInfo}). `);
    setShowContactModal(true);
    setSelectedArtwork(null);
  };

  const handleLikeArtwork = async (artworkId: number) => {
    const isLiked = likedArtworks.has(artworkId);
    
    try {
      const response = await fetch(`${API_URL}/api/public/artwork/${artworkId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlike: isLiked })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local like state
        const newLikes = new Set(likedArtworks);
        if (isLiked) {
          newLikes.delete(artworkId);
        } else {
          newLikes.add(artworkId);
        }
        setLikedArtworks(newLikes);
        saveLikedArtworks(newLikes);
        
        // Update artwork like count
        setArtworks(prev => prev.map(a => 
          a.id === artworkId ? { ...a, likeCount: data.likeCount } : a
        ));
      }
    } catch (err) {
      console.error('Error liking artwork:', err);
    }
  };

  const scrollToArtworks = () => {
    document.getElementById('artworks-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rv-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rv-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-rv-surface flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-rv-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-rv-text mb-2">Profile Not Available</h1>
        <p className="text-rv-textMuted text-center max-w-md">
          {error || 'This artist profile is private or does not exist.'}
        </p>
        <a 
          href="#/"
          className="mt-6 px-6 py-3 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors"
        >
          Back to Home
        </a>
      </div>
    );
  }

  const location = [profile.locationCity, profile.locationCountry].filter(Boolean).join(', ');

  const heroBackgroundImage = profile.headerImageUrl 
    ? profile.headerImageUrl 
    : (artworks.length > 0 ? artworks[0].imageUrl : null);
  
  const hasCustomHeader = !!profile.headerImageUrl;

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Gallery Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background - custom header or blurred artwork */}
        {heroBackgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${heroBackgroundImage.startsWith('/api/') ? API_URL + heroBackgroundImage : heroBackgroundImage})`,
              filter: hasCustomHeader ? 'brightness(0.95)' : 'blur(80px) brightness(0.85) saturate(0.9)',
              transform: hasCustomHeader ? 'none' : 'scale(1.3)'
            }}
          />
        )}
        
        {/* Gradient overlay - adjusted based on whether custom header is used */}
        <div className={`absolute inset-0 ${hasCustomHeader 
          ? 'bg-gradient-to-b from-black/40 via-black/20 to-white/95' 
          : 'bg-gradient-to-b from-white/80 via-white/60 to-white/95'
        }`} />
        
        {/* Back to Dashboard link for owners */}
        {isOwner && (
          <a
            href="#/dashboard/artist"
            className={`absolute top-6 left-6 z-20 inline-flex items-center gap-2 transition-colors text-sm font-medium ${
              hasCustomHeader 
                ? 'text-white/80 hover:text-white' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </a>
        )}

        {/* Main hero content */}
        <div className="relative z-10 text-center px-6 py-20 max-w-4xl mx-auto">
          
          {/* Profile image - elevated gallery-grade presentation */}
          <div className="mb-10">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.displayName}
                className="w-40 h-40 md:w-52 md:h-52 rounded-full object-cover mx-auto ring-4 ring-white/90"
                style={{ 
                  boxShadow: '0 8px 40px -8px rgba(0,0,0,0.25), 0 4px 20px -4px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div 
                className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto ring-4 ring-white/90"
                style={{ 
                  boxShadow: '0 8px 40px -8px rgba(0,0,0,0.25), 0 4px 20px -4px rgba(0,0,0,0.1)'
                }}
              >
                <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Artist name - editorial typography with refined contrast */}
          <h1 
            className={`text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-4 ${
              hasCustomHeader ? 'text-white' : 'text-gray-900'
            }`}
            style={{ 
              textShadow: hasCustomHeader 
                ? '0 2px 12px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.2)' 
                : '0 1px 2px rgba(255,255,255,0.8), 0 2px 8px rgba(255,255,255,0.4)'
            }}
          >
            {profile.displayName || 'Artist'}
          </h1>

          {/* Subtle location/medium line */}
          <div className={`flex items-center justify-center gap-3 text-lg md:text-xl font-light ${
            hasCustomHeader ? 'text-white/80' : 'text-gray-500'
          }`}>
            {profile.primaryMedium && (
              <span className={hasCustomHeader ? 'text-[#D4AC54]' : 'text-[#C9A24A]'}>{profile.primaryMedium}</span>
            )}
            {profile.primaryMedium && location && (
              <span className={hasCustomHeader ? 'text-white/40' : 'text-gray-300'}>|</span>
            )}
            {location && (
              <span>{location}</span>
            )}
          </div>
        </div>

        {/* CTA Buttons - Positioned at bottom of hero in white area */}
        <div className="absolute bottom-16 left-0 right-0 z-10">
          <div className="flex flex-wrap items-center justify-center gap-3 px-6">
            {/* Primary CTA: Enter 360° Exhibition (gold) */}
            {publishedExhibition && (
              <a
                href={`#/embed/exhibitions/${publishedExhibition.id}`}
                className="cta-exhibition group inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#C9A24A] hover:bg-[#D4AC54] text-white text-sm font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10l3-3m0 0l3 3m-3-3v12" style={{transform: 'rotate(90deg)', transformOrigin: '12px 12px'}} />
                </svg>
                Enter 360° Exhibition
              </a>
            )}
            
            {/* Secondary CTA: View Artworks */}
            {artworks.length > 0 && (
              <button
                onClick={scrollToArtworks}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Artworks
              </button>
            )}
            
            {/* Tertiary CTA: Contact Artist */}
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Artist
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Gallery Caption - RoomVibe signature (museum label style) */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border-t border-gray-200 pt-6 pb-4 flex items-center justify-center gap-2">
            {/* RoomVibe frame logomark */}
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="1" />
              <rect x="6" y="6" width="12" height="12" rx="0.5" />
            </svg>
            <span className="text-xs tracking-wide text-gray-400 font-light">
              Exhibited on RoomVibe
            </span>
          </div>
        </div>
      </div>

      {/* About & Connect Section - Editorial Layout */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-20 lg:py-24">
          <div className="grid md:grid-cols-12 gap-12 lg:gap-16">
            {/* Bio - Editorial Two-Column Treatment */}
            {profile.bio && (
              <div className="md:col-span-8">
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 mb-8">About the Artist</h2>
                
                {/* Pull-quote - First sentence emphasized */}
                {(() => {
                  const sentences = profile.bio.split(/(?<=[.!?])\s+/);
                  const firstSentence = sentences[0] || '';
                  const remainingText = sentences.slice(1).join(' ');
                  
                  return (
                    <div className="space-y-8">
                      {firstSentence && (
                        <p className="text-2xl lg:text-3xl font-light text-gray-800 leading-relaxed tracking-tight border-l-2 border-gray-200 pl-6">
                          {firstSentence}
                        </p>
                      )}
                      {remainingText && (
                        <p className="text-gray-600 leading-[1.9] text-base font-light whitespace-pre-wrap max-w-prose">
                          {remainingText}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Connect - Sidebar */}
            <div className="md:col-span-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 mb-8">Connect</h2>
              
              {/* Contact button */}
              <button
                onClick={() => setShowContactModal(true)}
                className="w-full mb-8 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium tracking-wide rounded-lg transition-colors"
              >
                Contact Artist
              </button>

              {/* Social links */}
              {(profile.websiteUrl || profile.instagramUrl || profile.facebookUrl || profile.tiktokUrl || profile.linkedinUrl || profile.pinterestUrl || profile.etsyUrl) && (
                <div className="flex flex-wrap gap-2">
                  {profile.websiteUrl && (
                    <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Website">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    </a>
                  )}
                  {profile.instagramUrl && (
                    <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Instagram">
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {profile.facebookUrl && (
                    <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Facebook">
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {profile.tiktokUrl && (
                    <a href={profile.tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="TikTok">
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="LinkedIn">
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                  {profile.pinterestUrl && (
                    <a href={profile.pinterestUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Pinterest">
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
                    </a>
                  )}
                  {profile.etsyUrl && (
                    <a href={profile.etsyUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Etsy Shop">
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M8.559 3.89c-.502.156-.623.201-.968.499-.345.301-.401.523-.401 1.878v1.68H5.191v2.015l1.999.091v7.873c0 .903.045 1.436.133 1.68.134.378.345.624.857.99.523.38 1.269.591 2.227.691.712.056 2.237 0 3.24-.134v-2.217c-.759.156-1.414.156-1.904.067-.502-.1-.68-.29-.769-.757-.045-.223-.067-1.771-.067-3.475V10.053h2.884V8.038h-2.884V4.93c0-.045-.267 0-.501.056-.223.067-.812.234-1.292.412l-.835.29v2.306H6.535v2.015h1.744v7.395c0 1.703.089 2.762.267 3.163.179.401.535.769 1.07 1.103.536.334 1.181.535 1.949.624.769.089 1.893.044 2.918-.134l.111-.022V19.48c-.935.178-1.748.2-2.361.044-.613-.156-.924-.49-1.002-1.025-.045-.312-.067-1.47-.067-3.508v-4.938h3.04V8.038h-3.04V4.707c0-.045-.134 0-.356.067l-1.249.391z"/></svg>
                    </a>
                  )}
                </div>
              )}

              {/* Style tags */}
              {profile.primaryStyleTags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.primaryStyleTags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {artworks.length > 0 && (
        <section id="artworks-section" className="py-16 lg:py-24 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 mb-12 text-center">Selected Works</h2>
            <div className="grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {artworks.map((artwork) => {
                const galleryImgs = artwork.galleryImages || [];
                
                // Sort by display_order to match Dashboard (same as ArtworkCardCarousel)
                const sortedImages = [...galleryImgs].sort((a, b) => a.display_order - b.display_order);
                
                // Use sorted galleryImages as source of truth; fallback to imageUrl only if no gallery images
                const allImages: GalleryImage[] = sortedImages.length > 0 
                  ? sortedImages 
                  : (artwork.imageUrl ? [{ id: 0, image_url: artwork.imageUrl, display_order: 0, is_mockup: false }] : []);
                
                if (allImages.length === 0) return null;
                
                const currentIndex = Math.min(artworkImageIndex[artwork.id] || 0, allImages.length - 1);
                const hasMultipleImages = allImages.length > 1;
                const currentImage = allImages[currentIndex];
                const imageUrl = currentImage.image_url.startsWith('/api/') 
                  ? `${API_URL}${currentImage.image_url}` 
                  : (currentImage.image_url.startsWith('http') ? currentImage.image_url : `${API_URL}${currentImage.image_url}`);

                return (
                <div key={artwork.id} className="bg-white overflow-hidden group rounded-lg">
                  {/* Wall container - matches Dashboard ArtworkCardCarousel exactly */}
                  <div 
                    className="w-full bg-neutral-200 relative overflow-hidden cursor-pointer"
                    style={{ aspectRatio: '4 / 3' }}
                    onClick={() => openArtworkDetail(artwork)}
                  >
                    <div className="absolute inset-4 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={artwork.title}
                        className="max-w-full max-h-full object-contain shadow-md"
                      />
                    </div>
                    
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setArtworkImageIndex(prev => ({
                              ...prev,
                              [artwork.id]: (currentIndex - 1 + allImages.length) % allImages.length
                            }));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-5 h-5 text-rv-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setArtworkImageIndex(prev => ({
                              ...prev,
                              [artwork.id]: (currentIndex + 1) % allImages.length
                            }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-5 h-5 text-rv-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {allImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setArtworkImageIndex(prev => ({ ...prev, [artwork.id]: idx }));
                              }}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                idx === currentIndex ? 'bg-rv-primary' : 'bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {currentImage.is_mockup && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-[#C9A24A] text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        Mockup
                      </span>
                    )}
                    
                    {artwork.availability === 'sold' && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        SOLD
                      </div>
                    )}
                  </div>
                  <div className="pt-5 pb-2">
                    <h3 
                      className="text-base font-medium text-gray-900 mb-1.5 truncate cursor-pointer hover:text-gray-600 transition-colors"
                      onClick={() => openArtworkDetail(artwork)}
                    >
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-light mb-3">
                      {artwork.medium && <span>{artwork.medium}</span>}
                      {artwork.medium && <span className="mx-2 text-gray-300">|</span>}
                      <span>{artwork.width} x {artwork.height} {artwork.dimensionUnit}</span>
                    </p>
                    {Array.isArray(artwork.variants) && artwork.variants.length > 0 ? (
                      <div className="mb-4">
                        <span className="text-xs text-gray-400 font-light">
                          {artwork.variants.length + 1} sizes available
                        </span>
                        {(() => {
                          const allPrices: { price: number; currency: string }[] = [];
                          
                          if (artwork.priceAmount != null) {
                            const basePrice = parseFloat(String(artwork.priceAmount).replace(/,/g, ''));
                            if (!isNaN(basePrice) && basePrice > 0) {
                              allPrices.push({ price: basePrice, currency: artwork.priceCurrency || 'EUR' });
                            }
                          }
                          
                          artwork.variants.forEach(v => {
                            if (v && v.price != null) {
                              const variantPrice = parseFloat(String(v.price).replace(/,/g, ''));
                              if (!isNaN(variantPrice) && variantPrice > 0) {
                                allPrices.push({ price: variantPrice, currency: v.currency || artwork.priceCurrency || 'EUR' });
                              }
                            }
                          });
                          
                          if (allPrices.length === 0) return null;
                          
                          const lowest = allPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
                          const showFromPrefix = allPrices.length > 1;
                          
                          return (
                            <p className="text-sm text-gray-600 mt-1">
                              {showFromPrefix ? 'From ' : ''}{lowest.currency} {lowest.price.toLocaleString()}
                            </p>
                          );
                        })()}
                      </div>
                    ) : artwork.priceAmount ? (
                      <p className="text-sm text-gray-600 mb-4">
                        {artwork.priceCurrency} {artwork.priceAmount.toLocaleString()}
                      </p>
                    ) : null}
                    
                    {/* Like button row */}
                    <div className="flex items-center mb-4">
                      <button
                        onClick={() => handleLikeArtwork(artwork.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          likedArtworks.has(artwork.id)
                            ? 'text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill={likedArtworks.has(artwork.id) ? 'currentColor' : 'none'} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-xs">{artwork.likeCount}</span>
                      </button>
                    </div>
                    
                    {/* CTA Buttons - equal width, side by side */}
                    <div className="flex gap-3">
                      {onViewInRoom && (
                        <button
                          onClick={() => onViewInRoom(artwork)}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-center bg-[#1E2A3B] text-white rounded-lg hover:bg-[#2A3A4F] transition-colors"
                        >
                          View in Room
                        </button>
                      )}
                      {artwork.availability !== 'sold' && (
                        artwork.buyUrl ? (
                          <a
                            href={artwork.buyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-center border border-[#1E2A3B] text-[#1E2A3B] rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            View & Buy
                          </a>
                        ) : (
                          <button
                            onClick={() => setShowContactModal(true)}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-center border border-[#1E2A3B] text-[#1E2A3B] rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Inquire
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
            
            {/* Explore Exhibition CTA - only shown if artist has published exhibition */}
            {publishedExhibition && (
              <div className="mt-16 mb-4">
                <p className="text-center text-sm text-[#1E2A3B] mb-4">
                  Experience the artist's work in a fully immersive virtual exhibition.
                </p>
                <a
                  href={`#/embed/exhibitions/${publishedExhibition.id}`}
                  className="group w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-[#1E2A3B] text-[#1E2A3B] rounded-rvMd hover:bg-[#C9A24A] hover:border-[#C9A24A] hover:text-white transition-all duration-150"
                >
                  <svg className="w-5 h-5 flex-shrink-0 transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-semibold">View Artist's 360° Exhibition</span>
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {(profile.primaryMedium || profile.primaryStyleTags.length > 0 || profile.languages.length > 0) && (
        <section className="bg-white border-t border-rv-neutral py-10">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-rv-text mb-6">Artistic Practice</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {profile.primaryMedium && (
                <div>
                  <h3 className="text-sm font-medium text-rv-textMuted uppercase tracking-wide mb-2">Medium</h3>
                  <p className="text-rv-text font-semibold">{profile.primaryMedium}</p>
                </div>
              )}
              {profile.primaryStyleTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-rv-textMuted uppercase tracking-wide mb-2">Style</h3>
                  <p className="text-rv-text font-semibold">{profile.primaryStyleTags.join(', ')}</p>
                </div>
              )}
              {profile.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-rv-textMuted uppercase tracking-wide mb-2">Languages</h3>
                  <p className="text-rv-text font-semibold">{profile.languages.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Artwork Detail Modal */}
      {selectedArtwork && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeArtworkDetail}
        >
          <div 
            className="bg-white rounded-rvLg shadow-rvElevated max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row">
              {/* Image Section */}
              <div className="md:w-1/2 bg-rv-surface p-6">
                {(() => {
                  const galleryImages = selectedArtwork.galleryImages || [];
                  const allImages = [
                    { image_url: selectedArtwork.imageUrl, is_mockup: false },
                    ...galleryImages.filter(img => img.image_url !== selectedArtwork.imageUrl)
                  ];
                  
                  const safeIndex = Math.min(detailImageIndex, allImages.length - 1);
                  const currentImage = allImages[safeIndex] || allImages[0];
                  const displayUrl = currentImage.image_url.startsWith('/api/')
                    ? `${API_URL}${currentImage.image_url}`
                    : currentImage.image_url;
                  
                  return (
                    <>
                      <button
                        onClick={() => openZoom(displayUrl)}
                        className="aspect-square relative bg-white rounded-rvMd overflow-hidden mb-4 w-full cursor-zoom-in group"
                        title="Click to zoom"
                      >
                        <img
                          src={displayUrl}
                          alt={selectedArtwork.title}
                          className="w-full h-full object-contain"
                        />
                        {currentImage.is_mockup && (
                          <span className="absolute top-3 left-3 px-2 py-1 bg-[#C9A24A] text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                            Mockup
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to zoom
                        </span>
                      </button>
                      
                      {allImages.length > 1 && (
                        <div className="flex gap-2 justify-center">
                          {allImages.map((img, idx) => {
                            const thumbUrl = img.image_url.startsWith('/api/')
                              ? `${API_URL}${img.image_url}`
                              : img.image_url;
                            return (
                              <button
                                key={idx}
                                onClick={() => setDetailImageIndex(idx)}
                                className={`w-16 h-16 rounded-rvMd overflow-hidden border-2 transition-colors ${
                                  idx === safeIndex ? 'border-rv-primary' : 'border-transparent'
                                }`}
                              >
                                <img
                                  src={thumbUrl}
                                  alt={`${selectedArtwork.title} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* Info Section */}
              <div className="md:w-1/2 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-rv-text">{selectedArtwork.title}</h2>
                  <button
                    onClick={closeArtworkDetail}
                    className="p-2 hover:bg-rv-surface rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-rv-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Artwork Info */}
                <div className="space-y-3 mb-6">
                  {selectedArtwork.medium && (
                    <div>
                      <span className="text-sm text-rv-textMuted">Medium:</span>
                      <span className="ml-2 font-medium text-rv-text">{selectedArtwork.medium}</span>
                    </div>
                  )}
                  
                  {selectedArtwork.styleTags && selectedArtwork.styleTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedArtwork.styleTags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs font-medium bg-rv-surface text-rv-textMuted rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedArtwork.availability === 'sold' 
                        ? 'bg-red-100 text-red-600' 
                        : selectedArtwork.availability === 'on_request'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-rv-primary/10 text-rv-primary'
                    }`}>
                      {selectedArtwork.availability === 'sold' ? 'Sold' 
                        : selectedArtwork.availability === 'on_request' ? 'On Request' 
                        : 'Available'}
                    </span>
                    
                    {Array.isArray(selectedArtwork.variants) && selectedArtwork.variants.length > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-[#C9A24A]/10 text-[#C9A24A] rounded-full">
                        Available in {selectedArtwork.variants.length + 1} sizes
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Sizes & Prices */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-rv-text mb-3 uppercase tracking-wide">Sizes & Pricing</h3>
                  
                  {/* Original Size */}
                  <div 
                    onClick={() => setSelectedVariantIndex(null)}
                    className={`p-3 rounded-rvMd border mb-2 cursor-pointer transition-colors ${
                      selectedVariantIndex === null 
                        ? 'border-rv-primary bg-rv-primary/5' 
                        : 'border-rv-neutral hover:border-rv-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-rv-text">
                          {selectedArtwork.width} × {selectedArtwork.height} {selectedArtwork.dimensionUnit}
                        </span>
                        <span className="text-xs text-rv-textMuted ml-2">(Original)</span>
                      </div>
                      {selectedArtwork.priceAmount ? (
                        <span className="font-bold text-rv-primary">
                          {selectedArtwork.priceCurrency} {selectedArtwork.priceAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-rv-textMuted">Price on request</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Variants */}
                  {Array.isArray(selectedArtwork.variants) && selectedArtwork.variants.map((variant, idx) => {
                    const price = variant.price ? parseFloat(String(variant.price).replace(/,/g, '')) : null;
                    return (
                      <div 
                        key={idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`p-3 rounded-rvMd border mb-2 cursor-pointer transition-colors ${
                          selectedVariantIndex === idx 
                            ? 'border-rv-primary bg-rv-primary/5' 
                            : 'border-rv-neutral hover:border-rv-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-rv-text">
                            {variant.width} × {variant.height} {variant.unit || selectedArtwork.dimensionUnit}
                          </span>
                          <div className="flex items-center gap-3">
                            {price && price > 0 ? (
                              <span className="font-bold text-rv-primary">
                                {variant.currency || selectedArtwork.priceCurrency} {price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-sm text-rv-textMuted">Price on request</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              variant.availability === 'sold' 
                                ? 'bg-red-100 text-red-600' 
                                : variant.availability === 'on_request'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-rv-primary/10 text-rv-primary'
                            }`}>
                              {variant.availability === 'sold' ? 'Sold' 
                                : variant.availability === 'on_request' ? 'On Request' 
                                : 'Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Actions */}
                <div className="space-y-3">
                  {onViewInRoom && (
                    <button
                      onClick={() => {
                        onViewInRoom(selectedArtwork);
                        closeArtworkDetail();
                      }}
                      className="w-full px-4 py-3 font-semibold bg-rv-primary/10 text-rv-primary rounded-rvMd hover:bg-rv-primary/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      View in Room
                    </button>
                  )}
                  
                  {selectedArtwork.availability !== 'sold' && selectedArtwork.buyUrl && (
                    <a
                      href={selectedArtwork.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3 font-semibold bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      View & Buy
                    </a>
                  )}
                  
                  <button
                    onClick={() => openContactAboutArtwork(selectedArtwork)}
                    className="w-full px-4 py-3 font-semibold border border-rv-neutral text-rv-text rounded-rvMd hover:bg-rv-surface transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Artist About This Artwork
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-rvLg shadow-rvElevated max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-rv-text">Contact {profile.displayName}</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setMessageError(null);
                }}
                className="p-2 hover:bg-rv-surface rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-rv-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {messageSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-rv-text mb-2">Message Sent!</h4>
                <p className="text-rv-textMuted">The artist will receive your message via email.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-rv-text mb-1">Your Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rv-text mb-1">Your Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rv-text mb-1">Message</label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message to the artist..."
                      className="w-full h-32 px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary resize-none"
                    />
                  </div>
                </div>
                
                {messageError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-rvMd">
                    <p className="text-sm text-red-600">{messageError}</p>
                  </div>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setMessageError(null);
                    }}
                    className="flex-1 px-4 py-3 border border-rv-neutral rounded-rvMd font-semibold hover:bg-rv-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendPublicMessage}
                    disabled={sendingMessage || !contactName.trim() || !contactEmail.trim() || !contactMessage.trim()}
                    className="flex-1 px-4 py-3 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Zoom Lightbox */}
      {zoomImageUrl && (
        <div 
          className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeZoom();
          }}
          onWheel={handleZoomWheel}
          ref={zoomContainerRef}
        >
          {/* Close button */}
          <button
            onClick={closeZoom}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Close zoom"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Zoom level indicator */}
          <div className="absolute top-4 left-4 px-3 py-2 bg-white/10 rounded-full text-white text-sm font-medium">
            {zoomScale > 1 ? `${Math.round(zoomScale * 100)}%` : 'Scroll to zoom'}
          </div>
          
          {/* Zoom controls hint */}
          {zoomScale === 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white text-sm">
              Use scroll wheel to zoom, drag to pan when zoomed
            </div>
          )}
          
          {/* Image container - centered with overflow visible to prevent black space */}
          <div
            className="relative flex items-center justify-center select-none"
            style={{ 
              width: '90vw', 
              height: '90vh',
              cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
            }}
            onMouseDown={handleZoomMouseDown}
            onMouseMove={handleZoomMouseMove}
            onMouseUp={handleZoomMouseUp}
            onMouseLeave={handleZoomMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={zoomImageUrl}
              alt="Zoomed artwork"
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoomScale}) translate(${zoomPosition.x / zoomScale}px, ${zoomPosition.y / zoomScale}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                touchAction: 'none',
                willChange: 'transform'
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtistPublicProfile;
