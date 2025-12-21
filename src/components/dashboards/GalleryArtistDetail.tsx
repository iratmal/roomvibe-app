import { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Artist {
  id: number;
  name: string;
  email: string;
  bio?: string;
  city?: string;
  country?: string;
  primaryMedium?: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

interface Artwork {
  id: number;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  dimensionUnit: string;
  orientation?: string;
  styleTags: string[];
  dominantColors: string[];
  medium?: string;
  availability?: string;
}

interface GalleryArtistDetailProps {
  artistId: number;
  onBack: () => void;
  onContactArtist: (artist: Artist, artwork?: Artwork) => void;
}

export function GalleryArtistDetail({ artistId, onBack, onContactArtist }: GalleryArtistDetailProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    fetchArtistDetail();
  }, [artistId]);

  const fetchArtistDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/gallery/artist-directory/${artistId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artist details');
      }

      const data = await response.json();
      setArtist(data.artist);
      setArtworks(data.artworks || []);
    } catch (err: any) {
      console.error('Error fetching artist:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#264C61] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Artist not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-[#264C61] border border-[#264C61] rounded-lg hover:bg-[#264C61]/5 transition-colors"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-[#264C61] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Artist Directory
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {artist.profileImageUrl ? (
              <img
                src={artist.profileImageUrl}
                alt={artist.name}
                className="w-32 h-32 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#264C61] flex items-center justify-center text-white text-4xl font-semibold flex-shrink-0">
                {artist.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {artist.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                {(artist.city || artist.country) && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[artist.city, artist.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {artist.primaryMedium && (
                  <span className="px-2 py-0.5 bg-[#D8B46A]/10 text-[#D8B46A] rounded-full text-xs font-medium">
                    {artist.primaryMedium}
                  </span>
                )}
              </div>

              {artist.bio && (
                <p className="mt-4 text-slate-600 leading-relaxed">{artist.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => onContactArtist(artist)}
                  className="px-6 py-2.5 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-colors font-medium"
                >
                  Contact Artist
                </button>
                {artist.websiteUrl && (
                  <a
                    href={artist.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    Website
                  </a>
                )}
                {artist.instagramUrl && (
                  <a
                    href={artist.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[#264C61] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          Artworks ({artworks.length})
        </h2>

        {artworks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">No artworks available from this artist</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                onClick={() => setSelectedArtwork(artwork)}
                className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {artwork.availability && (
                    <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                      artwork.availability === 'available' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {artwork.availability}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-slate-800 text-sm truncate">{artwork.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {artwork.width} × {artwork.height} {artwork.dimensionUnit}
                  </p>
                  {artwork.medium && (
                    <p className="text-xs text-[#D8B46A] mt-1 truncate">{artwork.medium}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedArtwork && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="aspect-video bg-slate-100">
                <img
                  src={selectedArtwork.imageUrl}
                  alt={selectedArtwork.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-semibold text-[#264C61] mb-4">{selectedArtwork.title}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-0.5">Dimensions</p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedArtwork.width} × {selectedArtwork.height} {selectedArtwork.dimensionUnit}
                  </p>
                </div>
                {selectedArtwork.medium && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Medium</p>
                    <p className="text-sm font-medium text-slate-800">{selectedArtwork.medium}</p>
                  </div>
                )}
                {selectedArtwork.orientation && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Orientation</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{selectedArtwork.orientation}</p>
                  </div>
                )}
                {selectedArtwork.availability && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Availability</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{selectedArtwork.availability}</p>
                  </div>
                )}
              </div>

              {selectedArtwork.styleTags.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Style Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArtwork.styleTags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  onContactArtist(artist, selectedArtwork);
                  setSelectedArtwork(null);
                }}
                className="w-full px-6 py-3 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-colors font-medium"
              >
                Contact Artist About This Work
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
