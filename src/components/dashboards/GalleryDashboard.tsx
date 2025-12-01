import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { YourPlanCard } from '../YourPlanCard';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Collection {
  id: number;
  gallery_id: number;
  title: string;
  subtitle?: string;
  description?: string;
  status: 'draft' | 'published';
  artwork_count: number;
  created_at: string;
  updated_at: string;
  first_artwork_url?: string;
}

function ChangePasswordGallery() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-[#283593]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#283593]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Change Password
        </h3>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283593] bg-white text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283593] bg-white text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283593] bg-white text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-[#283593] text-white rounded-lg hover:bg-[#1a237e] transition-all font-semibold text-sm disabled:opacity-50"
        >
          {isLoading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

export function GalleryDashboard() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    status: 'draft' as 'draft' | 'published'
  });

  useEffect(() => {
    fetchCollections();
    
    const handleHashChange = () => {
      fetchCollections();
    };
    
    const handleCollectionUpdated = () => {
      fetchCollections();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('gallery-collection-updated', handleCollectionUpdated);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('gallery-collection-updated', handleCollectionUpdated);
    };
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/collections`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const data = await response.json();
      
      if (!data) {
        console.error('Invalid API response:', data);
        setCollections([]);
        return;
      }
      
      setCollections(Array.isArray(data.collections) ? data.collections : []);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError(err.message || 'Failed to load collections');
      setCollections([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Collection title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/gallery/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create collection');
      }

      const data = await response.json();
      setSuccess(data.message || 'Collection created successfully!');
      setFormData({ title: '', subtitle: '', description: '', status: 'draft' });
      fetchCollections();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (collectionId: number) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/gallery/collections/${collectionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collection');
      }

      const data = await response.json();
      setSuccess(data.message || 'Collection deleted successfully!');
      setShowDeleteConfirm(null);
      fetchCollections();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCollection = (collectionId: number) => {
    window.location.hash = `#/dashboard/gallery/collection/${collectionId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="mb-12 pb-8 border-b border-slate-200">
          <h1 className="text-4xl md:text-5xl font-semibold mb-3 text-[#283593] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gallery Dashboard
          </h1>
          <p className="text-lg text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create digital collections and exhibitions for your gallery.
          </p>
        </div>

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

        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-semibold mb-2 text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create New Collection
          </h2>
          <p className="text-sm text-slate-400 mb-8">Curate artworks into themed exhibitions</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Collection Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                    placeholder="e.g., Contemporary Art Collection 2024"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subtitle" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Subtitle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                    placeholder="e.g., Modern Abstracts & Landscapes"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white resize-none"
                  placeholder="Tell visitors about this collection..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-[200px] md:mx-auto md:block px-8 py-3.5 bg-[#283593] text-white rounded-xl hover:bg-[#1a237e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#283593]/25 hover:shadow-xl hover:shadow-[#283593]/30"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
            My Collections ({collections.length})
          </h2>

          {collections.length === 0 ? (
            <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="mb-6 mx-auto w-32 h-32 flex items-center justify-center">
                <svg className="w-24 h-24 text-slate-200" fill="none" viewBox="0 0 96 96">
                  <rect x="8" y="20" width="80" height="56" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="16" y="28" width="24" height="16" rx="2" stroke="#D8B46A" strokeWidth="2" fill="none"/>
                  <rect x="48" y="28" width="32" height="8" rx="1" fill="currentColor"/>
                  <rect x="48" y="40" width="24" height="4" rx="1" fill="currentColor"/>
                  <rect x="16" y="52" width="64" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="24" y1="60" x2="72" y2="60" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                You don't have any collections yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                Create your first collection above to start curating artworks for your gallery exhibitions.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 transition-all group overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-br from-[#283593]/10 to-[#D8B46A]/10 flex items-center justify-center">
                    <svg className="w-16 h-16 text-[#283593]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-[#283593] group-hover:text-[#1a237e] transition-colors line-clamp-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {collection.title}
                      </h3>
                      <span className={`flex-shrink-0 ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        collection.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {collection.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {collection.subtitle && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-1">{collection.subtitle}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{collection.artwork_count} {collection.artwork_count === 1 ? 'artwork' : 'artworks'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Created {formatDate(collection.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleViewCollection(collection.id)}
                        className="flex-1 px-4 py-2.5 text-sm bg-[#283593] text-white rounded-xl hover:bg-[#1a237e] transition-all font-semibold shadow-sm"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        View Collection
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(collection.id)}
                        className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-semibold"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Delete
                      </button>
                    </div>

                    {showDeleteConfirm === collection.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-700 mb-3 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Delete this collection and all its artworks?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCollection(collection.id)}
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#283593]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#283593]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Account Details
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Email</span>
                <span className="text-slate-800">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Role</span>
                <span className="px-2.5 py-0.5 bg-[#283593]/10 text-[#283593] text-xs font-semibold rounded-full">Gallery</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Status</span>
                {user?.emailConfirmed ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pending
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Collections</span>
                <span className="text-slate-800 font-semibold">{collections.length}</span>
              </div>
            </div>
          </div>

          <ChangePasswordGallery />
        </div>

        <div className="mt-8">
          <YourPlanCard />
        </div>
      </div>
    </div>
  );
}
