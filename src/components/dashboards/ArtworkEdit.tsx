import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImpersonationBanner } from '../ImpersonationBanner';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Artwork {
  id: number;
  collection_id: number;
  title: string;
  artist_name: string;
  image_url: string;
  width_value: number;
  height_value: number;
  dimension_unit: 'cm' | 'in';
  price_amount?: number;
  price_currency?: string;
  buy_url?: string;
}

export default function ArtworkEdit() {
  const { user } = useAuth();
  
  const getArtworkIdFromHash = () => {
    const hash = window.location.hash;
    const match = hash.match(/#\/dashboard\/gallery\/artwork\/(\d+)\/edit/);
    return match ? match[1] : null;
  };
  
  const [artworkId, setArtworkId] = useState<string | null>(getArtworkIdFromHash);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    widthValue: '',
    heightValue: '',
    dimensionUnit: 'cm' as 'cm' | 'in',
    priceAmount: '',
    priceCurrency: 'EUR',
    buyUrl: ''
  });

  const fetchArtwork = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/artworks/${artworkId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artwork');
      }

      const data = await response.json();
      
      if (!data || !data.artwork) {
        throw new Error('Invalid response from server');
      }
      
      const art = data.artwork;
      setArtwork(art);
      setFormData({
        title: art.title || '',
        artistName: art.artist_name || '',
        widthValue: art.width_value?.toString() || '',
        heightValue: art.height_value?.toString() || '',
        dimensionUnit: art.dimension_unit || 'cm',
        priceAmount: art.price_amount?.toString() || '',
        priceCurrency: art.price_currency || 'EUR',
        buyUrl: art.buy_url || ''
      });
    } catch (err: any) {
      console.error('Error fetching artwork:', err);
      setError(err.message || 'Failed to load artwork');
    } finally {
      setInitialLoading(false);
    }
  }, [artworkId]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/#\/dashboard\/gallery\/artwork\/(\d+)\/edit/);
      const newArtworkId = match ? match[1] : null;
      setArtworkId(newArtworkId);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (!artworkId) {
      window.location.hash = '#/dashboard/gallery';
    }
  }, [artworkId]);

  useEffect(() => {
    if (artworkId) {
      setInitialLoading(true);
      setArtwork(null);
      setError('');
      fetchArtwork();
    }
  }, [artworkId, fetchArtwork]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.artistName || !formData.widthValue || !formData.heightValue) {
      setError('Title, artist name, width, and height are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/gallery/artworks/${artworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          artistName: formData.artistName,
          widthValue: formData.widthValue,
          heightValue: formData.heightValue,
          dimensionUnit: formData.dimensionUnit,
          priceAmount: formData.priceAmount || null,
          priceCurrency: formData.priceCurrency,
          buyUrl: formData.buyUrl || null
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update artwork';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(data.message || 'Artwork updated successfully!');
      
      window.dispatchEvent(new CustomEvent('gallery-collection-updated'));

      setTimeout(() => {
        window.location.hash = `#/dashboard/gallery/collection/${artwork?.collection_id}`;
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (artwork) {
      window.location.hash = `#/dashboard/gallery/collection/${artwork.collection_id}`;
    } else {
      window.location.hash = '#/dashboard/gallery';
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283593] mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading artwork...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <ImpersonationBanner />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={handleCancel}
            className="mb-6 flex items-center gap-2 text-[#283593] hover:text-[#1a237e] transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}
          
          {!error && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl">
              <p className="text-amber-700 font-semibold">Artwork not found. It may have been deleted.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ImpersonationBanner />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <button
          onClick={handleCancel}
          className="mb-6 flex items-center gap-2 text-[#283593] hover:text-[#1a237e] transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl">
            <p className="text-green-700 font-semibold">{success}</p>
          </div>
        )}

        <div className="p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h1 className="text-3xl font-semibold text-[#283593] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Edit Artwork
          </h1>
          <p className="text-sm text-slate-400 mb-8">Update artwork details</p>
          
          <div className="mb-8">
            <div className="aspect-[4/3] max-w-md mx-auto bg-slate-100 rounded-xl overflow-hidden">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-400 text-center mt-3">
              Image cannot be changed. Delete and re-upload if you need a different image.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all"
                  placeholder="e.g., Sunset Over Mountains"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Artist Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all"
                  placeholder="e.g., Jane Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Width <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="widthValue"
                  value={formData.widthValue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all"
                  placeholder="70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Height <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="heightValue"
                  value={formData.heightValue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                <select
                  name="dimensionUnit"
                  value={formData.dimensionUnit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  name="priceAmount"
                  value={formData.priceAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
                <select
                  name="priceCurrency"
                  value={formData.priceCurrency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Buy URL (optional)</label>
              <input
                type="url"
                name="buyUrl"
                value={formData.buyUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] bg-slate-50 hover:bg-white transition-all"
                placeholder="https://example.com/artwork/123"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 bg-[#283593] text-white rounded-xl hover:bg-[#1a237e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#283593]/25"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
