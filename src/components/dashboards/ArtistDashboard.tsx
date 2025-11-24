import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';
import { ImpersonationBanner } from '../ImpersonationBanner';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Artwork {
  id: number;
  artist_id: number;
  title: string;
  image_url: string;
  width: number;
  height: number;
  price_amount: number | string | null;
  price_currency: string;
  buy_url: string;
  created_at: string;
  updated_at: string;
  artist_email?: string;
}

function formatPrice(priceAmount: number | string | null | undefined, currency: string): string | null {
  if (priceAmount === null || priceAmount === undefined || priceAmount === '') {
    return null;
  }
  
  const numericPrice = typeof priceAmount === 'number' ? priceAmount : parseFloat(priceAmount);
  
  if (!isFinite(numericPrice)) {
    return null;
  }
  
  return `${numericPrice.toFixed(2)} ${currency}`;
}

export function ArtistDashboard() {
  const { user, logout } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    width: '',
    height: '',
    priceAmount: '',
    priceCurrency: 'EUR',
    buyUrl: '',
    image: null as File | null
  });

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks`, {
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.width || !formData.height || !formData.buyUrl) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.image && !editingArtwork) {
      setError('Please select an image');
      return;
    }

    if (!formData.buyUrl.startsWith('http://') && !formData.buyUrl.startsWith('https://')) {
      setError('Buy URL must start with http:// or https://');
      return;
    }

    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('width', formData.width);
      formDataObj.append('height', formData.height);
      formDataObj.append('buyUrl', formData.buyUrl);
      formDataObj.append('priceCurrency', formData.priceCurrency);
      if (formData.priceAmount) {
        formDataObj.append('priceAmount', formData.priceAmount);
      }
      if (formData.image) {
        formDataObj.append('image', formData.image);
      }

      const url = editingArtwork
        ? `${API_URL}/api/artist/artworks/${editingArtwork.id}`
        : `${API_URL}/api/artist/artworks`;
      
      const method = editingArtwork ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formDataObj
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save artwork';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(data.message || (editingArtwork ? 'Artwork updated successfully!' : 'Artwork uploaded successfully!'));
      
      setFormData({
        title: '',
        width: '',
        height: '',
        priceAmount: '',
        priceCurrency: 'EUR',
        buyUrl: '',
        image: null
      });
      setEditingArtwork(null);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      await fetchArtworks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error saving artwork:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    
    let priceAmountStr = '';
    if (artwork.price_amount !== null && artwork.price_amount !== undefined && artwork.price_amount !== '') {
      priceAmountStr = artwork.price_amount.toString();
    }
    
    setFormData({
      title: artwork.title,
      width: artwork.width.toString(),
      height: artwork.height.toString(),
      priceAmount: priceAmountStr,
      priceCurrency: artwork.price_currency || 'EUR',
      buyUrl: artwork.buy_url,
      image: null
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingArtwork(null);
    setFormData({
      title: '',
      width: '',
      height: '',
      priceAmount: '',
      priceCurrency: 'EUR',
      buyUrl: '',
      image: null
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setSuccess('Artwork deleted successfully!');
      setShowDeleteConfirm(null);
      await fetchArtworks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error deleting artwork:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ImpersonationBanner />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">Artist Dashboard</h1>
            <p className="text-rv-textMuted">Upload and manage your artworks</p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 text-sm font-semibold border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors text-rv-text"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-rvMd text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-rvMd text-green-700">
            {success}
          </div>
        )}

        <div className="mb-10 p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h2 className="text-2xl font-bold mb-6 text-rv-primary">
            {editingArtwork ? 'Edit Artwork' : 'Add New Artwork'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="Enter artwork title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Image <span className="text-red-500">*</span>
                  {editingArtwork && <span className="text-rv-textMuted font-normal text-xs ml-2">(Leave empty to keep current image)</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!editingArtwork}
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Width (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="e.g. 80"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Price (optional)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    name="priceAmount"
                    value={formData.priceAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                    placeholder="e.g. 299.99"
                  />
                  <select
                    name="priceCurrency"
                    value={formData.priceCurrency}
                    onChange={handleInputChange}
                    className="px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Buy URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="buyUrl"
                  value={formData.buyUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="https://your-shop.com/product"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingArtwork ? 'Update Artwork' : 'Upload Artwork'}
              </button>

              {editingArtwork && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-rv-primary">My Artworks</h2>
          
          {artworks.length === 0 ? (
            <div className="text-center py-12 bg-rv-surface rounded-rvLg border border-rv-neutral">
              <p className="text-rv-textMuted text-lg">No artworks yet. Upload your first piece above!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden">
                  <div className="aspect-square bg-rv-surface relative">
                    <img
                      src={`${API_URL}${artwork.image_url}`}
                      alt={artwork.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-rv-text">{artwork.title}</h3>
                    <p className="text-sm text-rv-textMuted mb-1">
                      {artwork.width} × {artwork.height} cm
                    </p>
                    {formatPrice(artwork.price_amount, artwork.price_currency) && (
                      <p className="text-sm font-semibold text-rv-accent mb-3">
                        {formatPrice(artwork.price_amount, artwork.price_currency)}
                      </p>
                    )}
                    <a
                      href={artwork.buy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-rv-primary hover:text-rv-primaryHover mb-3 underline"
                    >
                      View & Buy →
                    </a>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(artwork)}
                        className="flex-1 px-4 py-2 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(artwork.id)}
                        className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </div>

                    {showDeleteConfirm === artwork.id && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-rvMd">
                        <p className="text-sm text-red-700 mb-2 font-semibold">
                          Are you sure you want to delete this artwork?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(artwork.id)}
                            className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-rvMd hover:bg-red-100 transition-colors font-semibold"
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-purple-50 rounded-rvLg border border-purple-200">
            <h3 className="text-lg font-bold mb-3 text-purple-700">Artist Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Artist</span></p>
              <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-green-600 font-semibold">✓ Verified</span> : <span className="text-amber-600 font-semibold">⚠ Pending</span>}</p>
              <p><span className="font-semibold text-rv-text">Artworks:</span> <span className="text-rv-textMuted">{artworks.length}</span></p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
