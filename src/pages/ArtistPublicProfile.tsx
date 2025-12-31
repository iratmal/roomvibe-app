import React, { useState, useEffect } from 'react';
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

export function ArtistPublicProfile({ slug, onContactClick, onViewInRoom }: ArtistPublicProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artistId, setArtistId] = useState<number | null>(null);
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

  useEffect(() => {
    fetchProfile();
    loadLikedArtworks();
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

      const response = await fetch(`${API_URL}/api/public/artist/${slug}`);
      
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

  return (
    <div className="min-h-screen bg-rv-surface">
      <section className="bg-white border-b border-rv-neutral">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          {isOwner && (
            <a
              href="#/dashboard/artist"
              className="inline-flex items-center gap-2 text-rv-textMuted hover:text-rv-text transition-colors mb-6 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
          )}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.displayName}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-rv-primary/20"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-rv-primary/10 flex items-center justify-center border-4 border-rv-primary/20">
                  <svg className="w-16 h-16 text-rv-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-rv-text mb-2">
                {profile.displayName || 'Artist'}
              </h1>

              {location && (
                <p className="text-rv-textMuted text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </p>
              )}

              {profile.primaryMedium && (
                <p className="text-rv-primary font-medium mb-4">{profile.primaryMedium}</p>
              )}

              {profile.primaryStyleTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.primaryStyleTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-rv-primary/10 text-rv-primary rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links - Visible to everyone */}
              {(profile.websiteUrl || profile.instagramUrl || profile.facebookUrl || profile.tiktokUrl || profile.linkedinUrl || profile.pinterestUrl || profile.etsyUrl) && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="Website"
                    >
                      <svg className="w-5 h-5 text-rv-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </a>
                  )}
                  {profile.instagramUrl && (
                    <a
                      href={profile.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="Instagram"
                    >
                      <svg className="w-5 h-5 text-rv-text" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {profile.facebookUrl && (
                    <a
                      href={profile.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="Facebook"
                    >
                      <svg className="w-5 h-5 text-rv-text" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {profile.tiktokUrl && (
                    <a
                      href={profile.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="TikTok"
                    >
                      <svg className="w-5 h-5 text-rv-text" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="LinkedIn"
                    >
                      <svg className="w-5 h-5 text-rv-text" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {profile.pinterestUrl && (
                    <a
                      href={profile.pinterestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="Pinterest"
                    >
                      <svg className="w-5 h-5 text-rv-text" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                      </svg>
                    </a>
                  )}
                  {profile.etsyUrl && (
                    <a
                      href={profile.etsyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-rv-surface hover:bg-rv-neutral transition-colors"
                      title="Etsy Shop"
                    >
                      <svg className="w-5 h-5 text-rv-text" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.559 3.89c-.502.156-.623.201-.968.499-.345.301-.401.523-.401 1.878v1.68H5.191v2.015l1.999.091v7.873c0 .903.045 1.436.133 1.68.134.378.345.624.857.99.523.38 1.269.591 2.227.691.712.056 2.237 0 3.24-.134v-2.217c-.759.156-1.414.156-1.904.067-.502-.1-.68-.29-.769-.757-.045-.223-.067-1.771-.067-3.475V10.053h2.884V8.038h-2.884V4.93c0-.045-.267 0-.501.056-.223.067-.812.234-1.292.412l-.835.29v2.306H6.535v2.015h1.744v7.395c0 1.703.089 2.762.267 3.163.179.401.535.769 1.07 1.103.536.334 1.181.535 1.949.624.769.089 1.893.044 2.918-.134l.111-.022V19.48c-.935.178-1.748.2-2.361.044-.613-.156-.924-.49-1.002-1.025-.045-.312-.067-1.47-.067-3.508v-4.938h3.04V8.038h-3.04V4.707c0-.045-.134 0-.356.067l-1.249.391z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}

              {/* CTA Buttons - Contact Artist visible to everyone */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="px-6 py-3 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors shadow-rvSoft"
                >
                  Contact Artist
                </button>
                {artworks.length > 0 && (
                  <button
                    onClick={scrollToArtworks}
                    className="px-6 py-3 border-2 border-rv-primary text-rv-primary rounded-rvMd font-semibold hover:bg-rv-primary/5 transition-colors"
                  >
                    View Artworks
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {profile.bio && (
        <section className="bg-white border-b border-rv-neutral">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="text-2xl font-bold text-rv-text mb-4">About</h2>
            <p className="text-rv-text leading-relaxed whitespace-pre-wrap max-w-3xl">
              {profile.bio}
            </p>
          </div>
        </section>
      )}

      {artworks.length > 0 && (
        <section id="artworks-section" className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-rv-text mb-8">Artworks</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {artworks.map((artwork) => {
                const galleryImgs = artwork.galleryImages || [];
                const allImages: GalleryImage[] = [];
                
                if (artwork.imageUrl) {
                  allImages.push({ id: 0, image_url: artwork.imageUrl, display_order: 0, is_mockup: false });
                }
                
                galleryImgs.forEach(img => {
                  if (img.image_url && !allImages.some(existing => existing.image_url === img.image_url)) {
                    allImages.push(img);
                  }
                });
                
                if (allImages.length === 0) return null;
                
                const currentIndex = Math.min(artworkImageIndex[artwork.id] || 0, allImages.length - 1);
                const hasMultipleImages = allImages.length > 1;
                const currentImage = allImages[currentIndex];
                const imageUrl = currentImage.image_url.startsWith('/api/') 
                  ? `${API_URL}${currentImage.image_url}` 
                  : currentImage.image_url;

                return (
                <div key={artwork.id} className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden group">
                  <div 
                    className="aspect-square bg-rv-surface relative overflow-hidden cursor-pointer"
                    onClick={() => openArtworkDetail(artwork)}
                  >
                    <img
                      src={imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-contain transition-transform duration-300"
                    />
                    
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
                  <div className="p-4">
                    <h3 
                      className="font-bold text-rv-text mb-1 truncate cursor-pointer hover:text-rv-primary transition-colors"
                      onClick={() => openArtworkDetail(artwork)}
                    >
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-rv-textMuted mb-2">
                      {artwork.width} x {artwork.height} {artwork.dimensionUnit}
                      {artwork.medium && ` • ${artwork.medium}`}
                    </p>
                    {Array.isArray(artwork.variants) && artwork.variants.length > 0 ? (
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-[#C9A24A]/10 text-[#C9A24A] rounded-full">
                          Available in {artwork.variants.length + 1} sizes
                        </span>
                        {(() => {
                          const pricedVariants = artwork.variants.filter(v => {
                            if (!v || v.price == null) return false;
                            const parsed = parseFloat(String(v.price).replace(/,/g, ''));
                            return !isNaN(parsed) && parsed > 0;
                          });
                          if (pricedVariants.length === 0) return null;
                          const lowestVariant = pricedVariants.reduce((min, v) => {
                            const minPrice = parseFloat(String(min.price).replace(/,/g, ''));
                            const vPrice = parseFloat(String(v.price).replace(/,/g, ''));
                            return vPrice < minPrice ? v : min;
                          });
                          const displayPrice = parseFloat(String(lowestVariant.price).replace(/,/g, ''));
                          const displayCurrency = lowestVariant.currency || artwork.priceCurrency || 'EUR';
                          return (
                            <p className="text-lg font-bold text-rv-primary mt-2">
                              From {displayCurrency} {displayPrice.toLocaleString()}
                            </p>
                          );
                        })()}
                      </div>
                    ) : artwork.priceAmount ? (
                      <p className="text-lg font-bold text-rv-primary mb-3">
                        {artwork.priceCurrency} {artwork.priceAmount.toLocaleString()}
                      </p>
                    ) : null}
                    
                    {/* Like button */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => handleLikeArtwork(artwork.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                          likedArtworks.has(artwork.id)
                            ? 'bg-red-50 text-red-500'
                            : 'bg-rv-surface text-rv-textMuted hover:bg-red-50 hover:text-red-500'
                        }`}
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill={likedArtworks.has(artwork.id) ? 'currentColor' : 'none'} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm font-medium">{artwork.likeCount}</span>
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      {onViewInRoom && (
                        <button
                          onClick={() => onViewInRoom(artwork)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-rv-primary/10 text-rv-primary rounded-rvMd hover:bg-rv-primary/20 transition-colors"
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
                            className="flex-1 px-3 py-2 text-sm font-medium text-center bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors"
                          >
                            View & Buy
                          </a>
                        ) : (
                          <button
                            onClick={() => setShowContactModal(true)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-center bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors"
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
                      <div className="aspect-square relative bg-white rounded-rvMd overflow-hidden mb-4">
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
                      </div>
                      
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
                        : 'bg-green-100 text-green-600'
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
                                : 'bg-green-100 text-green-600'
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
    </div>
  );
}

export default ArtistPublicProfile;
