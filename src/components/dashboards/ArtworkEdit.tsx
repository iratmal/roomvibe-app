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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading artwork...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <ImpersonationBanner />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleCancel}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {!error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              Artwork not found. It may have been deleted.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ImpersonationBanner />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleCancel}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Collection
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Artwork</h1>
          
          <div className="mb-6">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full max-w-md h-64 object-cover rounded-lg mx-auto"
            />
            <p className="text-sm text-gray-500 text-center mt-2">
              Image cannot be changed. Delete and re-upload if you need a different image.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sunset Over Mountains"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artist Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Jane Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="widthValue"
                  value={formData.widthValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="heightValue"
                  value={formData.heightValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="dimensionUnit"
                  value={formData.dimensionUnit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  name="priceAmount"
                  value={formData.priceAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="priceCurrency"
                  value={formData.priceCurrency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buy URL (optional)</label>
              <input
                type="url"
                name="buyUrl"
                value={formData.buyUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/artwork/123"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
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
