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
import { ArtworkImageGallery } from './ArtworkImageGallery';

interface GalleryImage {
  id?: number;
  image_url: string;
  display_order: number;
  is_mockup: boolean;
  isNew?: boolean;
  file?: File;
  previewUrl?: string;
}

type DashboardTab = 'artworks' | 'profile' | 'inbox' | 'settings';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ArtworkVariant {
  width: string;
  height: string;
  unit?: string;
  price: string;
  currency: string;
  availability: string;
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
  coverImageUrl?: string | null;
}

export function ArtistDashboard() {
  const { user, logout } = useAuth();
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
  const [showEditExhibition, setShowEditExhibition] = useState(false);
  const [exhibitionFormData, setExhibitionFormData] = useState({ title: '', subtitle: '' });
  const [showExhibitionDeleteConfirm, setShowExhibitionDeleteConfirm] = useState(false);
  const [exhibitionArtworks, setExhibitionArtworks] = useState<any[]>([]);
  const [showAddExhibitionArtwork, setShowAddExhibitionArtwork] = useState(false);
  const [exhibitionArtworkForm, setExhibitionArtworkForm] = useState({ title: '', widthValue: '', heightValue: '', dimensionUnit: 'cm' });
  const [exhibitionArtworkImage, setExhibitionArtworkImage] = useState<File | null>(null);
  const [exhibitionArtworkPreview, setExhibitionArtworkPreview] = useState<string | null>(null);
  const [exhibitionArtworkLoading, setExhibitionArtworkLoading] = useState(false);
  const [deleteExhibitionArtworkId, setDeleteExhibitionArtworkId] = useState<number | null>(null);
  const [showStudioWarning, setShowStudioWarning] = useState(false);
  const [pendingStudioArtwork, setPendingStudioArtwork] = useState<Artwork | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [showUnpublishConfirmModal, setShowUnpublishConfirmModal] = useState(false);
  const [pendingExhibitionArtwork, setPendingExhibitionArtwork] = useState<Artwork | null>(null);
  
  const exhibitionSectionRef = React.useRef<HTMLDivElement>(null);
  
  const effectivePlan = user?.effectivePlan || user?.role || 'user';
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
    image: null as File | string | null,
    medium: '',
    styleTags: [] as string[],
    availability: 'available',
    showOnPublicProfile: true,
    hasVariants: false,
    variants: [] as Array<{ width: string; height: string; unit: string; price: string; currency: string; availability: string }>
  });
  const [promotedGalleryImageId, setPromotedGalleryImageId] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

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

  const prevDimensionUnit = React.useRef(formData.dimensionUnit);
  useEffect(() => {
    if (formData.variants.length > 0 && prevDimensionUnit.current !== formData.dimensionUnit) {
      const oldUnit = prevDimensionUnit.current;
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.map(v => 
          v.unit === oldUnit ? { ...v, unit: formData.dimensionUnit } : v
        )
      }));
    }
    prevDimensionUnit.current = formData.dimensionUnit;
  }, [formData.dimensionUnit]);

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
        if (data.exhibition) {
          fetchExhibitionArtworks(data.exhibition.id);
        }
      }
    } catch (err) {
      console.error('Error fetching exhibition:', err);
    }
  };

  const fetchExhibitionArtworks = async (exhibitionId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibitionId}/artworks`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setExhibitionArtworks(data.artworks || []);
      }
    } catch (err) {
      console.error('Error fetching exhibition artworks:', err);
    }
  };

  const handleAddExhibitionArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibition) return;
    if (!exhibitionArtworkForm.title.trim()) {
      setError('Artwork title is required');
      return;
    }
    if (!exhibitionArtworkImage) {
      setError('Artwork image is required');
      return;
    }
    
    if (!exhibitionArtworkForm.widthValue || !exhibitionArtworkForm.heightValue) {
      setError('Artwork dimensions (width and height) are required');
      return;
    }

    setExhibitionArtworkLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', exhibitionArtworkForm.title);
      formDataToSend.append('widthValue', exhibitionArtworkForm.widthValue);
      formDataToSend.append('heightValue', exhibitionArtworkForm.heightValue);
      formDataToSend.append('dimensionUnit', exhibitionArtworkForm.dimensionUnit);
      formDataToSend.append('image', exhibitionArtworkImage);

      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/artworks`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add artwork');
      }

      setSuccess('Artwork added to exhibition!');
      setExhibitionArtworkForm({ title: '', widthValue: '', heightValue: '', dimensionUnit: 'cm' });
      setExhibitionArtworkImage(null);
      setExhibitionArtworkPreview(null);
      setShowAddExhibitionArtwork(false);
      fetchExhibitionArtworks(exhibition.id);
      fetchExhibition();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExhibitionArtworkLoading(false);
    }
  };

  const handleDeleteExhibitionArtwork = async (artworkId: number) => {
    if (!exhibition) return;

    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/artworks/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setSuccess('Artwork removed from exhibition');
      setDeleteExhibitionArtworkId(null);
      fetchExhibitionArtworks(exhibition.id);
      fetchExhibition();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddToExhibition = async (artworkId: number) => {
    const artwork = artworks.find(a => a.id === artworkId);
    
    if (!exhibition) {
      if (artwork) {
        setPendingExhibitionArtwork(artwork);
      }
      setShowCreateExhibition(true);
      setActiveTab('artworks');
      setTimeout(() => {
        if (exhibitionSectionRef.current) {
          exhibitionSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/artworks/link/${artworkId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add artwork to exhibition');
      }

      setSuccess('Artwork added to exhibition!');
      fetchExhibitionArtworks(exhibition.id);
      fetchExhibition();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRemoveFromExhibition = async (artworkId: number) => {
    if (!exhibition) return;

    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/artworks/unlink/${artworkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove artwork from exhibition');
      }

      setSuccess('Artwork removed from exhibition');
      fetchExhibitionArtworks(exhibition.id);
      fetchExhibition();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const isArtworkInExhibition = (artworkId: number) => {
    return exhibitionArtworks.some(ea => ea.sourceArtworkId === artworkId);
  };

  const handleExhibitionArtworkImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setExhibitionArtworkImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setExhibitionArtworkPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        body: JSON.stringify({ ...exhibitionFormData, galleryType: 'classic' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create exhibition');
      }
      
      const data = await response.json();
      setExhibition(data.exhibition);
      setExhibitionArtworks([]);
      setShowCreateExhibition(false);
      setExhibitionFormData({ title: '', subtitle: '' });
      
      if (pendingExhibitionArtwork && data.exhibition?.id) {
        try {
          const linkResponse = await fetch(`${API_URL}/api/artist/exhibition/${data.exhibition.id}/artworks/link/${pendingExhibitionArtwork.id}`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (linkResponse.ok) {
            setSuccess(`Exhibition created and "${pendingExhibitionArtwork.title}" added!`);
            fetchExhibitionArtworks(data.exhibition.id);
          } else {
            setSuccess('Exhibition created! Add artworks below.');
          }
        } catch {
          setSuccess('Exhibition created! Add artworks below.');
        }
        setPendingExhibitionArtwork(null);
      } else {
        setSuccess('Exhibition created! Add artworks below.');
      }
      
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
      setExhibitionArtworks([]);
      setSuccess('Exhibition deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishExhibition = async () => {
    if (!exhibition) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish exhibition');
      }
      
      const data = await response.json();
      setExhibition(data.exhibition);
      setShowPublishSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to publish exhibition. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublishExhibition = async () => {
    if (!exhibition) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/unpublish`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unpublish exhibition');
      }
      
      const data = await response.json();
      setExhibition(data.exhibition);
      setSuccess('Exhibition unpublished. Embed code is now inactive.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExhibition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibition) return;
    if (!exhibitionFormData.title.trim()) {
      setError('Exhibition title is required');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(exhibitionFormData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update exhibition');
      }
      
      const data = await response.json();
      setExhibition(data.exhibition);
      setShowEditExhibition(false);
      setExhibitionFormData({ title: '', subtitle: '' });
      setSuccess('Exhibition updated successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const startEditExhibition = () => {
    if (exhibition) {
      setExhibitionFormData({
        title: exhibition.title,
        subtitle: exhibition.subtitle || ''
      });
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setShowEditExhibition(true);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadCoverImage = async () => {
    if (!coverImageFile || !exhibition) return;
    
    setUploadingCoverImage(true);
    setError('');
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('image', coverImageFile);
      
      const response = await fetch(`${API_URL}/api/artist/exhibition/${exhibition.id}/cover-image`, {
        method: 'POST',
        credentials: 'include',
        body: formDataObj
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload cover image');
      }
      
      const data = await response.json();
      setExhibition(prev => prev ? { ...prev, coverImageUrl: data.coverImageUrl } : prev);
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setSuccess('Cover image uploaded successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const formatExhibitionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCoverImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('/objects/')) {
      return `${API_URL}${url}`;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_URL}${url}`;
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
    console.log('[ArtistDashboard] handleSubmit called');
    console.log('[ArtistDashboard] formData:', {
      title: formData.title,
      width: formData.width,
      height: formData.height,
      image: formData.image,
      imageType: formData.image ? typeof formData.image : 'null',
      isFile: formData.image instanceof File
    });
    setError('');
    setSuccess('');

    if (!formData.title || !formData.width || !formData.height) {
      setError('Please fill in all required fields');
      console.log('[ArtistDashboard] Validation failed: missing required fields');
      return;
    }

    const hasImage = formData.image || editingArtwork?.image_url;
    if (!hasImage) {
      setError('Please select an image');
      console.log('[ArtistDashboard] Validation failed: no image');
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
      if (formData.image && formData.image instanceof File) {
        formDataObj.append('image', formData.image);
      } else if (promotedGalleryImageId) {
        formDataObj.append('promotedGalleryImageId', String(promotedGalleryImageId));
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

      console.log('[ArtistDashboard] Making API request:', { url, method, hasImage: formDataObj.has('image') });

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formDataObj
      });

      console.log('[ArtistDashboard] API response:', { status: response.status, ok: response.ok });

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
      const savedArtworkId = data.artwork?.id || editingArtwork?.id;
      
      if (savedArtworkId && galleryImages.length > 0) {
        const newImages = galleryImages.filter(img => img.isNew && img.file);
        for (const img of newImages) {
          const imgFormData = new FormData();
          imgFormData.append('image', img.file!);
          imgFormData.append('is_mockup', String(img.is_mockup));
          
          try {
            await fetch(`${API_URL}/api/artist/artworks/${savedArtworkId}/images`, {
              method: 'POST',
              credentials: 'include',
              body: imgFormData
            });
          } catch (imgErr) {
            console.error('Error uploading gallery image:', imgErr);
          }
        }
        
        const existingImages = galleryImages.filter(img => !img.isNew && img.id);
        if (existingImages.length > 0) {
          const imageOrder = existingImages.map(img => img.id);
          try {
            await fetch(`${API_URL}/api/artist/artworks/${savedArtworkId}/images/reorder`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageOrder })
            });
          } catch (reorderErr) {
            console.error('Error reordering gallery images:', reorderErr);
          }
        }
      }
      
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
      setGalleryImages([]);
      setPromotedGalleryImageId(null);
      setEditingArtwork(null);
      
      await fetchArtworks();
      
      // Also refresh exhibition artworks to sync dimensions (if an exhibition exists)
      if (exhibition?.id) {
        await fetchExhibitionArtworks(exhibition.id);
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error saving artwork:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setPromotedGalleryImageId(null);
    
    let priceAmountStr = '';
    if (artwork.price_amount !== null && artwork.price_amount !== undefined && artwork.price_amount !== '') {
      priceAmountStr = artwork.price_amount.toString();
    }
    
    const artworkVariants = (artwork.variants || []).map(v => ({
      width: v.width,
      height: v.height,
      unit: v.unit || artwork.dimension_unit || 'cm',
      price: v.price,
      currency: v.currency,
      availability: v.availability
    }));
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
    
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks/${artwork.id}/images`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setGalleryImages(data.images || []);
      } else {
        setGalleryImages([]);
      }
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      setGalleryImages([]);
    }
    
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingArtwork(null);
    setPromotedGalleryImageId(null);
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
    setGalleryImages([]);
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
          <div className="mb-6 p-4 bg-[#C9A24A]/10 border border-[#C9A24A]/30 rounded-rvMd text-[#8B7033]">
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

              <div className="md:col-span-2">
                <ArtworkImageGallery
                  artworkId={editingArtwork?.id}
                  primaryImage={editingArtwork?.image_url || null}
                  galleryImages={galleryImages}
                  onPrimaryImageChange={(fileOrInfo) => {
                    console.log('[ArtistDashboard] onPrimaryImageChange called:', {
                      fileOrInfo,
                      type: typeof fileOrInfo,
                      isFile: fileOrInfo instanceof File,
                      name: fileOrInfo instanceof File ? fileOrInfo.name : 'N/A'
                    });
                    if (fileOrInfo && typeof fileOrInfo === 'object' && 'type' in fileOrInfo && fileOrInfo.type === 'gallery') {
                      setPromotedGalleryImageId((fileOrInfo as any).id);
                      setFormData(prev => ({ ...prev, image: (fileOrInfo as any).url }));
                    } else {
                      setPromotedGalleryImageId(null);
                      setFormData(prev => ({ ...prev, image: fileOrInfo }));
                    }
                  }}
                  onGalleryImagesChange={setGalleryImages}
                  isEditing={!!editingArtwork}
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
                    className="w-5 h-5 rounded border-gray-300 text-rv-primary focus:ring-rv-primary accent-rv-primary"
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
                          ? [{ width: '', height: '', unit: prev.dimensionUnit, price: '', currency: prev.priceCurrency, availability: 'available' }]
                          : prev.variants
                      }));
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-rv-primary focus:ring-rv-primary accent-rv-primary"
                  />
                  <div>
                    <span className="font-semibold text-rv-text">Available in additional sizes (prints / editions)</span>
                    <p className="text-xs text-rv-textMuted">Add more size options beyond the original dimensions above</p>
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                            <label className="block text-xs text-rv-textMuted mb-1">Unit</label>
                            <select
                              value={variant.unit || formData.dimensionUnit}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, unit: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm bg-white"
                            >
                              <option value="cm">cm</option>
                              <option value="inch">inch</option>
                            </select>
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
                            <label className="block text-xs text-rv-textMuted mb-1">Currency</label>
                            <select
                              value={variant.currency || formData.priceCurrency}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, currency: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm bg-white"
                            >
                              <option value="EUR">EUR</option>
                              <option value="USD">USD</option>
                              <option value="GBP">GBP</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-3">
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
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          variants: [...prev.variants, { width: '', height: '', unit: prev.dimensionUnit, price: '', currency: prev.priceCurrency, availability: 'available' }]
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
                      {artwork.variants && Array.isArray(artwork.variants) && artwork.variants.length > 0 && (
                        <span className="ml-2 text-[#C9A24A] font-medium">
                          (+{artwork.variants.length} more)
                        </span>
                      )}
                    </p>
                    {(() => {
                      const allPrices: { price: number; currency: string }[] = [];
                      
                      if (artwork.price_amount !== null && artwork.price_amount !== undefined && artwork.price_amount !== '') {
                        const basePrice = typeof artwork.price_amount === 'number' 
                          ? artwork.price_amount 
                          : parseFloat(String(artwork.price_amount).replace(/,/g, ''));
                        if (!isNaN(basePrice) && basePrice > 0) {
                          allPrices.push({ price: basePrice, currency: artwork.price_currency || 'EUR' });
                        }
                      }
                      
                      if (artwork.variants && Array.isArray(artwork.variants)) {
                        artwork.variants.forEach((v: any) => {
                          if (v && v.price != null) {
                            const parsed = parseFloat(String(v.price).replace(/,/g, ''));
                            if (!isNaN(parsed) && parsed > 0) {
                              allPrices.push({ price: parsed, currency: v.currency || artwork.price_currency || 'EUR' });
                            }
                          }
                        });
                      }
                      
                      if (allPrices.length === 0) {
                        return null;
                      }
                      
                      const lowest = allPrices.reduce((min, current) => 
                        current.price < min.price ? current : min
                      );
                      
                      if (allPrices.length === 1) {
                        return (
                          <p className="text-sm font-semibold text-rv-accent mb-2">
                            {lowest.currency} {lowest.price.toLocaleString()}
                          </p>
                        );
                      }
                      
                      return (
                        <p className="text-sm font-semibold text-rv-accent mb-2">
                          From {lowest.currency} {lowest.price.toLocaleString()}
                        </p>
                      );
                    })()}
                    
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
                    
                    {/* Row 1: Admin actions (compact) */}
                    <div className="flex gap-2.5 mt-4">
                      <button
                        onClick={() => handleEdit(artwork)}
                        className="flex-1 h-9 px-3 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(artwork.id)}
                        className="flex-1 h-9 px-3 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Row 2: Primary usage actions (main) */}
                    <div className="flex gap-2.5 mt-2">
                      <button
                        onClick={() => {
                          setPendingStudioArtwork(artwork);
                          setShowStudioWarning(true);
                        }}
                        className="flex-1 h-11 px-3 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                        </svg>
                        View in Studio
                      </button>
                      {isArtworkInExhibition(artwork.id) ? (
                        <button
                          onClick={() => handleRemoveFromExhibition(artwork.id)}
                          className="flex-1 h-11 px-3 text-sm bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/40 rounded-rvMd font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C9A24A]/20 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          In Exhibition
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToExhibition(artwork.id)}
                          className="flex-1 h-11 px-3 text-sm bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-colors font-semibold flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add to My Exhibition
                        </button>
                      )}
                    </div>

                    {/* Row 3: Secondary (advanced) */}
                    <button
                      onClick={() => setShowWidgetModal(artwork)}
                      className="w-full h-9 mt-2 px-4 text-sm border border-rv-primary text-rv-primary rounded-rvMd hover:bg-rv-primary hover:text-white transition-colors font-medium flex items-center justify-center gap-2"
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

        <div className="mb-10" data-section="exhibition" ref={exhibitionSectionRef}>
          <h2 className="text-2xl font-bold mb-6 text-rv-primary">My Exhibition</h2>
          
          {!exhibition ? (
            <div className="text-center py-12 bg-white rounded-rvLg border border-rv-neutral shadow-rvSoft">
              {showCreateExhibition ? (
                <form onSubmit={handleCreateExhibition} className="max-w-md mx-auto px-6">
                  {pendingExhibitionArtwork && (
                    <div className="mb-6 p-4 bg-[#C9A24A]/10 border border-[#C9A24A]/30 rounded-rvMd">
                      <p className="text-sm font-semibold text-[#C9A24A] mb-2">Artwork to add:</p>
                      <div className="flex items-center gap-3">
                        <img 
                          src={`${API_URL}/api/artwork-image/${pendingExhibitionArtwork.id}`}
                          alt={pendingExhibitionArtwork.title}
                          className="w-12 h-12 object-cover rounded-rvSm border border-rv-neutral"
                        />
                        <span className="text-rv-text font-medium">{pendingExhibitionArtwork.title}</span>
                      </div>
                    </div>
                  )}
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
                      onClick={() => { setShowCreateExhibition(false); setPendingExhibitionArtwork(null); }}
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
            <div className="space-y-6">
              <div className="bg-white border border-rv-neutral rounded-rvLg shadow-rvSoft overflow-hidden">
                <div className="relative h-40 sm:h-56 bg-gradient-to-br from-rv-primary/10 to-[#C9A24A]/10 flex items-center justify-center overflow-hidden">
                  {exhibition.coverImageUrl ? (
                    <img 
                      src={getCoverImageUrl(exhibition.coverImageUrl)} 
                      alt={exhibition.title} 
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-rv-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                </div>
                
                <div className="p-6">
                  {showEditExhibition ? (
                    <form onSubmit={handleUpdateExhibition} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">
                          Exhibition Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exhibitionFormData.title}
                          onChange={(e) => setExhibitionFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                          placeholder="My Virtual Exhibition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">
                          Description (optional)
                        </label>
                        <textarea
                          value={exhibitionFormData.subtitle}
                          onChange={(e) => setExhibitionFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                          placeholder="A brief description of your exhibition..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">
                          Cover Image
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-24 h-16 bg-rv-surface rounded-rvMd overflow-hidden border border-rv-neutral">
                            {coverImagePreview ? (
                              <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                            ) : exhibition.coverImageUrl ? (
                              <img src={getCoverImageUrl(exhibition.coverImageUrl)} alt="Current cover" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-rv-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <span className="block px-3 py-2 text-sm text-center border border-rv-neutral text-rv-text rounded-rvMd hover:bg-rv-surface transition-colors font-medium">
                                Choose Image
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                className="hidden"
                              />
                            </label>
                            {coverImageFile && (
                              <button
                                type="button"
                                onClick={handleUploadCoverImage}
                                disabled={uploadingCoverImage}
                                className="px-3 py-2 text-sm bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-colors font-medium disabled:opacity-50"
                              >
                                {uploadingCoverImage ? 'Uploading...' : 'Upload'}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-rv-textMuted mt-1">Recommended: 800x300px, JPG or PNG</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditExhibition(false);
                            setExhibitionFormData({ title: '', subtitle: '' });
                            setCoverImageFile(null);
                            setCoverImagePreview(null);
                          }}
                          className="px-4 py-2 border border-rv-neutral text-rv-text rounded-rvMd font-semibold hover:bg-rv-surface transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-rv-primary line-clamp-1">
                          {exhibition.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={startEditExhibition}
                            className="p-1.5 text-rv-textMuted hover:text-rv-primary hover:bg-rv-surface rounded transition-colors"
                            title="Edit exhibition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <span className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            exhibition.status === 'published' 
                              ? 'bg-[#C9A24A]/15 text-[#C9A24A]' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {exhibition.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
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
                      href={`#/gallery/exhibitions/${exhibition.id}/360-editor?preset=white-cube-v1`}
                      className="flex-1 px-3 py-2 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-all font-semibold text-center"
                    >
                      Edit Exhibition
                    </a>
                    {exhibition.status === 'published' ? (
                      <button
                        onClick={() => setShowUnpublishConfirmModal(true)}
                        disabled={loading}
                        className="px-3 py-2 text-sm text-[#C9A24A] border border-[#C9A24A]/30 rounded-rvMd hover:bg-[#C9A24A]/10 transition-all font-medium disabled:opacity-50"
                        title="Unpublish exhibition"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={handlePublishExhibition}
                        disabled={loading}
                        className="px-3 py-2 text-sm bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-all font-semibold disabled:opacity-50"
                        title="Publish exhibition to make embed active"
                      >
                        Publish
                      </button>
                    )}
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

                      {/* Embed Exhibition Section */}
                      <div className="mt-5 pt-5 border-t border-rv-neutral">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className={`w-4 h-4 ${exhibition.status === 'published' ? 'text-rv-primary' : 'text-rv-textMuted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <h4 className={`text-sm font-semibold ${exhibition.status === 'published' ? 'text-rv-text' : 'text-rv-textMuted'}`}>Embed this Exhibition</h4>
                        </div>
                        
                        {exhibition.status === 'published' ? (
                          <>
                            <p className="text-xs text-rv-textMuted mb-3">
                              Copy this code into your website to display your 360° exhibition.
                            </p>
                            <div className="bg-slate-50 rounded-rvMd p-3 mb-3 overflow-x-auto">
                              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all font-mono">
{`<iframe
  src="${window.location.origin}/#/embed/exhibitions/${exhibition.id}"
  width="100%"
  height="720"
  style="border:0; border-radius:12px;"
  loading="lazy"
  allowfullscreen
></iframe>`}
                              </pre>
                            </div>
                            <button
                              onClick={async () => {
                                const embedCode = `<iframe
  src="${window.location.origin}/#/embed/exhibitions/${exhibition.id}"
  width="100%"
  height="720"
  style="border:0; border-radius:12px;"
  loading="lazy"
  allowfullscreen
></iframe>`;
                                try {
                                  await navigator.clipboard.writeText(embedCode);
                                  setSuccess('Embed code copied to clipboard!');
                                  setTimeout(() => setSuccess(''), 3000);
                                } catch (err) {
                                  setError('Failed to copy embed code');
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-rv-primary text-rv-primary rounded-rvMd hover:bg-rv-primary hover:text-white transition-all font-medium flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy Code
                            </button>
                          </>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-rvMd p-4">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-amber-800 mb-1">Exhibition not published</p>
                                <p className="text-xs text-amber-700 mb-3">
                                  Publish your exhibition to get the embed code and share it on your website.
                                </p>
                                <button
                                  onClick={handlePublishExhibition}
                                  disabled={loading}
                                  className="px-4 py-1.5 text-sm bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-all font-semibold disabled:opacity-50"
                                >
                                  {loading ? 'Publishing...' : 'Publish Exhibition'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white border border-rv-neutral rounded-rvLg shadow-rvSoft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-rv-primary">Exhibition Artworks</h3>
                  <button
                    onClick={() => setShowAddExhibitionArtwork(!showAddExhibitionArtwork)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A24A] text-white rounded-rvMd font-semibold hover:bg-[#B8913A] transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Artwork
                  </button>
                </div>

                {showAddExhibitionArtwork && (
                  <form onSubmit={handleAddExhibitionArtwork} className="mb-6 p-4 bg-rv-surface rounded-rvMd border border-rv-neutral">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">
                          Artwork Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exhibitionArtworkForm.title}
                          onChange={(e) => setExhibitionArtworkForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                          placeholder="Artwork title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">
                          Image <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleExhibitionArtworkImageChange}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd text-sm file:mr-3 file:py-1 file:px-3 file:rounded-rvMd file:border-0 file:bg-rv-primary file:text-white file:font-semibold file:cursor-pointer"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">Width</label>
                        <input
                          type="number"
                          value={exhibitionArtworkForm.widthValue}
                          onChange={(e) => setExhibitionArtworkForm(prev => ({ ...prev, widthValue: e.target.value }))}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">Height</label>
                        <input
                          type="number"
                          value={exhibitionArtworkForm.heightValue}
                          onChange={(e) => setExhibitionArtworkForm(prev => ({ ...prev, heightValue: e.target.value }))}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-rv-text">Unit</label>
                        <select
                          value={exhibitionArtworkForm.dimensionUnit}
                          onChange={(e) => setExhibitionArtworkForm(prev => ({ ...prev, dimensionUnit: e.target.value }))}
                          className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                        >
                          <option value="cm">cm</option>
                          <option value="in">in</option>
                        </select>
                      </div>
                    </div>

                    {exhibitionArtworkPreview && (
                      <div className="mb-4">
                        <img 
                          src={exhibitionArtworkPreview} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-rvMd border border-rv-neutral"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={exhibitionArtworkLoading}
                        className="px-6 py-2 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors disabled:opacity-50"
                      >
                        {exhibitionArtworkLoading ? 'Adding...' : 'Add to Exhibition'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddExhibitionArtwork(false);
                          setExhibitionArtworkForm({ title: '', widthValue: '', heightValue: '', dimensionUnit: 'cm' });
                          setExhibitionArtworkImage(null);
                          setExhibitionArtworkPreview(null);
                        }}
                        className="px-6 py-2 border border-rv-neutral text-rv-text rounded-rvMd font-semibold hover:bg-rv-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {exhibitionArtworks.length === 0 ? (
                  <div className="text-center py-8 text-rv-textMuted">
                    <svg className="w-12 h-12 mx-auto mb-3 text-rv-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-medium">No artworks yet</p>
                    <p className="text-sm">Add artworks to display in your virtual exhibition</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {exhibitionArtworks.map((artwork) => (
                      <div key={artwork.id} className="group relative bg-rv-surface rounded-rvMd overflow-hidden border border-rv-neutral">
                        <div className="aspect-square relative">
                          <img
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <button
                            onClick={() => setDeleteExhibitionArtworkId(artwork.id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-3">
                          <h4 className="font-semibold text-sm text-rv-text truncate">{artwork.title}</h4>
                          <p className="text-xs text-rv-textMuted">
                            {artwork.widthValue} × {artwork.heightValue} {artwork.dimensionUnit}
                          </p>
                        </div>

                        {deleteExhibitionArtworkId === artwork.id && (
                          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4">
                            <p className="text-sm text-red-700 font-medium mb-3 text-center">Remove this artwork?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteExhibitionArtwork(artwork.id)}
                                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 font-semibold"
                              >
                                Remove
                              </button>
                              <button
                                onClick={() => setDeleteExhibitionArtworkId(null)}
                                className="px-3 py-1.5 text-sm border border-rv-neutral text-rv-text rounded-rvMd hover:bg-rv-surface font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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

        {/* Studio Warning Modal */}
        {showStudioWarning && pendingStudioArtwork && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-rv-text mb-1">Important Notice</h3>
                  <p className="text-sm text-rv-textMuted">
                    Before opening Studio
                  </p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  Please make sure your first image is a <strong>clean artwork image</strong> (without any room mockups).
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  The Studio already places your artwork into realistic interiors. If you use a mockup image as the first image, it will result in a <em>mockup inside a mockup</em>.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudioWarning(false);
                    setPendingStudioArtwork(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-rv-neutral text-rv-text text-sm font-semibold rounded-lg hover:bg-rv-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingStudioArtwork) {
                      const params = new URLSearchParams({
                        artworkId: pendingStudioArtwork.id.toString(),
                        title: pendingStudioArtwork.title,
                        imageUrl: pendingStudioArtwork.image_url.startsWith('http') 
                          ? pendingStudioArtwork.image_url 
                          : `${API_URL}${pendingStudioArtwork.image_url}`,
                        width: pendingStudioArtwork.width.toString(),
                        height: pendingStudioArtwork.height.toString(),
                        unit: pendingStudioArtwork.dimension_unit || 'cm'
                      });
                      window.location.hash = `#/studio?${params.toString()}`;
                    }
                    setShowStudioWarning(false);
                    setPendingStudioArtwork(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#C9A24A] text-white text-sm font-semibold rounded-lg hover:bg-[#B8913A] transition-colors"
                >
                  Continue to Studio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Publish Success Modal */}
        {showPublishSuccessModal && exhibition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-rvLg p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-rv-text mb-2">Exhibition Published!</h3>
                <p className="text-rv-textMuted text-sm">
                  Your exhibition is now live. Your embed code is active and can be used on your website.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublishSuccessModal(false)}
                  className="flex-1 px-4 py-2.5 border border-rv-neutral text-rv-text text-sm font-semibold rounded-rvMd hover:bg-rv-surface transition-colors"
                >
                  Close
                </button>
                <a
                  href={`#/embed/exhibitions/${exhibition.id}`}
                  className="flex-1 px-4 py-2.5 bg-[#C9A24A] text-white text-sm font-semibold rounded-rvMd hover:bg-[#B8913A] transition-colors text-center"
                  onClick={() => setShowPublishSuccessModal(false)}
                >
                  View Exhibition
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Unpublish Confirmation Modal */}
        {showUnpublishConfirmModal && exhibition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-rvLg p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#C9A24A]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#C9A24A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-rv-text mb-2">Unpublish Exhibition?</h3>
                <p className="text-rv-textMuted text-sm">
                  If you unpublish, the embed on your website will stop working until you publish again.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnpublishConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-rv-neutral text-rv-text text-sm font-semibold rounded-rvMd hover:bg-rv-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUnpublishConfirmModal(false);
                    handleUnpublishExhibition();
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#C9A24A] text-white text-sm font-semibold rounded-rvMd hover:bg-[#B8913A] transition-colors disabled:opacity-50"
                >
                  Unpublish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
