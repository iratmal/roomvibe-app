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
import { ArtworkCardCarousel } from './ArtworkCardCarousel';

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
  visible_to_designers?: boolean;
  visible_to_galleries?: boolean;
  variants?: ArtworkVariant[];
  card_image_id?: number | null;
  clean_image_id?: number | null;
  card_image_url?: string;
  clean_image_url?: string;
  hasCleanImage?: boolean;
  story?: string | null;
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
  const [deleteExhibitionArtworkId, setDeleteExhibitionArtworkId] = useState<number | null>(null);
  const [showStudioWarning, setShowStudioWarning] = useState(false);
  const [pendingStudioArtwork, setPendingStudioArtwork] = useState<Artwork | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [showUnpublishConfirmModal, setShowUnpublishConfirmModal] = useState(false);
  const [pendingExhibitionArtwork, setPendingExhibitionArtwork] = useState<Artwork | null>(null);
  const [imageSaveSuccess, setImageSaveSuccess] = useState(false);
  const [savingImages, setSavingImages] = useState(false);
  
  const exhibitionSectionRef = React.useRef<HTMLDivElement>(null);
  const editFormRef = React.useRef<HTMLDivElement>(null);
  
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
    visibleToDesigners: false,
    visibleToGalleries: false,
    hasVariants: false,
    variants: [] as Array<{ width: string; height: string; unit: string; price: string; currency: string; availability: string }>,
    cardImageId: null as number | null,
    cleanImageId: null as number | null,
    story: ''
  });
  const [promotedGalleryImageId, setPromotedGalleryImageId] = useState<number | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [viewStoryArtwork, setViewStoryArtwork] = useState<Artwork | null>(null);
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
      
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (file.size > MAX_FILE_SIZE) {
        setError('Image too large. Please upload an image under 5 MB. For best results, use JPG/WebP and keep width around 2000-3000 px.');
        setTimeout(() => setError(''), 8000);
        e.target.value = '';
        return;
      }
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
        setTimeout(() => setError(''), 5000);
        e.target.value = '';
        return;
      }
      
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
      
      // Include image role IDs for both create and edit
      // For new uploads, determine actual IDs (default to first gallery image)
      const actualCardImageId = formData.cardImageId ?? (galleryImages.length > 0 ? galleryImages[0].id : null);
      const nonMockupImages = galleryImages.filter(g => !g.is_mockup);
      const actualCleanImageId = formData.cleanImageId ?? (nonMockupImages.length > 0 ? nonMockupImages[0].id : null);
      
      if (actualCardImageId !== null) {
        formDataObj.append('cardImageId', String(actualCardImageId));
      }
      if (actualCleanImageId !== null) {
        formDataObj.append('cleanImageId', String(actualCleanImageId));
      }
      
      if (editingArtwork) {
        formDataObj.append('visibleToDesigners', String(formData.visibleToDesigners));
        formDataObj.append('visibleToGalleries', String(formData.visibleToGalleries));
      }
      if (formData.hasVariants && formData.variants.length > 0) {
        formDataObj.append('variants', JSON.stringify(formData.variants));
      }
      
      // Include story if provided
      if (formData.story && formData.story.trim()) {
        formDataObj.append('story', formData.story.trim());
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
        // Build final image order: existing images keep their IDs, new images get IDs after upload
        const finalImageOrder: number[] = [];
        const newImageUploadMap = new Map<number, File>(); // position -> file
        
        // First pass: identify new vs existing images and their positions
        for (let i = 0; i < galleryImages.length; i++) {
          const img = galleryImages[i];
          if (img.isNew && img.file) {
            newImageUploadMap.set(i, img.file);
          } else if (img.id && img.id > 0) {
            // Track position for existing images
            finalImageOrder[i] = img.id;
          }
        }
        
        // Upload new images and capture their IDs
        for (const [position, file] of newImageUploadMap.entries()) {
          const imgFormData = new FormData();
          imgFormData.append('image', file);
          imgFormData.append('is_mockup', String(galleryImages[position]?.is_mockup || false));
          
          try {
            const uploadResponse = await fetch(`${API_URL}/api/artist/artworks/${savedArtworkId}/images`, {
              method: 'POST',
              credentials: 'include',
              body: imgFormData
            });
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              if (uploadData.image?.id) {
                finalImageOrder[position] = uploadData.image.id;
              }
            }
          } catch (imgErr) {
            console.error('Error uploading gallery image:', imgErr);
          }
        }
        
        // Filter out undefined entries and reorder all gallery images
        const validImageOrder = finalImageOrder.filter((id): id is number => id !== undefined && id > 0);
        if (validImageOrder.length > 0) {
          try {
            await fetch(`${API_URL}/api/artist/artworks/${savedArtworkId}/images/reorder`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageOrder: validImageOrder })
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
        visibleToDesigners: false,
        visibleToGalleries: false,
        hasVariants: false,
        variants: [],
        cardImageId: null,
        cleanImageId: null,
        story: ''
      });
      setGalleryImages([]);
      setPromotedGalleryImageId(null);
      setEditingArtwork(null);
      
      await fetchArtworks();
      
      // Also refresh exhibition artworks to sync dimensions (if an exhibition exists)
      if (exhibition?.id) {
        await fetchExhibitionArtworks(exhibition.id);
      }

      // Scroll to top so user sees the new artwork card and success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
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
      visibleToDesigners: artwork.visible_to_designers || false,
      visibleToGalleries: artwork.visible_to_galleries || false,
      hasVariants: artworkVariants.length > 0,
      variants: artworkVariants,
      cardImageId: artwork.card_image_id ?? null,
      cleanImageId: artwork.clean_image_id ?? null,
      story: artwork.story || ''
    });
    
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks/${artwork.id}/images`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out cover image (is_cover: true) - cover is handled separately via primaryImage
        const galleryOnly = (data.images || []).filter((img: any) => !img.is_cover);
        setGalleryImages(galleryOnly);
      } else {
        setGalleryImages([]);
      }
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      setGalleryImages([]);
    }
    
    setError('');
    setSuccess('');
    
    // Scroll to edit form after state is set
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
      visibleToDesigners: false,
      visibleToGalleries: false,
      hasVariants: false,
      variants: [],
      cardImageId: null,
      cleanImageId: null,
      story: ''
    });
    setGalleryImages([]);
    setError('');
    setSuccess('');
  };

  // Save images only (order + image roles) without closing edit view
  const handleSaveImages = async () => {
    if (!editingArtwork) return;
    
    setSavingImages(true);
    setImageSaveSuccess(false);
    
    try {
      // 1. Save gallery image order
      const reorderedImages = galleryImages.map((img, idx) => ({
        id: img.id,
        display_order: idx + 1
      }));
      
      if (reorderedImages.length > 0) {
        await fetch(`${API_URL}/api/artist/artworks/${editingArtwork.id}/images/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ images: reorderedImages })
        });
      }
      
      // Determine actual cardImageId - use first gallery image if null
      const actualCardImageId = formData.cardImageId ?? (galleryImages.length > 0 ? galleryImages[0].id : null);
      // Determine actual cleanImageId - use first non-mockup if null
      const nonMockupImages = galleryImages.filter(g => !g.is_mockup);
      const actualCleanImageId = formData.cleanImageId ?? (nonMockupImages.length > 0 ? nonMockupImages[0].id : null);
      
      // 2. Save image role settings (cardImageId, cleanImageId)
      const formDataObj = new FormData();
      if (actualCardImageId !== null) {
        formDataObj.append('cardImageId', String(actualCardImageId));
      }
      if (actualCleanImageId !== null) {
        formDataObj.append('cleanImageId', String(actualCleanImageId));
      }
      // Also include current title and dimensions to avoid validation errors
      formDataObj.append('title', formData.title);
      formDataObj.append('width', formData.width);
      formDataObj.append('height', formData.height);
      formDataObj.append('dimensionUnit', formData.dimensionUnit);
      
      await fetch(`${API_URL}/api/artist/artworks/${editingArtwork.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataObj
      });
      
      // Update editingArtwork with new card image URL for immediate preview
      if (actualCardImageId !== null && editingArtwork) {
        let cardImageUrl: string;
        if (actualCardImageId === 0) {
          // Primary image selected
          cardImageUrl = editingArtwork.image_url;
        } else {
          // Gallery image selected
          const selectedCardImg = galleryImages.find(g => g.id === actualCardImageId);
          cardImageUrl = selectedCardImg?.image_url || editingArtwork.image_url;
        }
        
        setEditingArtwork(prev => prev ? {
          ...prev,
          card_image_id: actualCardImageId,
          card_image_url: cardImageUrl
        } : null);
      }
      
      // Update formData with explicit values
      setFormData(prev => ({
        ...prev,
        cardImageId: actualCardImageId ?? null,
        cleanImageId: actualCleanImageId ?? null
      }));
      
      // 3. Refresh artworks list to reflect changes
      await fetchArtworks();
      
      // Show success feedback
      setImageSaveSuccess(true);
      setTimeout(() => setImageSaveSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error saving images:', err);
      setError('Failed to save image settings');
    } finally {
      setSavingImages(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const wasInExhibition = isArtworkInExhibition(id);
      
      const response = await fetch(`${API_URL}/api/artist/artworks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setSuccess(wasInExhibition 
        ? 'Artwork deleted and removed from exhibition!' 
        : 'Artwork deleted successfully!');
      setShowDeleteConfirm(null);
      await fetchArtworks();
      
      // If artwork was in exhibition, refresh exhibition artworks list
      if (wasInExhibition && exhibition?.id) {
        await fetchExhibitionArtworks(exhibition.id);
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error deleting artwork:', err);
      setError(err.message);
    }
  };

  const handleVisibilityToggle = async (artworkId: number, field: 'visibleToDesigners' | 'visibleToGalleries', value: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks/${artworkId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      setArtworks(prev => prev.map(a => 
        a.id === artworkId 
          ? { ...a, [field === 'visibleToDesigners' ? 'visible_to_designers' : 'visible_to_galleries']: value }
          : a
      ));
    } catch (err: any) {
      console.error('Error updating visibility:', err);
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

        <div ref={editFormRef} className="mb-10 p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
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

              {/* Image Roles Section - Show when images are available (both edit and upload) */}
              {galleryImages.length > 0 && (() => {
                // Build allImagesForDropdown: combine primary image + gallery images
                // This ensures dropdown shows Gallery 1..N for ALL images
                const primaryImgUrl = editingArtwork?.image_url || (formData.image instanceof File ? URL.createObjectURL(formData.image) : (typeof formData.image === 'string' ? formData.image : null));
                const hasPrimaryImage = !!primaryImgUrl;
                
                const allImagesForDropdown: GalleryImage[] = [
                  ...(hasPrimaryImage ? [{
                    id: editingArtwork?.id ? 0 : -1, // 0 for existing artwork primary, -1 for new
                    image_url: primaryImgUrl || '',
                    display_order: 0,
                    is_mockup: false,
                    isNew: !editingArtwork
                  }] : []),
                  ...galleryImages
                ];
                
                return (
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-rv-text mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Image Roles
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Card Image Picker */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Card Image
                        <span className="text-gray-400 font-normal ml-1">(shown on artwork cards)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          {(() => {
                            const selectedId = formData.cardImageId;
                            let imgUrl = allImagesForDropdown.length > 0 ? allImagesForDropdown[0].image_url : '';
                            if (selectedId !== null) {
                              const foundImg = allImagesForDropdown.find(g => g.id === selectedId);
                              if (foundImg) {
                                imgUrl = foundImg.image_url;
                              }
                            }
                            if (!imgUrl) return <div className="w-full h-full bg-gray-200" />;
                            return (
                              <img
                                src={imgUrl?.startsWith('http') || imgUrl?.startsWith('data:') || imgUrl?.startsWith('blob:') ? imgUrl : `${API_URL}${imgUrl}`}
                                alt="Card preview"
                                className="w-full h-full object-cover"
                              />
                            );
                          })()}
                        </div>
                        <select
                          value={formData.cardImageId ?? (allImagesForDropdown.length > 0 ? allImagesForDropdown[0].id : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              cardImageId: val === '' ? null : parseInt(val)
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rv-primary"
                        >
                          {allImagesForDropdown.map((img, idx) => (
                            <option key={img.id ?? idx} value={img.id}>
                              Gallery {idx + 1}{img.is_mockup ? ' (mockup)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Clean Image Picker (Exhibition & Studio) */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Exhibition & Studio Image
                        <span className="text-gray-400 font-normal ml-1">(360° & View in Room)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          {(() => {
                            const selectedId = formData.cleanImageId;
                            const nonMockupImages = allImagesForDropdown.filter(g => !g.is_mockup);
                            let imgUrl = nonMockupImages.length > 0 ? nonMockupImages[0].image_url : (allImagesForDropdown.length > 0 ? allImagesForDropdown[0].image_url : '');
                            if (selectedId !== null) {
                              const foundImg = allImagesForDropdown.find(g => g.id === selectedId);
                              if (foundImg) {
                                imgUrl = foundImg.image_url;
                              }
                            }
                            if (!imgUrl) return <div className="w-full h-full bg-gray-200" />;
                            return (
                              <img
                                src={imgUrl?.startsWith('http') || imgUrl?.startsWith('data:') || imgUrl?.startsWith('blob:') ? imgUrl : `${API_URL}${imgUrl}`}
                                alt="Exhibition preview"
                                className="w-full h-full object-cover"
                              />
                            );
                          })()}
                        </div>
                        <select
                          value={formData.cleanImageId ?? (() => {
                            const nonMockup = allImagesForDropdown.filter(g => !g.is_mockup);
                            return nonMockup.length > 0 ? nonMockup[0].id : '';
                          })()}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedId = val === '' ? null : parseInt(val);
                            // Block mockup selection for clean image
                            if (selectedId !== null) {
                              const selectedImg = allImagesForDropdown.find(g => g.id === selectedId);
                              if (selectedImg?.is_mockup) {
                                alert('Mockups are not allowed for exhibitions and studio. Please select a clean artwork image.');
                                return;
                              }
                            }
                            setFormData(prev => ({
                              ...prev,
                              cleanImageId: selectedId
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rv-primary"
                        >
                          {allImagesForDropdown.filter(img => !img.is_mockup).map((img, idx) => (
                            <option key={img.id ?? idx} value={img.id}>
                              Gallery {allImagesForDropdown.indexOf(img) + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      {allImagesForDropdown.length > 0 && allImagesForDropdown.every(img => img.is_mockup) && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Only mockups available. First image will be used for exhibitions.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Save Images Button - Only show when editing existing artwork */}
                  {editingArtwork && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleSaveImages}
                      disabled={savingImages}
                      className="px-4 py-2 bg-rv-primary text-white text-sm font-medium rounded-lg hover:bg-rv-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {savingImages ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save images
                        </>
                      )}
                    </button>
                    {imageSaveSuccess && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Images saved successfully
                      </span>
                    )}
                  </div>
                  )}
                  
                  {/* Info text for new uploads */}
                  {!editingArtwork && (
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Image roles will be saved when you submit the artwork.
                    </p>
                  )}
                </div>
                );
              })()}

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

              {/* Story Behind Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-rv-text">
                  Story Behind <span className="font-normal text-rv-textMuted">(optional)</span>
                </label>
                <p className="text-xs text-rv-textMuted mb-3">
                  Share the inspiration, emotion or story behind this artwork.
                </p>
                {formData.story ? (
                  <div className="bg-rv-surface rounded-rvMd p-4 border border-rv-neutral">
                    <p className="text-sm text-rv-text whitespace-pre-wrap line-clamp-3">{formData.story}</p>
                    <button
                      type="button"
                      onClick={() => setShowStoryModal(true)}
                      className="mt-2 text-sm text-rv-primary hover:text-rv-primaryHover font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit story
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowStoryModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rv-surface text-rv-text rounded-rvMd border border-rv-neutral hover:border-rv-primary hover:text-rv-primary transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add story
                  </button>
                )}
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

              {editingArtwork && (
                <div className="md:col-span-2 pt-4 border-t border-rv-neutral">
                  <div className="mb-2">
                    <span className="font-semibold text-rv-text">Visibility in Artist Connect</span>
                    <p className="text-xs text-rv-textMuted">Choose which platforms can discover this artwork</p>
                  </div>
                  <div className="flex flex-col gap-3 mt-3">
                    <label 
                      className={`flex items-center gap-3 ${!dashboardStats.visibleToDesigners ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={!dashboardStats.visibleToDesigners ? 'Turn on profile visibility first in Profile tab' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={formData.visibleToDesigners || false}
                        disabled={!dashboardStats.visibleToDesigners}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibleToDesigners: e.target.checked }))}
                        className="checkbox-navy"
                      />
                      <div>
                        <span className={`font-semibold ${dashboardStats.visibleToDesigners ? 'text-rv-text' : 'text-rv-textMuted'}`}>Visible to Designers</span>
                        <p className="text-xs text-rv-textMuted">Designers can discover this artwork in the Art Library</p>
                      </div>
                    </label>
                    <label 
                      className={`flex items-center gap-3 ${!dashboardStats.visibleToGalleries ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={!dashboardStats.visibleToGalleries ? 'Turn on profile visibility first in Profile tab' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={formData.visibleToGalleries || false}
                        disabled={!dashboardStats.visibleToGalleries}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibleToGalleries: e.target.checked }))}
                        className="checkbox-navy"
                      />
                      <div>
                        <span className={`font-semibold ${dashboardStats.visibleToGalleries ? 'text-rv-text' : 'text-rv-textMuted'}`}>Visible to Galleries</span>
                        <p className="text-xs text-rv-textMuted">Galleries can discover this artwork in the Artist Directory</p>
                      </div>
                    </label>
                  </div>
                  {(!dashboardStats.visibleToDesigners && !dashboardStats.visibleToGalleries) && (
                    <p className="text-xs text-amber-600 mt-3">
                      Turn on profile visibility first in the Profile tab to enable artwork visibility.
                    </p>
                  )}
                </div>
              )}

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
                <div key={`${artwork.id}-${artwork.card_image_id || 'default'}-${artwork.updated_at || ''}`} className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden">
                  <ArtworkCardCarousel
                    artworkId={artwork.id}
                    primaryImageUrl={(() => {
                      const imgUrl = artwork.card_image_url || artwork.image_url;
                      const baseUrl = imgUrl.startsWith('http') ? imgUrl : `${API_URL}${imgUrl}`;
                      // Add cache-bust if not already present
                      return baseUrl.includes('?') ? baseUrl : `${baseUrl}?t=${Date.now()}`;
                    })()}
                    title={artwork.title}
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-rv-text">{artwork.title}</h3>
                    <p className="text-sm text-rv-textMuted mb-1">
                      {artwork.width} × {artwork.height} {artwork.dimension_unit || 'cm'}
                    </p>
                    {artwork.variants && Array.isArray(artwork.variants) && artwork.variants.length > 0 && (
                      <p className="text-xs text-[#C9A24A] font-semibold mb-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        Available in {artwork.variants.length + 1} sizes
                      </p>
                    )}
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
                    
                    {/* Story Behind link - only show if story exists */}
                    {artwork.story && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewStoryArtwork(artwork);
                        }}
                        className="text-sm text-rv-primary hover:text-rv-primaryHover font-medium flex items-center gap-1 mb-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Story Behind
                      </button>
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
                    
                    {/* Visibility in Artist Connect */}
                    <div className="mb-4 p-3 bg-rv-surface rounded-rvMd border border-rv-neutral">
                      <p className="text-xs font-semibold text-rv-textMuted mb-2">Visibility in Artist Connect</p>
                      <div className="flex flex-col gap-2">
                        <label 
                          className={`flex items-center gap-2 ${!dashboardStats.visibleToDesigners ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!dashboardStats.visibleToDesigners ? 'Turn on profile visibility first in Profile tab' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={artwork.visible_to_designers || false}
                            disabled={!dashboardStats.visibleToDesigners}
                            onChange={(e) => handleVisibilityToggle(artwork.id, 'visibleToDesigners', e.target.checked)}
                            className="checkbox-navy"
                          />
                          <span className="text-sm text-rv-text">Visible to Designers</span>
                        </label>
                        <label 
                          className={`flex items-center gap-2 ${!dashboardStats.visibleToGalleries ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!dashboardStats.visibleToGalleries ? 'Turn on profile visibility first in Profile tab' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={artwork.visible_to_galleries || false}
                            disabled={!dashboardStats.visibleToGalleries}
                            onChange={(e) => handleVisibilityToggle(artwork.id, 'visibleToGalleries', e.target.checked)}
                            className="checkbox-navy"
                          />
                          <span className="text-sm text-rv-text">Visible to Galleries</span>
                        </label>
                      </div>
                      {(!dashboardStats.visibleToDesigners && !dashboardStats.visibleToGalleries) && (
                        <p className="text-xs text-amber-600 mt-2">
                          Turn on profile visibility first in the Profile tab to enable artwork visibility.
                        </p>
                      )}
                    </div>
                    
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
                        {isArtworkInExhibition(artwork.id) ? (
                          <>
                            <p className="text-sm text-red-700 mb-2 font-semibold">
                              This artwork is in your exhibition.
                            </p>
                            <p className="text-xs text-red-600 mb-3">
                              Deleting this artwork will automatically remove it from the exhibition. Are you sure you want to continue?
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-red-700 mb-2 font-semibold">
                            Are you sure you want to delete this artwork?
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(artwork.id)}
                            className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold"
                          >
                            Delete
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
          <h2 className="text-2xl font-bold mb-2 text-rv-primary">My Exhibition</h2>
          <div className="mb-6 p-4 bg-rv-surface/50 border border-rv-neutral/50 rounded-rvMd">
            <p className="text-sm text-rv-text font-medium mb-1">How it works:</p>
            <p className="text-sm text-rv-textMuted">
              First upload your artworks in the <span className="font-medium">Artworks</span> section.
              Then click <span className="font-medium">"Add to My Exhibition"</span> on any artwork you want to include.
            </p>
            <p className="text-xs text-rv-textMuted mt-2">You can edit or remove artworks from your exhibition at any time.</p>
          </div>
          
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
                <div className="relative h-56 sm:h-80 bg-gradient-to-br from-rv-primary/10 to-[#C9A24A]/10 flex items-center justify-center overflow-hidden">
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
                            {uploadingCoverImage ? (
                              <div className="w-full h-full flex items-center justify-center bg-rv-surface">
                                <svg className="w-5 h-5 text-[#C9A24A] animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            ) : coverImagePreview ? (
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
                            <label className={`flex-1 ${uploadingCoverImage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                              <span className="block px-3 py-2 text-sm text-center border border-rv-neutral text-rv-text rounded-rvMd hover:bg-rv-surface transition-colors font-medium">
                                Choose Image
                              </span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleCoverImageChange}
                                disabled={uploadingCoverImage}
                                className="hidden"
                              />
                            </label>
                            {coverImageFile && (
                              <button
                                type="button"
                                onClick={handleUploadCoverImage}
                                disabled={uploadingCoverImage}
                                className="px-3 py-2 text-sm bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                              >
                                {uploadingCoverImage ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading...
                                  </>
                                ) : 'Upload'}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-rv-textMuted mt-1">Max 5 MB. Recommended: 2000-3000px wide, JPG/WebP for best quality.</p>
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
                <h3 className="text-lg font-bold text-rv-primary mb-4">Exhibition Artworks</h3>

                {exhibitionArtworks.length === 0 ? (
                  <div className="text-center py-8 text-rv-textMuted">
                    <svg className="w-12 h-12 mx-auto mb-3 text-rv-neutral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-medium">No artworks in exhibition yet</p>
                    <p className="text-sm mt-1">Go to your <span className="font-medium">Artworks</span> section and click "Add to My Exhibition" on the artworks you want to include.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {exhibitionArtworks.map((artwork) => (
                      <div key={artwork.id} className="group relative bg-rv-surface rounded-rvMd overflow-hidden border border-rv-neutral">
                        <div className="h-[160px] relative bg-neutral-200">
                          <div className="absolute inset-3 flex items-center justify-center">
                            <img
                              src={artwork.imageUrl}
                              alt={artwork.title}
                              className="max-w-full max-h-full object-contain shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
                              }}
                            />
                          </div>
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

        {/* Story Edit Modal */}
        {showStoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-rv-text">Story Behind</h3>
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="p-1 text-rv-textMuted hover:text-rv-text rounded-full hover:bg-rv-surface transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                placeholder="What inspired this piece?&#10;Was there a specific moment, feeling or story behind it?"
                rows={6}
                className="w-full px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary resize-none text-rv-text"
              />
              <p className="text-xs text-rv-textMuted mt-2 mb-4">
                This story will be visible to visitors on your artwork page.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, story: '' }));
                    setShowStoryModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-rv-neutral text-rv-text text-sm font-semibold rounded-lg hover:bg-rv-surface transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="flex-1 px-4 py-2.5 bg-rv-primary text-white text-sm font-semibold rounded-lg hover:bg-rv-primaryHover transition-colors"
                >
                  Save Story
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story View Modal (for viewing story from artwork card) */}
        {viewStoryArtwork && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-rv-text">Story Behind</h3>
                <button
                  type="button"
                  onClick={() => setViewStoryArtwork(null)}
                  className="p-1 text-rv-textMuted hover:text-rv-text rounded-full hover:bg-rv-surface transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-rv-primary mb-1">{viewStoryArtwork.title}</p>
              </div>
              <div className="bg-rv-surface rounded-lg p-4 border border-rv-neutral">
                <p className="text-sm text-rv-text whitespace-pre-wrap">{viewStoryArtwork.story}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewStoryArtwork(null)}
                  className="px-4 py-2 bg-rv-primary text-white text-sm font-semibold rounded-lg hover:bg-rv-primaryHover transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
                  Please make sure that your <strong>Exhibition & Studio image</strong> is a clean artwork image (without room mockups).
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  RoomVibe Studio automatically places your artwork into realistic interiors. If a mockup image is used, it may result in unrealistic visuals (mockup inside a mockup).
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  You can manage this anytime in <strong>Image Roles</strong> inside your artwork settings.
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
