import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImpersonationBanner } from '../ImpersonationBanner';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Collection {
  id: number;
  gallery_id: number;
  title: string;
  subtitle?: string;
  description?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
}

export default function CollectionDetail() {
  const { user } = useAuth();
  
  const getCollectionIdFromHash = () => {
    const hash = window.location.hash;
    const match = hash.match(/#\/dashboard\/gallery\/collection\/(\d+)/);
    return match ? match[1] : null;
  };
  
  const [collectionId, setCollectionId] = useState<string | null>(getCollectionIdFromHash);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
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

  const [statusUpdate, setStatusUpdate] = useState<'draft' | 'published'>('draft');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/#\/dashboard\/gallery\/collection\/(\d+)/);
      const newCollectionId = match ? match[1] : null;
      setCollectionId(newCollectionId);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (!collectionId) {
      window.location.hash = '#/dashboard/gallery';
    }
  }, [collectionId]);

  useEffect(() => {
    if (collectionId) {
      setCollection(null);
      setArtworks([]);
      setError('');
      fetchCollection();
      fetchArtworks();
    }
  }, [collectionId]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/collections`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }

      const data = await response.json();
      const foundCollection = data.collections.find((c: Collection) => c.id === parseInt(collectionId!));
      
      if (foundCollection) {
        setCollection(foundCollection);
        setStatusUpdate(foundCollection.status);
      } else {
        setError('Collection not found');
      }
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.message);
    }
  };

  const fetchArtworks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/collections/${collectionId}/artworks`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artworks');
      }

      const data = await response.json();
      setArtworks(data.artworks || []);
    } catch (err: any) {
      console.error('Error fetching artworks:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    if (!formData.title || !formData.artistName || !formData.widthValue || !formData.heightValue) {
      setError('Title, artist name, width, and height are required');
      return;
    }

    setLoading(true);
    setError('');

    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedFile);
    uploadFormData.append('title', formData.title);
    uploadFormData.append('artistName', formData.artistName);
    uploadFormData.append('widthValue', formData.widthValue);
    uploadFormData.append('heightValue', formData.heightValue);
    uploadFormData.append('dimensionUnit', formData.dimensionUnit);
    if (formData.priceAmount) {
      uploadFormData.append('priceAmount', formData.priceAmount);
    }
    uploadFormData.append('priceCurrency', formData.priceCurrency);
    if (formData.buyUrl) {
      uploadFormData.append('buyUrl', formData.buyUrl);
    }

    try {
      const response = await fetch(`${API_URL}/api/gallery/collections/${collectionId}/artworks`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload artwork');
      }

      const data = await response.json();
      setSuccess(data.message || 'Artwork uploaded successfully!');
      setFormData({
        title: '',
        artistName: '',
        widthValue: '',
        heightValue: '',
        dimensionUnit: 'cm',
        priceAmount: '',
        priceCurrency: 'EUR',
        buyUrl: ''
      });
      setSelectedFile(null);
      setUploadPreview(null);
      fetchArtworks();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtwork = async (artworkId: number) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/gallery/artworks/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete artwork');
      }

      const data = await response.json();
      setSuccess(data.message || 'Artwork deleted successfully!');
      setShowDeleteConfirm(null);
      fetchArtworks();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!collection) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/gallery/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: statusUpdate })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const data = await response.json();
      setSuccess(data.message || 'Status updated successfully!');
      
      setCollection(data.collection);
      setStatusUpdate(data.collection.status);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCollections = () => {
    window.location.hash = '#/dashboard/gallery';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBackToCollections}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Collections
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{collection.title}</h1>
              {collection.subtitle && (
                <p className="text-lg text-gray-600 mb-2">{collection.subtitle}</p>
              )}
              {collection.description && (
                <p className="text-gray-600 mb-4">{collection.description}</p>
              )}
              <div className="text-sm text-gray-500 space-y-1">
                <p>Created: {formatDate(collection.created_at)}</p>
                <p>Updated: {formatDate(collection.updated_at)}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm rounded ${
              collection.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {collection.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Change Status</h3>
            <div className="flex items-center gap-3">
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value as 'draft' | 'published')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={loading || statusUpdate === collection.status}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Artwork to Collection</h2>
          
          <form onSubmit={handleUploadArtwork} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artwork Image <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {uploadPreview && (
                <img src={uploadPreview} alt="Preview" className="mt-2 max-h-40 rounded" />
              )}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Artwork'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Artworks in this Collection ({artworks.length})
          </h2>

          {artworks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No artworks yet. Upload your first artwork above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                  <h3 className="font-semibold text-gray-900 mb-1">{artwork.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {artwork.artist_name}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {artwork.width_value} × {artwork.height_value} {artwork.dimension_unit}
                  </p>
                  {artwork.price_amount && (
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      {artwork.price_currency} {artwork.price_amount.toFixed(2)}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {artwork.buy_url && (
                      <a
                        href={artwork.buy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded hover:bg-green-200 transition-colors text-sm text-center"
                      >
                        View & Buy
                      </a>
                    )}
                    {showDeleteConfirm === artwork.id ? (
                      <div className="flex gap-1 flex-1">
                        <button
                          onClick={() => handleDeleteArtwork(artwork.id)}
                          className="flex-1 bg-red-600 text-white py-2 px-2 rounded hover:bg-red-700 transition-colors text-sm"
                          disabled={loading}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-2 rounded hover:bg-gray-400 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(artwork.id)}
                        className="bg-red-100 text-red-700 py-2 px-3 rounded hover:bg-red-200 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
