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
  languages: string[];
  visibleToDesigners: boolean;
  visibleToGalleries: boolean;
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
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [slug]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setArtworks(data.artworks);
      setArtistId(data.artistId);
    } catch (err) {
      console.error('Error fetching artist profile:', err);
      setError('Failed to load artist profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !artistId || !contactMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: artistId,
          subject: `Inquiry from ${user.email}`,
          body: contactMessage,
          senderRole: user.entitlements?.gallery_access ? 'gallery' : 
                      user.entitlements?.designer_access ? 'designer' : 'user'
        })
      });

      if (response.ok) {
        setMessageSent(true);
        setContactMessage('');
        setTimeout(() => {
          setShowContactModal(false);
          setMessageSent(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
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

              {(profile.visibleToDesigners || profile.visibleToGalleries) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {profile.visibleToDesigners && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Visible to Designers
                    </span>
                  )}
                  {profile.visibleToGalleries && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Visible to Galleries
                    </span>
                  )}
                </div>
              )}

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
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (user) {
                      setShowContactModal(true);
                    } else {
                      window.location.hash = '#/login';
                    }
                  }}
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
              {artworks.map((artwork) => (
                <div key={artwork.id} className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden group">
                  <div className="aspect-square bg-rv-surface relative overflow-hidden">
                    <img
                      src={artwork.imageUrl.startsWith('/api/') ? `${API_URL}${artwork.imageUrl}` : artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {artwork.availability === 'sold' && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        SOLD
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-rv-text mb-1 truncate">{artwork.title}</h3>
                    <p className="text-sm text-rv-textMuted mb-2">
                      {artwork.width} x {artwork.height} {artwork.dimensionUnit}
                      {artwork.medium && ` • ${artwork.medium}`}
                    </p>
                    {artwork.priceAmount && (
                      <p className="text-lg font-bold text-rv-primary mb-3">
                        {artwork.priceCurrency} {artwork.priceAmount.toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {onViewInRoom && (
                        <button
                          onClick={() => onViewInRoom(artwork)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-rv-primary/10 text-rv-primary rounded-rvMd hover:bg-rv-primary/20 transition-colors"
                        >
                          View in Room
                        </button>
                      )}
                      {artwork.buyUrl && artwork.availability !== 'sold' && (
                        <a
                          href={artwork.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 text-sm font-medium text-center bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors"
                        >
                          View & Buy
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-rvLg shadow-rvElevated max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-rv-text">Contact {profile.displayName}</h3>
              <button
                onClick={() => setShowContactModal(false)}
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
                <p className="text-rv-textMuted">The artist will receive your message in their inbox.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write your message to the artist..."
                  className="w-full h-40 px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-3 border border-rv-neutral rounded-rvMd font-semibold hover:bg-rv-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !contactMessage.trim()}
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
