import React, { useState, useEffect } from 'react';
import { useAuth, useViewer } from '../../context/AuthContext';
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

interface ArtworkVariant {
  width: string;
  height: string;
  price: string;
  currency: string;
  availability: string;
  buyUrl: string;
}

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
  show_on_public_profile?: boolean;
  variants?: ArtworkVariant[];
  created_at: string;
  updated_at: string;
  artist_email?: string;
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

interface DashboardStats {
  unreadMessages: number;
  visibleToDesigners: boolean;
  visibleToGalleries: boolean;
}

interface Exhibition {
  id: number;
  title: string;
  subtitle: string | null;
  status: 'draft' | 'published';
  artworkCount: number;
  createdAt: string;
}

export function ArtistDashboard() {
  const { user, logout } = useAuth();
  const { effectivePlan: viewerPlan, planLimits: viewerPlanLimits } = useViewer();
  const [activeTab, setActiveTab] = useState<DashboardTab>('artworks');
  const [unreadCount, setUnreadCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ unreadMessages: 0, visibleToDesigners: false, visibleToGalleries: false });
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showWidgetModal, setShowWidgetModal] = useState<Artwork | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [showCreateExhibition, setShowCreateExhibition] = useState(false);
  const [exhibitionFormData, setExhibitionFormData] = useState({ title: '', subtitle: '' });
  const [showExhibitionDeleteConfirm, setShowExhibitionDeleteConfirm] = useState(false);
  
  const effectivePlan = viewerPlan || 'user';
  const isFreePlan = effectivePlan === 'user' || effectivePlan === 'free';
  const planLimits = viewerPlanLimits && Object.keys(viewerPlanLimits).length > 0 
    ? viewerPlanLimits 
    : PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.user;
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
    availability: 'available',
    showOnPublicProfile: true,
    hasVariants: false,
    variants: [] as Array<{ width: string; height: string; price: string; currency: string; availability: string; buyUrl: string }>
  });

  useEffect(() => {
    fetchArtworks();
    fetchUnreadCount();
    fetchExhibition();
  }, []);

  useEffect(() => {
    if (activeTab === 'artworks') {
      fetchUnreadCount();
    }
  }, [activeTab]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/profile/connect-stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const stats = data.stats || {};
        setUnreadCount(stats.unreadMessages || 0);
        setDashboardStats({
          unreadMessages: stats.unreadMessages || 0,
          visibleToDesigners: stats.visibleToDesigners || false,
          visibleToGalleries: stats.visibleToGalleries || false
        });
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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          console.log('Artworks access issue - showing empty state');
          setArtworks([]);
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch artworks');
      }

      const data = await response.json();
      setArtworks(data.artworks || []);
    } catch (err: any) {
      console.error('Error fetching artworks:', err);
      setArtworks([]);
    }
  };

  const fetchExhibition = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setExhibition(data.exhibition || null);
      }
    } catch (err) {
      console.error('Error fetching exhibition:', err);
    }
  };

  const handleCreateExhibition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibitionFormData.title.trim()) {
      setError('Exhibition title is required');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(exhibitionFormData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create exhibition');
      }
      
      const data = await response.json();
      setExhibition(data.exhibition);
      setShowCreateExhibition(false);
      setExhibitionFormData({ title: '', subtitle: '' });
      setSuccess('Exhibition created! Add artworks in the 360 editor.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExhibition = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete exhibition');
      }
      
      setExhibition(null);
      setSuccess('Exhibition deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatExhibitionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

    if (!formData.title || !formData.width || !formData.height) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.image && !editingArtwork) {
      setError('Please select an image');
      return;
    }

    if (formData.buyUrl && !formData.buyUrl.startsWith('http://') && !formData.buyUrl.startsWith('https://')) {
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
      formDataObj.append('showOnPublicProfile', String(formData.showOnPublicProfile));
      if (formData.hasVariants && formData.variants.length > 0) {
        formDataObj.append('variants', JSON.stringify(formData.variants));
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
        availability: 'available',
        showOnPublicProfile: true,
        hasVariants: false,
        variants: []
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
    
    const artworkVariants = artwork.variants || [];
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
      availability: artwork.availability || 'available',
      showOnPublicProfile: artwork.show_on_public_profile !== false,
      hasVariants: artworkVariants.length > 0,
      variants: artworkVariants
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
      availability: 'available',
      showOnPublicProfile: true,
      hasVariants: false,
      variants: []
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rv-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-rv-primary">
                      {artworks.length}{maxArtworks !== -1 ? `/${maxArtworks}` : ''}
                    </p>
                    <p className="text-xs text-rv-textMuted">Artworks</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rv-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-rv-primary">{unreadCount}</p>
                    <p className="text-xs text-rv-textMuted">Messages</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C9A24A]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#C9A24A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#C9A24A]">{exhibition ? 1 : 0} / 1</p>
                    <p className="text-xs text-rv-textMuted">Exhibitions</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    dashboardStats.visibleToDesigners ? 'bg-[#C9A24A]/10' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-5 h-5 ${dashboardStats.visibleToDesigners ? 'text-[#C9A24A]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${dashboardStats.visibleToDesigners ? 'text-[#C9A24A]' : 'text-gray-500'}`}>
                      {dashboardStats.visibleToDesigners ? 'Visible' : 'Hidden'}
                    </p>
                    <p className="text-xs text-rv-textMuted">To Designers</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    dashboardStats.visibleToGalleries ? 'bg-[#C9A24A]/10' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-5 h-5 ${dashboardStats.visibleToGalleries ? 'text-[#C9A24A]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${dashboardStats.visibleToGalleries ? 'text-[#C9A24A]' : 'text-gray-500'}`}>
                      {dashboardStats.visibleToGalleries ? 'Visible' : 'Hidden'}
                    </p>
                    <p className="text-xs text-rv-textMuted">To Galleries</p>
                  </div>
                </div>
              </div>
            </div>

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
                  Buy URL (optional)
                </label>
                <input
                  type="url"
                  name="buyUrl"
                  value={formData.buyUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="https://your-shop.com/product"
                />
                <p className="mt-1 text-xs text-rv-textMuted">Leave empty to use Contact Artist for inquiries</p>
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

              <div className="md:col-span-2 pt-4 border-t border-rv-neutral">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnPublicProfile}
                    onChange={(e) => setFormData(prev => ({ ...prev, showOnPublicProfile: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-rv-primary focus:ring-rv-primary"
                  />
                  <div>
                    <span className="font-semibold text-rv-text">Show on public profile</span>
                    <p className="text-xs text-rv-textMuted">Make this artwork visible on your public artist page</p>
                  </div>
                </label>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-rv-neutral">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.hasVariants}
                    onChange={(e) => {
                      const hasVariants = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        hasVariants,
                        variants: hasVariants && prev.variants.length === 0 
                          ? [{ width: prev.width, height: prev.height, price: prev.priceAmount, currency: prev.priceCurrency, availability: prev.availability, buyUrl: prev.buyUrl }]
                          : prev.variants
                      }));
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-rv-primary focus:ring-rv-primary"
                  />
                  <div>
                    <span className="font-semibold text-rv-text">Available in multiple sizes (prints / editions)</span>
                    <p className="text-xs text-rv-textMuted">Offer this artwork in different sizes with separate pricing</p>
                  </div>
                </label>

                {formData.hasVariants && (
                  <div className="space-y-4 mt-4 pl-8">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="p-4 bg-rv-surface rounded-rvMd border border-rv-neutral">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-rv-text">Size {index + 1}</span>
                          {formData.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  variants: prev.variants.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-500 text-sm hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-rv-textMuted mb-1">Width</label>
                            <input
                              type="number"
                              value={variant.width}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, width: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm"
                              placeholder="Width"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-rv-textMuted mb-1">Height</label>
                            <input
                              type="number"
                              value={variant.height}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, height: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm"
                              placeholder="Height"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-rv-textMuted mb-1">Price</label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, price: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm"
                              placeholder="Price"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-rv-textMuted mb-1">Availability</label>
                            <select
                              value={variant.availability}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, availability: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm bg-white"
                            >
                              <option value="available">Available</option>
                              <option value="sold">Sold Out</option>
                              <option value="limited">Limited</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs text-rv-textMuted mb-1">Buy URL (optional)</label>
                          <input
                            type="url"
                            value={variant.buyUrl}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index] = { ...variant, buyUrl: e.target.value };
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          variants: [...prev.variants, { width: '', height: '', price: '', currency: prev.priceCurrency, availability: 'available', buyUrl: '' }]
                        }));
                      }}
                      className="text-rv-primary text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add another size
                    </button>
                  </div>
                )}
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
            <div className="text-center py-16 bg-rv-surface rounded-rvLg border border-rv-neutral">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rv-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-rv-text mb-2">No artworks yet</h3>
              <p className="text-rv-textMuted max-w-md mx-auto mb-4">
                Upload your first artwork to start using Studio and the embeddable widget on your website.
              </p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors text-sm font-semibold"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Artwork
              </button>
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

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-rv-primary">My Exhibition</h2>
          
          {!exhibition ? (
            <div className="text-center py-12 bg-white rounded-rvLg border border-rv-neutral shadow-rvSoft">
              {showCreateExhibition ? (
                <form onSubmit={handleCreateExhibition} className="max-w-md mx-auto px-6">
                  <div className="mb-4 text-left">
                    <label className="block text-sm font-semibold mb-2 text-rv-text">
                      Exhibition Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exhibitionFormData.title}
                      onChange={(e) => setExhibitionFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                      placeholder="My Virtual Exhibition"
                      required
                    />
                  </div>
                  <div className="mb-6 text-left">
                    <label className="block text-sm font-semibold mb-2 text-rv-text">
                      Subtitle (optional)
                    </label>
                    <input
                      type="text"
                      value={exhibitionFormData.subtitle}
                      onChange={(e) => setExhibitionFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                      placeholder="A collection of my best works"
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Exhibition'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateExhibition(false)}
                      className="px-6 py-2.5 border border-rv-neutral text-rv-text rounded-rvMd font-semibold hover:bg-rv-surface transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C9A24A]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#C9A24A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-rv-text mb-2">Create your virtual exhibition</h3>
                  <p className="text-rv-textMuted max-w-md mx-auto mb-6">
                    Showcase your artworks in an immersive 360° virtual gallery that visitors can explore online.
                  </p>
                  <button
                    onClick={() => setShowCreateExhibition(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A24A] text-white rounded-rvMd font-semibold hover:bg-[#B8913A] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Exhibition
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white border border-rv-neutral rounded-rvLg shadow-rvSoft overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-rv-primary/10 to-[#C9A24A]/10 flex items-center justify-center">
                <svg className="w-16 h-16 text-rv-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-rv-primary line-clamp-1">
                    {exhibition.title}
                  </h3>
                  <span className={`flex-shrink-0 ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    exhibition.status === 'published' 
                      ? 'bg-[#C9A24A]/15 text-[#C9A24A]' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {exhibition.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>

                {exhibition.subtitle && (
                  <p className="text-sm text-rv-textMuted mb-3 line-clamp-1">{exhibition.subtitle}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-rv-textMuted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{exhibition.artworkCount} {exhibition.artworkCount === 1 ? 'artwork' : 'artworks'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-rv-textMuted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created {formatExhibitionDate(exhibition.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`#/gallery/exhibitions/${exhibition.id}/360-editor`}
                    className="flex-1 px-3 py-2 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-all font-semibold text-center"
                  >
                    Edit
                  </a>
                  <a
                    href={`#/exhibition/${exhibition.id}`}
                    className="flex-1 px-3 py-2 text-sm bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-all font-semibold text-center flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Virtual Exhibition
                  </a>
                  <button
                    onClick={() => setShowExhibitionDeleteConfirm(true)}
                    className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-rvMd hover:bg-red-50 transition-all font-medium"
                  >
                    Delete
                  </button>
                </div>

                {showExhibitionDeleteConfirm && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-rvMd">
                    <p className="text-sm text-red-700 mb-3 font-medium">
                      Delete this exhibition and all its artworks?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleDeleteExhibition(exhibition.id);
                          setShowExhibitionDeleteConfirm(false);
                        }}
                        disabled={loading}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowExhibitionDeleteConfirm(false)}
                        className="flex-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-rvMd hover:bg-red-100 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
                <h3 className="text-lg font-bold mb-3 text-rv-primary">Artist Account</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
                  <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Artist</span></p>
                  <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-[#C9A24A] font-semibold">✓ Verified</span> : <span className="text-amber-600 font-semibold">⚠ Pending</span>}</p>
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
                    src={showWidgetModal.image_url.startsWith('http') ? showWidgetModal.image_url : `${API_URL}${showWidgetModal.image_url}`}
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
