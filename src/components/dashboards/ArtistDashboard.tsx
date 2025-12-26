import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { YourPlanCard } from '../YourPlanCard';
import { UpgradePrompt } from '../UpgradePrompt';
import { SiteHeader } from '../SiteHeader';
import { PLAN_LIMITS } from '../../config/planLimits';
import { ArtistProfileForm } from './ArtistProfileForm';
import { ArtistInbox } from './ArtistInbox';
import { ArtistConnectWidget } from './ArtistConnectWidget';

type DashboardTab = 'artworks' | 'profile' | 'inbox' | 'settings';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

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
  orientation?: string;
  style_tags?: string[];
  dominant_colors?: string[];
  medium?: string;
  availability?: string;
  created_at: string;
  updated_at: string;
  artist_email?: string;
  requiresReupload?: boolean;
}

const STYLE_TAG_OPTIONS = [
  'Abstract', 'Contemporary', 'Figurative', 'Impressionist', 'Minimalist',
  'Modern', 'Pop Art', 'Realist', 'Surrealist', 'Traditional',
  'Expressionist', 'Conceptual', 'Street Art', 'Digital', 'Mixed Media'
];

const MEDIUM_OPTIONS = [
  'Oil', 'Acrylic', 'Watercolor', 'Pastel', 'Charcoal',
  'Ink', 'Mixed Media', 'Digital', 'Photography', 'Sculpture',
  'Printmaking', 'Collage', 'Encaustic', 'Gouache', 'Other'
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'on_request', label: 'On Request' }
];

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
  const [activeTab, setActiveTab] = useState<DashboardTab>('artworks');
  const [unreadCount, setUnreadCount] = useState(0);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showWidgetModal, setShowWidgetModal] = useState<Artwork | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Calculate plan info for usage display
  const effectivePlan = user?.effectivePlan || 'user';
  const isFreePlan = effectivePlan === 'user' || effectivePlan === 'free';
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
    image: null as File | null,
    medium: '',
    styleTags: [] as string[],
    availability: 'available'
  });

  useEffect(() => {
    fetchArtworks();
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/profile/connect-stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.stats?.unreadMessages || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

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

  const handleStyleTagToggle = (tag: string) => {
    setFormData(prev => {
      if (prev.styleTags.includes(tag)) {
        return { ...prev, styleTags: prev.styleTags.filter(t => t !== tag) };
      } else if (prev.styleTags.length < 5) {
        return { ...prev, styleTags: [...prev.styleTags, tag] };
      }
      return prev;
    });
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
      formDataObj.append('dimensionUnit', formData.dimensionUnit);
      formDataObj.append('buyUrl', formData.buyUrl);
      formDataObj.append('priceCurrency', formData.priceCurrency);
      if (formData.priceAmount) {
        formDataObj.append('priceAmount', formData.priceAmount);
      }
      if (formData.image) {
        formDataObj.append('image', formData.image);
      }
      if (formData.medium) {
        formDataObj.append('medium', formData.medium);
      }
      if (formData.styleTags.length > 0) {
        formDataObj.append('styleTags', JSON.stringify(formData.styleTags));
      }
      formDataObj.append('availability', formData.availability);

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
        let isLimitError = false;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Check if this is an artwork limit error
          if (errorData.error === 'Artwork limit reached' || response.status === 403 && errorData.limit !== undefined) {
            isLimitError = true;
          }
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        // Show upgrade modal for limit errors instead of generic error
        if (isLimitError) {
          setShowUpgradeModal(true);
          setLoading(false);
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(data.message || (editingArtwork ? 'Artwork updated successfully!' : 'Artwork uploaded successfully!'));
      
      setFormData({
        title: '',
        width: '',
        height: '',
        dimensionUnit: 'cm',
        priceAmount: '',
        priceCurrency: 'EUR',
        buyUrl: '',
        image: null,
        medium: '',
        styleTags: [],
        availability: 'available'
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
      dimensionUnit: artwork.dimension_unit || 'cm',
      priceAmount: priceAmountStr,
      priceCurrency: artwork.price_currency || 'EUR',
      buyUrl: artwork.buy_url,
      image: null,
      medium: artwork.medium || '',
      styleTags: artwork.style_tags || [],
      availability: artwork.availability || 'available'
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
      dimensionUnit: 'cm',
      priceAmount: '',
      priceCurrency: 'EUR',
      buyUrl: '',
      image: null,
      medium: '',
      styleTags: [],
      availability: 'available'
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

  const copyToClipboard = async (text: string, type: string = 'global') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy code to clipboard');
    }
  };

  const getGlobalWidgetCode = () => {
    return `<!-- RoomVibe - View in Room Widget -->
<script
  src="${window.location.origin}/widget.js"
  data-artist-id="${user?.id}">
</script>`;
  };

  const getArtworkWidgetCode = (artwork: Artwork) => {
    return `<!-- RoomVibe - View this artwork in Room -->
<script
  src="${window.location.origin}/widget.js"
  data-artist-id="${user?.id}"
  data-artwork-id="${artwork.id}">
</script>`;
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader showPlanBadge={true} />
      <ImpersonationBanner />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">Artist Dashboard</h1>
            <p className="text-rv-textMuted">Upload and manage your artworks</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/studio"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rv-primary text-white text-sm font-semibold rounded-lg hover:bg-rv-primaryHover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Open Studio</span>
              <span className="sm:hidden">Studio</span>
            </a>
          </div>
        </div>

        <div className="flex gap-1 mb-8 border-b border-rv-neutral overflow-x-auto">
          <button
            onClick={() => setActiveTab('artworks')}
            className={`px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'artworks'
                ? 'text-rv-primary border-b-2 border-rv-primary'
                : 'text-rv-textMuted hover:text-rv-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Artworks
            </span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-rv-primary border-b-2 border-rv-primary'
                : 'text-rv-textMuted hover:text-rv-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Artist Profile
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'inbox'
                ? 'text-rv-primary border-b-2 border-rv-primary'
                : 'text-rv-textMuted hover:text-rv-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Inbox
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-rv-primary text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'text-rv-primary border-b-2 border-rv-primary'
                : 'text-rv-textMuted hover:text-rv-text'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </span>
          </button>
        </div>

        {activeTab === 'artworks' && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-rvMd text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'artworks' && success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-rvMd text-green-700">
            {success}
          </div>
        )}

        {activeTab === 'artworks' && (
          <>
            <div className="mb-6">
              <ArtistConnectWidget 
                onViewInbox={() => setActiveTab('inbox')}
                onEditProfile={() => setActiveTab('profile')}
              />
            </div>

        {/* Usage indicator for free users */}
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
                    Artwork Upload Limit
                  </p>
                  <p className={`text-sm ${isAtLimit ? 'text-amber-600' : 'text-rv-primary/80'}`}>
                    {artworks.length}/{maxArtworks} artwork{maxArtworks !== 1 ? 's' : ''} uploaded
                    {isFreePlan && ' (Free plan)'}
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
            {isAtLimit && isFreePlan && (
              <p className="mt-2 text-sm text-amber-600">
                You've reached your 3 artwork limit. Upgrade to Artist plan to upload up to 50 artworks.
              </p>
            )}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Dimensions <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                    placeholder="Width"
                  />
                  <span className="flex items-center text-rv-textMuted font-bold">×</span>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                    placeholder="Height"
                  />
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
                  type="url"
                  name="buyUrl"
                  value={formData.buyUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="https://your-shop.com/product"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Medium
                </label>
                <select
                  name="medium"
                  value={formData.medium}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white"
                >
                  <option value="">Select medium</option>
                  {MEDIUM_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white"
                >
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Style Tags <span className="font-normal text-rv-textMuted">(select up to 5)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleStyleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.styleTags.includes(tag)
                          ? 'bg-rv-primary text-white'
                          : 'bg-rv-surface text-rv-text border border-rv-neutral hover:border-rv-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
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
                <div key={artwork.id} className={`bg-white rounded-rvLg shadow-rvSoft border overflow-hidden ${artwork.requiresReupload ? 'border-amber-400 border-2' : 'border-rv-neutral'}`}>
                  <div className="aspect-square bg-rv-surface relative">
                    {artwork.requiresReupload && (
                      <div className="absolute inset-0 bg-amber-50/90 flex flex-col items-center justify-center z-10 p-4">
                        <svg className="w-12 h-12 text-amber-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-amber-800 font-semibold text-center text-sm mb-2">Image Missing</p>
                        <p className="text-amber-700 text-xs text-center mb-3">Please re-upload this artwork's image</p>
                        <button
                          onClick={() => handleEdit(artwork)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-rvMd hover:bg-amber-600 transition-colors text-sm font-semibold"
                        >
                          Re-upload Image
                        </button>
                      </div>
                    )}
                    <img
                      src={`${API_URL}/api/artwork-image/${artwork.id}`}
                      alt={artwork.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.warn('Image failed to load for artwork:', artwork.id);
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

                    <button
                      onClick={() => setShowWidgetModal(artwork)}
                      className="w-full mt-2 px-4 py-2 text-sm border-2 border-rv-primary text-rv-primary rounded-rvMd hover:bg-rv-primary hover:text-white transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Get Widget Code
                    </button>

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

        <div className="mb-10 p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
          <h2 className="text-2xl font-bold mb-2 text-rv-primary">Website Integration</h2>
          <p className="text-sm text-rv-textMuted mb-6">
            Add the RoomVibe widget to your website so visitors can view your artwork in their own room.
          </p>

          <div className="bg-white p-4 rounded-rvMd border border-rv-neutral">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-rv-text">Global Widget Code</h3>
              <button
                onClick={() => copyToClipboard(getGlobalWidgetCode(), 'global')}
                className="px-4 py-2 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copySuccess === 'global' ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <textarea
              readOnly
              value={getGlobalWidgetCode()}
              className="w-full h-24 px-3 py-2 border border-rv-neutral rounded-rvMd bg-rv-surface font-mono text-xs text-rv-text resize-none focus:outline-none"
              onClick={(e) => e.currentTarget.select()}
            />
            <p className="text-xs text-rv-textMuted mt-2">
              Paste this code into your website's HTML to display a "View in Room" button for all your artworks.
            </p>
          </div>
        </div>
          </>
        )}

        {activeTab === 'profile' && (
          <ArtistProfileForm />
        )}

        {activeTab === 'inbox' && (
          <ArtistInbox onUnreadCountChange={setUnreadCount} />
        )}

        {activeTab === 'settings' && (
          <>
            <div className="mb-8">
              <YourPlanCard />
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
          </>
        )}

        {showWidgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-rvLg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-rv-primary">Widget Code for "{showWidgetModal.title}"</h3>
                  <p className="text-sm text-rv-textMuted mt-1">
                    Embed this code to show a "View in Room" button for this specific artwork.
                  </p>
                </div>
                <button
                  onClick={() => setShowWidgetModal(null)}
                  className="text-rv-textMuted hover:text-rv-text transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-rv-surface p-4 rounded-rvMd border border-rv-neutral mb-4">
                <div className="aspect-square max-h-48 mx-auto mb-3 bg-white rounded-rvMd overflow-hidden">
                  <img
                    src={`${API_URL}/api/artwork-image/${showWidgetModal.id}`}
                    alt={showWidgetModal.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-center text-rv-textMuted">
                  {showWidgetModal.width} × {showWidgetModal.height} {showWidgetModal.dimension_unit}
                  {showWidgetModal.price_amount && ` • ${formatPrice(showWidgetModal.price_amount, showWidgetModal.price_currency)}`}
                </p>
              </div>

              <div className="bg-white p-4 rounded-rvMd border border-rv-neutral">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-rv-text">Artwork Widget Code</h4>
                  <button
                    onClick={() => copyToClipboard(getArtworkWidgetCode(showWidgetModal), `artwork-${showWidgetModal.id}`)}
                    className="px-4 py-2 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copySuccess === `artwork-${showWidgetModal.id}` ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={getArtworkWidgetCode(showWidgetModal)}
                  className="w-full h-32 px-3 py-2 border border-rv-neutral rounded-rvMd bg-rv-surface font-mono text-xs text-rv-text resize-none focus:outline-none"
                  onClick={(e) => e.currentTarget.select()}
                />
                <p className="text-xs text-rv-textMuted mt-2">
                  Paste this code on the product page for "{showWidgetModal.title}" to show a "View in Room" button.
                </p>
              </div>

              <button
                onClick={() => setShowWidgetModal(null)}
                className="w-full mt-4 px-6 py-3 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Modal for artwork limit */}
        {showUpgradeModal && (
          <UpgradePrompt
            variant="modal"
            message="On the Free plan, you can upload up to 3 artworks. Upgrade your plan to add more artworks and unlock additional features."
            currentPlan="user"
            suggestedPlan="artist"
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </div>
    </div>
  );
}
