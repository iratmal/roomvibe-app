import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { SiteHeader } from '../SiteHeader';
import { PLAN_LIMITS } from '../../config/planLimits';
import { DesignerArtLibrary } from './DesignerArtLibrary';
import { DesignerProjectBoards } from './DesignerProjectBoards';
import { DesignerSentMessages } from './DesignerSentMessages';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

type DashboardTab = 'projects' | 'art-library' | 'boards' | 'messages';

interface Project {
  id: number;
  designer_id: number;
  title: string;
  client_name?: string;
  room_type?: string;
  notes?: string;
  image_count: number;
  created_at: string;
  updated_at: string;
}

interface Artwork {
  id: number;
  artist_id: number;
  title: string;
  image_url: string;
  width: number;
  height: number;
  dimension_unit: string;
  created_at: string;
}

export function DesignerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [artworkLoading, setArtworkLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showArtworkDeleteConfirm, setShowArtworkDeleteConfirm] = useState<number | null>(null);

  const effectivePlan = user?.effectivePlan || 'designer';
  const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.designer;
  const maxArtworks = planLimits.maxArtworks;
  const isAtArtworkLimit = maxArtworks !== -1 && artworks.length >= maxArtworks;

  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    roomType: '',
    notes: ''
  });

  const [artworkForm, setArtworkForm] = useState({
    title: '',
    width: '',
    height: '',
    dimensionUnit: 'cm',
    image: null as File | null
  });

  useEffect(() => {
    fetchProjects();
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setArtworks(data.artworks || []);
      }
    } catch (err) {
      console.error('Error fetching artworks:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/designer/projects`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
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
      setError('Project title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/designer/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      setSuccess(data.message || 'Project created successfully!');
      setFormData({
        title: '',
        clientName: '',
        roomType: '',
        notes: ''
      });
      await fetchProjects();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/designer/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setSuccess('Project deleted successfully!');
      setShowDeleteConfirm(null);
      await fetchProjects();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message);
    }
  };

  const viewProject = (projectId: number) => {
    window.location.hash = `#/dashboard/designer/project/${projectId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleArtworkInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArtworkForm(prev => ({ ...prev, [name]: value }));
  };

  const handleArtworkImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArtworkForm(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleArtworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!artworkForm.title || !artworkForm.image) {
      setError('Please provide a title and image');
      return;
    }

    if (isAtArtworkLimit) {
      setError(`You've reached your limit of ${maxArtworks} artworks. Upgrade your plan for more.`);
      return;
    }

    setArtworkLoading(true);
    setError('');

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', artworkForm.title);
      formDataObj.append('width', artworkForm.width || '50');
      formDataObj.append('height', artworkForm.height || '50');
      formDataObj.append('dimensionUnit', artworkForm.dimensionUnit);
      formDataObj.append('buyUrl', 'https://example.com');
      formDataObj.append('image', artworkForm.image);

      const response = await fetch(`${API_URL}/api/artist/artworks`, {
        method: 'POST',
        credentials: 'include',
        body: formDataObj
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to upload artwork');
      }

      setSuccess('Artwork uploaded successfully!');
      setArtworkForm({
        title: '',
        width: '',
        height: '',
        dimensionUnit: 'cm',
        image: null
      });
      
      const fileInput = document.querySelector('#artworkImage') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await fetchArtworks();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setArtworkLoading(false);
    }
  };

  const handleArtworkDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/artist/artworks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setSuccess('Artwork deleted successfully!');
      setShowArtworkDeleteConfirm(null);
      await fetchArtworks();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <SiteHeader showPlanBadge={true} />
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        {/* Header Section */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-4xl md:text-5xl font-semibold mb-2 text-[#264C61] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Designer Dashboard
          </h1>
          <p className="text-lg text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Welcome back, {user?.email || 'Designer'}!
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'projects'
                  ? 'border-[#264C61] text-[#264C61]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                My Projects
              </span>
            </button>
            <button
              onClick={() => setActiveTab('art-library')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'art-library'
                  ? 'border-[#264C61] text-[#264C61]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Art Library
              </span>
            </button>
            <button
              onClick={() => setActiveTab('boards')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'boards'
                  ? 'border-[#264C61] text-[#264C61]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Project Boards
              </span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'messages'
                  ? 'border-[#264C61] text-[#264C61]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Sent Messages
              </span>
            </button>
          </nav>
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

        {/* Tab Content */}
        {activeTab === 'art-library' && (
          <DesignerArtLibrary 
            projects={projects.map(p => ({ id: p.id, title: p.title }))}
          />
        )}

        {activeTab === 'boards' && (
          <DesignerProjectBoards 
            projects={projects} 
            onRefresh={fetchProjects}
          />
        )}

        {activeTab === 'messages' && (
          <DesignerSentMessages />
        )}

        {activeTab === 'projects' && (
          <>
        {/* Premium Create New Project Card */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-semibold mb-2 text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create New Project
          </h2>
          <p className="text-sm text-slate-400 mb-8">Start a new client visualization project</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title - full width on mobile, half on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Project Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                    placeholder="e.g., Modern Living Room Redesign"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="clientName" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Client Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="roomType" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Room Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <select
                  id="roomType"
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                >
                  <option value="">Select room type</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Office">Office</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Notes
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white resize-none"
                  placeholder="Add any notes or details about this project..."
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-[200px] md:mx-auto md:block px-8 py-3.5 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#264C61]/25 hover:shadow-xl hover:shadow-[#264C61]/30"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>

        {/* My Projects Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
            My Projects
          </h2>
          
          {projects.length === 0 ? (
            /* Premium Empty State */
            <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              {/* Empty State Illustration */}
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
                You don't have any projects yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                Create your first project above to organize your client work and start visualizing artwork in their spaces.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                >
                  <h3 className="text-xl font-semibold mb-3 text-[#264C61] group-hover:text-[#1D3A4A] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {project.title}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    {project.client_name && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{project.client_name}</span>
                      </div>
                    )}
                    
                    {project.room_type && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>{project.room_type}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{project.image_count} {project.image_count === 1 ? 'image' : 'images'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  
                  {project.notes && (
                    <p className="text-sm text-slate-500 mb-4 italic line-clamp-2 border-l-2 border-[#D8B46A] pl-3">
                      {project.notes}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => viewProject(project.id)}
                      className="flex-1 px-4 py-2.5 text-sm bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-all font-semibold shadow-sm"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      View Project
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(project.id)}
                      className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Delete
                    </button>
                  </div>

                  {showDeleteConfirm === project.id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm text-red-700 mb-3 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Are you sure you want to delete this project?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
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
              ))}
            </div>
          )}
        </div>

        {/* Upload Artwork & Photos Section */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Upload Artwork & Photos
              </h2>
              <p className="text-sm text-slate-400">Upload images to use in Studio visualizations</p>
            </div>
            <div className="text-sm text-slate-500">
              {artworks.length} / {maxArtworks === -1 ? '∞' : maxArtworks} uploads
            </div>
          </div>
          
          <form onSubmit={handleArtworkSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="artworkTitle" className="block text-sm font-semibold text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="artworkTitle"
                  name="title"
                  value={artworkForm.title}
                  onChange={handleArtworkInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                  placeholder="e.g., Client Room Photo"
                  required
                />
              </div>
              <div>
                <label htmlFor="artworkImage" className="block text-sm font-semibold text-slate-700 mb-2">
                  Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="artworkImage"
                  accept="image/*"
                  onChange={handleArtworkImageChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#264C61] file:text-white hover:file:bg-[#1D3A4A]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="artworkWidth" className="block text-sm font-semibold text-slate-700 mb-2">
                  Width (optional)
                </label>
                <input
                  type="number"
                  id="artworkWidth"
                  name="width"
                  value={artworkForm.width}
                  onChange={handleArtworkInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                  placeholder="50"
                />
              </div>
              <div>
                <label htmlFor="artworkHeight" className="block text-sm font-semibold text-slate-700 mb-2">
                  Height (optional)
                </label>
                <input
                  type="number"
                  id="artworkHeight"
                  name="height"
                  value={artworkForm.height}
                  onChange={handleArtworkInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                  placeholder="50"
                />
              </div>
              <div>
                <label htmlFor="artworkUnit" className="block text-sm font-semibold text-slate-700 mb-2">
                  Unit
                </label>
                <select
                  id="artworkUnit"
                  name="dimensionUnit"
                  value={artworkForm.dimensionUnit}
                  onChange={handleArtworkInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                >
                  <option value="cm">cm</option>
                  <option value="in">inches</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={artworkLoading || isAtArtworkLimit}
              className="px-8 py-3.5 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#264C61]/25"
            >
              {artworkLoading ? 'Uploading...' : isAtArtworkLimit ? 'Limit Reached' : 'Upload Artwork'}
            </button>
          </form>
        </div>

        {/* My Artworks Grid */}
        {artworks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
              My Artworks
            </h2>
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                >
                  <div className="aspect-square bg-slate-100 relative">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#264C61] truncate mb-1">{artwork.title}</h3>
                    <p className="text-sm text-slate-400">
                      {artwork.width} × {artwork.height} {artwork.dimension_unit}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setShowArtworkDeleteConfirm(artwork.id)}
                        className="flex-1 text-xs px-3 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    {showArtworkDeleteConfirm === artwork.id && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-700 mb-2">Delete this artwork?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleArtworkDelete(artwork.id)}
                            className="flex-1 text-xs px-2 py-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowArtworkDeleteConfirm(null)}
                            className="flex-1 text-xs px-2 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-100"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Studio Card */}
        <div className="mb-12 p-8 bg-gradient-to-br from-[#264C61] to-[#1D3A4A] rounded-2xl shadow-lg text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Studio
              </h2>
              <p className="text-white/80 mb-6 max-w-md">
                Visualize your projects with premium mockup rooms. Access 100+ premium rooms, high-resolution exports, and PDF generation.
              </p>
              <a
                href="#/studio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#264C61] rounded-xl hover:bg-slate-100 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Open Studio
              </a>
            </div>
            <div className="hidden md:block opacity-20">
              <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Your Plan Section */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your Plan
            </h2>
            <span className="px-4 py-1.5 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
              Designer
            </span>
          </div>
          <p className="text-slate-600 mb-6">
            You're on the Designer plan. Perfect for interior designers presenting concepts to clients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Upload up to 100 artworks
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Access to 100+ premium mockup rooms
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              High-resolution export (3000px+)
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              PDF export
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Designer Studio tools
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mockup downloads
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Unlimited previews
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#/billing"
              className="px-6 py-2.5 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-colors font-semibold"
            >
              Manage billing
            </a>
            <a
              href="#/pricing"
              className="px-6 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:border-[#264C61] hover:text-[#264C61] transition-colors font-semibold"
            >
              View all plans
            </a>
          </div>
        </div>

        {/* Account & Security Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#264C61]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#264C61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Account Details
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600">Email</span>
                <span className="text-slate-800">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600">Role</span>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Designer</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="font-medium text-slate-600">Artworks</span>
                <span className="text-slate-800 font-semibold">{artworks.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-slate-600">Projects</span>
                <span className="text-slate-800 font-semibold">{projects.length}</span>
              </div>
            </div>
          </div>

          <ChangePasswordDesigner />
        </div>
          </>
        )}
      </div>
    </div>
  );
}

// Custom Change Password component for Designer Dashboard with enhanced styling
function ChangePasswordDesigner() {
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.message || data.error || 'Password change failed' });
      }
    } catch (error) {
      console.error('Change password error:', error);
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-[#264C61]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#264C61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Change Password
        </h3>
      </div>
      <p className="text-sm text-slate-400 mb-5 ml-13" style={{ fontFamily: 'Inter, sans-serif' }}>
        Update your password to keep your account secure.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Current Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Must be at least 6 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
              disabled={isLoading}
            />
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2.5 rounded-lg text-white font-semibold bg-[#264C61] hover:bg-[#1D3A4A] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
