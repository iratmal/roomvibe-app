import { useState, useEffect, useCallback } from 'react';
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
  description?: string;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());

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
    buyUrl: '',
    description: ''
  });

  const [statusUpdate, setStatusUpdate] = useState<'draft' | 'published'>('draft');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/collections`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.collections)) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid response from server');
      }
      
      const foundCollection = data.collections.find((c: Collection) => c.id === parseInt(collectionId!));
      
      if (foundCollection) {
        setCollection(foundCollection);
        setStatusUpdate(foundCollection.status);
      } else {
        setError('Collection not found');
      }
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.message || 'Failed to load collection');
    } finally {
      setInitialLoading(false);
    }
  }, [collectionId]);

  const fetchArtworks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/collections/${collectionId}/artworks`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artworks');
      }

      const data = await response.json();
      
      if (!data) {
        console.error('Invalid API response:', data);
        setArtworks([]);
        return;
      }
      
      setArtworks(Array.isArray(data.artworks) ? data.artworks : []);
    } catch (err: any) {
      console.error('Error fetching artworks:', err);
      setError(err.message || 'Failed to load artworks');
      setArtworks([]);
    }
  }, [collectionId]);

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
      setInitialLoading(true);
      setCollection(null);
      setArtworks([]);
      setError('');
      fetchCollection();
      fetchArtworks();
    }
  }, [collectionId, fetchCollection, fetchArtworks]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (formData.description) {
      uploadFormData.append('description', formData.description);
    }

    try {
      const response = await fetch(`${API_URL}/api/gallery/collections/${collectionId}/artworks`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload artwork';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
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
        buyUrl: '',
        description: ''
      });
      setSelectedFile(null);
      setUploadPreview(null);
      fetchArtworks();
      
      window.dispatchEvent(new CustomEvent('gallery-collection-updated'));

      setTimeout(() => setSuccess(''), 5000);
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
      
      window.dispatchEvent(new CustomEvent('gallery-collection-updated'));

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!collection) return;

    setStatusLoading(true);
    setError('');
    setSuccess('');

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
      
      if (data.collection) {
        setCollection(data.collection);
        setStatusUpdate(data.collection.status);
      }
      
      window.dispatchEvent(new CustomEvent('gallery-collection-updated'));

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleBackToCollections = () => {
    window.location.hash = '#/dashboard/gallery';
  };

  const handlePreviewInStudio = (artworkId: number) => {
    const baseUrl = window.location.origin + window.location.pathname;
    window.open(`${baseUrl}#/studio?artworkId=${artworkId}&source=gallery`, '_blank');
  };

  const handleEditArtwork = (artworkId: number) => {
    window.location.hash = `#/dashboard/gallery/artwork/${artworkId}/edit`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#264C61] mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <ImpersonationBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={handleBackToCollections}
            className="mb-6 flex items-center gap-2 text-[#264C61] hover:text-[#1D3A4A] transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Collections
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}
          
          {!error && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl">
              <p className="text-amber-700 font-semibold">Collection not found. It may have been deleted.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <button
          onClick={handleBackToCollections}
          className="mb-6 flex items-center gap-2 text-[#264C61] hover:text-[#1D3A4A] transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collections
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

        <div className="mb-10 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 relative">
          <div className="absolute top-6 right-6">
            <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
              collection.status === 'published' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {collection.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-semibold text-[#264C61] mb-3 pr-28" style={{ fontFamily: 'Inter, sans-serif' }}>
            {collection.title}
          </h1>
          
          {collection.subtitle && (
            <p className="text-lg text-slate-500 mb-3">{collection.subtitle}</p>
          )}
          
          {collection.description && (
            <p className="text-slate-600 mb-6 max-w-3xl">{collection.description}</p>
          )}

          <a
            href={`#/gallery/exhibitions/${collection.id}/360-editor`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C9A24A] to-[#B8933F] text-[#0B1F2A] rounded-xl font-semibold text-sm hover:from-[#B8933F] hover:to-[#A7842E] transition-all shadow-md hover:shadow-lg mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Open 360° Virtual Exhibition</span>
            <span className="sm:hidden">Virtual Exhibition</span>
          </a>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Created {formatDate(collection.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated {formatDate(collection.updated_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value as 'draft' | 'published')}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all text-sm"
              disabled={statusLoading}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={statusLoading || statusUpdate === collection.status}
              className="px-6 py-2.5 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {statusLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>

        <div className="mb-10 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-semibold mb-2 text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Add Artwork to Collection
          </h2>
          <p className="text-sm text-slate-400 mb-8">Upload artworks to include in this exhibition</p>
          
          <form onSubmit={handleUploadArtwork} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all"
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all"
                    placeholder="e.g., Jane Doe"
                    required
                  />
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all"
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all"
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="priceAmount"
                      value={formData.priceAmount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all"
                      placeholder="1500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
                    <select
                      name="priceCurrency"
                      value={formData.priceCurrency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Artwork Image <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#264C61]/50 transition-colors bg-slate-50">
                    <input
                      type="file"
                      id="artwork-image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="artwork-image" className="cursor-pointer">
                      {uploadPreview ? (
                        <img src={uploadPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <div className="py-4">
                          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-slate-500 text-sm">Click to upload artwork image</p>
                          <p className="text-slate-400 text-xs mt-1">JPG, PNG, WEBP up to 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Buy URL (optional)</label>
                  <input
                    type="url"
                    name="buyUrl"
                    value={formData.buyUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all"
                    placeholder="https://example.com/artwork/123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description (optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-slate-50 hover:bg-white transition-all resize-none"
                    placeholder="About this artwork..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3.5 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#264C61]/25"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {loading ? 'Adding...' : 'Add Artwork to Collection'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6 text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Artworks in this Collection ({artworks.length})
          </h2>

          {artworks.length === 0 ? (
            <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="mb-6 mx-auto w-32 h-32 flex items-center justify-center">
                <svg className="w-24 h-24 text-slate-200" fill="none" viewBox="0 0 96 96">
                  <rect x="12" y="16" width="72" height="64" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="20" y="24" width="28" height="20" rx="2" stroke="#D8B46A" strokeWidth="2" fill="none"/>
                  <circle cx="30" cy="32" r="4" fill="currentColor"/>
                  <path d="M20 40 L28 32 L36 40 L44 30 L48 36" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="56" y="24" width="20" height="4" rx="1" fill="currentColor"/>
                  <rect x="56" y="32" width="16" height="3" rx="1" fill="currentColor"/>
                  <rect x="56" y="38" width="12" height="3" rx="1" fill="currentColor"/>
                  <rect x="20" y="52" width="56" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                No artworks in this collection yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                Upload your first artwork above to start building this exhibition.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 transition-all group overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                    {artwork.image_url && !failedImageIds.has(artwork.id) ? (
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => {
                          setFailedImageIds(prev => new Set(prev).add(artwork.id));
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
                        <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-medium">Image missing</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-[#264C61] mb-1 line-clamp-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">by {artwork.artist_name}</p>
                    
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-slate-500">
                        {artwork.width_value} × {artwork.height_value} {artwork.dimension_unit}
                      </span>
                      {artwork.price_amount && (
                        <span className="font-semibold text-[#264C61]">
                          {artwork.price_currency} {Number(artwork.price_amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePreviewInStudio(artwork.id)}
                        className="flex-1 px-3 py-2 text-sm bg-[#D8B46A] text-white rounded-lg hover:bg-[#c9a55b] transition-colors font-semibold flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                      </button>
                      
                      <button
                        onClick={() => handleEditArtwork(artwork.id)}
                        className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
                      >
                        Edit
                      </button>
                      
                      {artwork.buy_url && (
                        <a
                          href={artwork.buy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold"
                        >
                          Buy
                        </a>
                      )}
                      
                      <button
                        onClick={() => setShowDeleteConfirm(artwork.id)}
                        className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </div>

                    {showDeleteConfirm === artwork.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-700 mb-3 font-medium">
                          Delete this artwork?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteArtwork(artwork.id)}
                            className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                            disabled={loading}
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
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
