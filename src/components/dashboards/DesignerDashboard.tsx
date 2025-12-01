import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { SubscriptionCard } from '../SubscriptionCard';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

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

export function DesignerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    roomType: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

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

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        {/* Header Section with warm grey background */}
        <div className="mb-12 pb-8 border-b border-slate-200">
          <h1 className="text-4xl md:text-5xl font-semibold mb-3 text-[#283593] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Designer Dashboard
          </h1>
          <p className="text-lg text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create client projects and generate room visualizations.
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

        {/* Premium Create New Project Card */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-semibold mb-2 text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
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
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
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
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white appearance-none cursor-pointer"
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
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white resize-none"
                  placeholder="Add any notes or details about this project..."
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-[200px] md:mx-auto md:block px-8 py-3.5 bg-[#283593] text-white rounded-xl hover:bg-[#1a237e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#283593]/25 hover:shadow-xl hover:shadow-[#283593]/30"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>

        {/* My Projects Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                  <h3 className="text-xl font-semibold mb-3 text-[#283593] group-hover:text-[#1a237e] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                      className="flex-1 px-4 py-2.5 text-sm bg-[#283593] text-white rounded-xl hover:bg-[#1a237e] transition-all font-semibold shadow-sm"
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

        {/* Account & Security Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Designer Account Card - Clean, minimal design */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              {/* Avatar placeholder */}
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
                <span className="px-2.5 py-0.5 bg-[#283593]/10 text-[#283593] text-xs font-semibold rounded-full">Designer</span>
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
                <span className="font-medium text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Projects</span>
                <span className="text-slate-800 font-semibold">{projects.length}</span>
              </div>
            </div>
          </div>

          {/* Change Password Card with enhanced styling */}
          <ChangePasswordDesigner />
        </div>

        <div className="mt-8">
          <SubscriptionCard />
        </div>
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
        <div className="w-10 h-10 rounded-full bg-[#283593]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#283593]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#283593]" style={{ fontFamily: 'Inter, sans-serif' }}>
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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283593] focus:border-transparent transition-all bg-slate-50 hover:bg-white"
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
          className="w-full px-4 py-2.5 rounded-lg text-white font-semibold bg-[#283593] hover:bg-[#1a237e] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
