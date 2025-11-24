import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { ChangePassword } from '../ChangePassword';

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
    <div className="min-h-screen bg-white">
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2 text-rv-primary">Designer Dashboard</h1>
          <p className="text-lg text-rv-textMuted">
            Create projects and upload room visuals for your clients.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-rvMd">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-rvMd">
            <p className="text-green-700 font-semibold">{success}</p>
          </div>
        )}

        <div className="mb-10 p-6 bg-rv-surface rounded-rvLg border border-rv-neutral">
          <h2 className="text-2xl font-bold mb-6 text-rv-text">Create New Project</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-rv-text mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="e.g., Modern Living Room Redesign"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-semibold text-rv-text mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label htmlFor="roomType" className="block text-sm font-semibold text-rv-text mb-2">
                  Room Type
                </label>
                <select
                  id="roomType"
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
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
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-rv-text mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary resize-none"
                placeholder="Add any notes or details about this project..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-rv-text">My Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-rv-surface rounded-rvLg border border-rv-neutral">
              <p className="text-rv-textMuted text-lg">No projects yet. Create your first project above!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-6 bg-white border border-rv-neutral rounded-rvLg hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold mb-2 text-rv-primary">{project.title}</h3>
                  
                  {project.client_name && (
                    <p className="text-sm text-rv-textMuted mb-1">
                      <span className="font-semibold">Client:</span> {project.client_name}
                    </p>
                  )}
                  
                  {project.room_type && (
                    <p className="text-sm text-rv-textMuted mb-1">
                      <span className="font-semibold">Room:</span> {project.room_type}
                    </p>
                  )}
                  
                  <p className="text-sm text-rv-textMuted mb-1">
                    <span className="font-semibold">Images:</span> {project.image_count}
                  </p>
                  
                  <p className="text-sm text-rv-textMuted mb-4">
                    <span className="font-semibold">Created:</span> {formatDate(project.created_at)}
                  </p>
                  
                  {project.notes && (
                    <p className="text-sm text-rv-text mb-4 italic line-clamp-2">
                      "{project.notes}"
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => viewProject(project.id)}
                      className="flex-1 px-4 py-2 text-sm bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold"
                    >
                      View Project
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(project.id)}
                      className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold"
                    >
                      Delete
                    </button>
                  </div>

                  {showDeleteConfirm === project.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-rvMd">
                      <p className="text-sm text-red-700 mb-2 font-semibold">
                        Are you sure you want to delete this project?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(project.id)}
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
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-purple-50 rounded-rvLg border border-purple-200">
            <h3 className="text-lg font-bold mb-3 text-purple-700">Designer Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Designer</span></p>
              <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-green-600 font-semibold">✓ Verified</span> : <span className="text-amber-600 font-semibold">⚠ Pending</span>}</p>
              <p><span className="font-semibold text-rv-text">Projects:</span> <span className="text-rv-textMuted">{projects.length}</span></p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
