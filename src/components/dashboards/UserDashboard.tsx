import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { YourPlanCard } from '../YourPlanCard';
import { UpgradePrompt } from '../UpgradePrompt';
import { SiteHeader } from '../SiteHeader';
import { PLAN_LIMITS } from '../../config/planLimits';
import { API_URL, isAuthenticationError } from '../../utils/api';

interface Artwork {
  id: number;
  artist_id: number;
  title: string;
  image_url: string;
  width: number;
  height: number;
  dimension_unit: string;
  price_amount: number | string | null;
  price_currency: string;
  buy_url: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
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

export function UserDashboard() {
  const { user, logout } = useAuth();
  
  const handleSessionExpired = () => {
    logout();
    window.location.hash = '#/login';
  };
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const effectivePlan = user?.effectivePlan || 'user';
  const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.user;
  const maxArtworks = planLimits.maxArtworks;
  const isAtLimit = maxArtworks !== -1 && artworks.length >= maxArtworks;

  const [formData, setFormData] = useState({
    title: '',
    width: '',
    height: '',
    dimensionUnit: 'cm',
    priceAmount: '',
    priceCurrency: 'EUR',
    buyUrl: '',
    image: null as File | null
  });

  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    width?: string;
    height?: string;
    buyUrl?: string;
    image?: string;
  }>({});

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Handle authentication errors - logout and redirect to login
        if (isAuthenticationError(response.status)) {
          handleSessionExpired();
          return;
        }
        // Only show error for genuine failures (500+, network errors)
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        // For 403/404 - user may not have artworks or access, treat as empty
        setArtworks([]);
        return;
      }

      const data = await response.json();
      setArtworks(data.artworks || []);
    } catch (err: any) {
      // Only show error for network failures or server errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.error('Network error fetching artworks:', err);
        setError('Unable to connect. Please check your connection.');
      } else if (err.message?.includes('Server error')) {
        setError(err.message);
      } else {
        // For other errors, just log and show empty state
        console.error('Error fetching artworks:', err);
        setArtworks([]);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
      if (fieldErrors.image) {
        setFieldErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('SUBMIT_START', {
      title: formData.title,
      width: formData.width,
      height: formData.height,
      buyUrl: formData.buyUrl,
      hasImage: !!formData.image,
      imageName: formData.image?.name,
      imageSize: formData.image?.size,
      isEditing: !!editingArtwork,
      isAtLimit,
      artworkCount: artworks.length,
      maxArtworks
    });
    
    setError('');
    setSuccess('');
    setFieldErrors({});

    const errors: typeof fieldErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.width) {
      errors.width = 'Width is required';
    } else if (isNaN(parseFloat(formData.width)) || parseFloat(formData.width) <= 0) {
      errors.width = 'Width must be a positive number';
    }
    
    if (!formData.height) {
      errors.height = 'Height is required';
    } else if (isNaN(parseFloat(formData.height)) || parseFloat(formData.height) <= 0) {
      errors.height = 'Height must be a positive number';
    }
    
    if (!formData.buyUrl.trim()) {
      errors.buyUrl = 'Buy URL is required';
    } else if (!formData.buyUrl.startsWith('http://') && !formData.buyUrl.startsWith('https://')) {
      errors.buyUrl = 'Buy URL must start with http:// or https://';
    }
    
    if (!formData.image && !editingArtwork) {
      errors.image = 'Please select an image file';
    }
    
    if (Object.keys(errors).length > 0) {
      console.warn('SUBMIT_BLOCKED', { reason: 'validation_failed', errors });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    console.log('VALIDATION_PASSED, preparing FormData...');

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title.trim());
      formDataObj.append('width', formData.width);
      formDataObj.append('height', formData.height);
      formDataObj.append('dimensionUnit', formData.dimensionUnit);
      formDataObj.append('buyUrl', formData.buyUrl.trim());
      formDataObj.append('priceCurrency', formData.priceCurrency);
      if (formData.priceAmount) {
        formDataObj.append('priceAmount', formData.priceAmount);
      }
      if (formData.image) {
        formDataObj.append('image', formData.image);
        console.log('IMAGE_ATTACHED', { name: formData.image.name, size: formData.image.size, type: formData.image.type });
      }

      const url = editingArtwork
        ? `${API_URL}/api/artist/artworks/${editingArtwork.id}`
        : `${API_URL}/api/artist/artworks`;
      
      const method = editingArtwork ? 'PUT' : 'POST';

      console.log('FETCH_CALL', { method, url, hasImage: !!formData.image });

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formDataObj
      });

      console.log('FETCH_RESPONSE', { status: response.status, statusText: response.statusText, ok: response.ok });

      if (!response.ok) {
        // Handle authentication errors - logout and redirect to login
        if (isAuthenticationError(response.status)) {
          handleSessionExpired();
          return;
        }
        
        let errorMessage = 'Failed to save artwork';
        let isLimitError = false;
        let responseBody: any = null;
        try {
          responseBody = await response.json();
          errorMessage = responseBody.message || responseBody.error || errorMessage;
          console.error('SERVER_ERROR_RESPONSE', { status: response.status, body: responseBody });
          
          if (responseBody.error === 'Artwork limit reached' || (response.status === 403 && responseBody.limit !== undefined)) {
            isLimitError = true;
          }
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
          console.error('SERVER_ERROR_PARSE_FAILED', { status: response.status, statusText: response.statusText });
        }
        
        if (isLimitError) {
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('UPLOAD_SUCCESS', data);
      setSuccess(data.message || (editingArtwork ? 'Artwork updated successfully!' : 'Artwork uploaded successfully!'));
      
      setFormData({
        title: '',
        width: '',
        height: '',
        dimensionUnit: 'cm',
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
      console.error('SUBMIT_ERROR', { message: err.message, stack: err.stack });
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setFieldErrors({});
    setError('');
    
    let priceAmountStr = '';
    if (artwork.price_amount !== null && artwork.price_amount !== undefined && artwork.price_amount !== '') {
      priceAmountStr = artwork.price_amount.toString();
    }
    
    setFormData({
      title: artwork.title,
      width: artwork.width.toString(),
      height: artwork.height.toString(),
      dimensionUnit: artwork.dimension_unit || 'cm',
      priceAmount: priceAmountStr,
      priceCurrency: artwork.price_currency || 'EUR',
      buyUrl: artwork.buy_url,
      image: null
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingArtwork(null);
    setFieldErrors({});
    setError('');
    setFormData({
      title: '',
      width: '',
      height: '',
      dimensionUnit: 'cm',
      priceAmount: '',
      priceCurrency: 'EUR',
      buyUrl: '',
      image: null
    });
  };

  const handleDelete = async (artworkId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/artist/artworks/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        // Handle authentication errors - logout and redirect to login
        if (isAuthenticationError(response.status)) {
          handleSessionExpired();
          return;
        }
        throw new Error('Failed to delete artwork');
      }

      setSuccess('Artwork deleted successfully');
      setShowDeleteConfirm(null);
      await fetchArtworks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader showPlanBadge={true} />
      <ImpersonationBanner />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">User Dashboard</h1>
            <p className="text-rv-textMuted">Welcome back, {user?.email}!</p>
            <p className="text-rv-textMuted text-sm mt-1">Upload up to 3 artworks and instantly visualize them in our mockup rooms.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/studio"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rv-primary text-white text-sm font-semibold rounded-lg hover:bg-rv-primaryHover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Open Studio</span>
              <span className="sm:hidden">Studio</span>
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-rvMd">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-rvMd">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Usage indicator */}
        {maxArtworks !== -1 && (
          <div className={`mb-6 p-4 rounded-rvMd border ${isAtLimit ? 'bg-amber-50 border-amber-200' : 'bg-rv-primary/5 border-rv-primary/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAtLimit ? 'bg-amber-100' : 'bg-rv-primary/10'}`}>
                  <svg className={`w-5 h-5 ${isAtLimit ? 'text-amber-600' : 'text-rv-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${isAtLimit ? 'text-amber-700' : 'text-rv-primary'}`}>
                    {isAtLimit ? 'Artwork Limit Reached' : 'Artwork Usage'}
                  </p>
                  <p className={`text-sm ${isAtLimit ? 'text-amber-600' : 'text-rv-primary/80'}`}>
                    {artworks.length}/{maxArtworks} artwork{maxArtworks !== 1 ? 's' : ''} uploaded (Free plan)
                  </p>
                </div>
              </div>
              {isAtLimit && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 bg-rv-primary text-white rounded-rvMd text-sm font-semibold hover:bg-rv-primaryHover transition-colors shadow-rvSoft"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
            {isAtLimit && (
              <p className="mt-2 text-sm text-amber-600">
                You've reached your 3 artwork limit. Upgrade to Artist plan to upload up to 50 artworks.
              </p>
            )}
          </div>
        )}

        {/* Upload Form */}
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
                  className={`w-full px-4 py-2.5 border rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary ${fieldErrors.title ? 'border-red-500 bg-red-50' : 'border-rv-neutral'}`}
                  placeholder="Enter artwork title"
                />
                {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
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
                  className={`w-full px-4 py-2.5 border rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary ${fieldErrors.image ? 'border-red-500 bg-red-50' : 'border-rv-neutral'}`}
                />
                {fieldErrors.image && <p className="text-xs text-red-500 mt-1">{fieldErrors.image}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Dimensions <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2.5 border rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary ${fieldErrors.width ? 'border-red-500 bg-red-50' : 'border-rv-neutral'}`}
                      placeholder="Width"
                    />
                    {fieldErrors.width && <p className="text-xs text-red-500 mt-1">{fieldErrors.width}</p>}
                  </div>
                  <span className="flex items-center text-rv-textMuted font-bold">×</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2.5 border rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary ${fieldErrors.height ? 'border-red-500 bg-red-50' : 'border-rv-neutral'}`}
                      placeholder="Height"
                    />
                    {fieldErrors.height && <p className="text-xs text-red-500 mt-1">{fieldErrors.height}</p>}
                  </div>
                  <select
                    name="dimensionUnit"
                    value={formData.dimensionUnit}
                    onChange={handleInputChange}
                    className="px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white"
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </div>
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
                  type="text"
                  name="buyUrl"
                  value={formData.buyUrl}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary ${fieldErrors.buyUrl ? 'border-red-500 bg-red-50' : 'border-rv-neutral'}`}
                  placeholder="https://your-shop.com/product"
                />
                {fieldErrors.buyUrl ? (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.buyUrl}</p>
                ) : (
                  <p className="text-xs text-rv-textMuted mt-1">This link enables the Buy button in Studio and widgets.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || (isAtLimit && !editingArtwork)}
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

        {/* My Artworks Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-rv-primary">
            My Artworks <span className="text-base font-normal text-rv-textMuted">(Free plan – up to 3 artworks)</span>
          </h2>
          
          {artworks.length === 0 ? (
            <div className="text-center py-12 bg-rv-surface rounded-rvLg border border-rv-neutral">
              <p className="text-rv-textMuted text-lg">No artworks yet. Upload your first artwork above.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden">
                  <div className="aspect-square bg-rv-surface relative">
                    <img
                      src={artwork.image_url.startsWith('http') ? artwork.image_url : `${API_URL}${artwork.image_url}`}
                      alt={artwork.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.warn('Image failed to load:', artwork.image_url);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-rv-text">{artwork.title}</h3>
                    <p className="text-sm text-rv-textMuted mb-1">
                      {artwork.width} × {artwork.height} {artwork.dimension_unit || 'cm'}
                    </p>
                    {formatPrice(artwork.price_amount, artwork.price_currency) && (
                      <p className="text-sm font-semibold text-rv-accent mb-2">
                        {formatPrice(artwork.price_amount, artwork.price_currency)}
                      </p>
                    )}
                    
                    {artwork.tags && artwork.tags.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-rv-textMuted mb-1.5">AI-generated tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {artwork.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-0.5 text-xs bg-rv-surface text-rv-text rounded-full border border-rv-neutral"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(artwork.buy_url, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-block text-sm text-rv-primary hover:text-rv-primaryHover mb-3 underline cursor-pointer bg-transparent border-none p-0 text-left"
                    >
                      View & Buy →
                    </button>
                    
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
                        <p className="text-sm text-red-600 mb-2">Are you sure you want to delete this artwork?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(artwork.id)}
                            disabled={loading}
                            className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                          >
                            {loading ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-1.5 text-sm border border-rv-neutral rounded hover:bg-rv-surface transition-colors font-semibold"
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

        {/* Widget Embed Section */}
        <div className="mb-10 p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h2 className="text-2xl font-bold mb-4 text-rv-primary">Widget Embed</h2>
          <p className="text-rv-textMuted text-sm mb-4">
            Embed a widget on your website to let visitors preview your artworks in mockup rooms directly from your site.
            Preview how your widget will look once enabled.
          </p>
          {artworks.length === 0 ? (
            <div className="p-4 bg-rv-surface rounded-rvMd border border-rv-neutral">
              <p className="text-rv-textMuted text-sm">
                Upload at least 1 artwork to enable widget embed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">Embed Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`<iframe src="${window.location.origin}/#/studio?user=${user?.id}" width="100%" height="600" frameborder="0"></iframe>`}
                    className="flex-1 px-4 py-2.5 border border-rv-neutral rounded-rvMd bg-rv-surface text-sm text-rv-textMuted font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="${window.location.origin}/#/studio?user=${user?.id}" width="100%" height="600" frameborder="0"></iframe>`);
                      setSuccess('Embed code copied to clipboard!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    className="px-4 py-2.5 bg-rv-primary text-white rounded-rvMd text-sm font-semibold hover:bg-rv-primaryHover transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">Public Studio Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/#/studio?user=${user?.id}`}
                    className="flex-1 px-4 py-2.5 border border-rv-neutral rounded-rvMd bg-rv-surface text-sm text-rv-textMuted"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#/studio?user=${user?.id}`);
                      setSuccess('Link copied to clipboard!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    className="px-4 py-2.5 bg-rv-primary text-white rounded-rvMd text-sm font-semibold hover:bg-rv-primaryHover transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buy Button Integration Section */}
        <div className="mb-10 p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h2 className="text-2xl font-bold mb-4 text-rv-primary">Buy Button Integration</h2>
          <p className="text-rv-textMuted text-sm mb-4">
            Add a Buy URL to your artworks to let viewers purchase directly from your Studio and embedded widgets.
          </p>
          
          <div className="p-4 bg-rv-surface rounded-rvMd border border-rv-neutral mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                artworks.length > 0 && artworks.filter(a => a.buy_url).length === artworks.length
                  ? 'bg-green-100'
                  : artworks.filter(a => a.buy_url).length > 0
                  ? 'bg-amber-100'
                  : 'bg-gray-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  artworks.length > 0 && artworks.filter(a => a.buy_url).length === artworks.length
                    ? 'text-green-600'
                    : artworks.filter(a => a.buy_url).length > 0
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-rv-text">
                  {artworks.length === 0
                    ? '0/0 artworks have a Buy URL'
                    : `${artworks.filter(a => a.buy_url).length}/${artworks.length} artworks have a Buy URL`}
                </p>
                <p className="text-sm text-rv-textMuted">
                  {artworks.length === 0
                    ? 'Upload artworks to start selling'
                    : artworks.filter(a => a.buy_url).length === artworks.length
                    ? 'All artworks are ready for sale!'
                    : 'Add Buy URLs to enable purchase buttons'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-rv-text">Quick Checklist:</p>
            <ul className="space-y-1.5 text-sm text-rv-textMuted">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-rv-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Add a Buy URL when uploading or editing an artwork
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-rv-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Use your shop's product page URL (e.g., Etsy, Shopify, personal site)
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-rv-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                The Buy button will appear in Studio and embedded widgets
              </li>
            </ul>
          </div>
        </div>

        {/* Plan Card */}
        <div className="mb-10">
          <YourPlanCard />
        </div>

        {/* Account Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
            <h3 className="text-lg font-bold mb-3 text-rv-primary">Account Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Plan:</span> <span className="text-rv-textMuted">Free</span></p>
              <p>
                <span className="font-semibold text-rv-text">Email Confirmed:</span>{' '}
                {user?.emailConfirmed ? (
                  <span className="text-green-600 font-semibold">✓ Verified</span>
                ) : (
                  <span className="text-amber-600 font-semibold">⚠ Pending</span>
                )}
              </p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          variant="modal"
          message="On the Free plan, you can upload up to 3 artworks. Upgrade to Artist plan to add more artworks and unlock additional features."
          currentPlan="user"
          suggestedPlan="artist"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
