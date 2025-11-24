import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ImpersonationBanner from './ImpersonationBanner';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Project {
  id: number;
  designer_id: number;
  title: string;
  client_name?: string;
  room_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface RoomImage {
  id: number;
  project_id: number;
  image_url: string;
  label?: string;
  created_at: string;
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [rooms, setRooms] = useState<RoomImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLabel, setImageLabel] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchRooms();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`${API_URL}/api/designer/projects/${projectId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data.project);
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/designer/projects/${projectId}/rooms`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room images');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (imageLabel.trim()) {
        formData.append('label', imageLabel);
      }

      const response = await fetch(`${API_URL}/api/designer/projects/${projectId}/rooms`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload room image');
      }

      const data = await response.json();
      setSuccess(data.message || 'Room image uploaded successfully!');
      setSelectedFile(null);
      setImageLabel('');
      setUploadPreview(null);
      await fetchRooms();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error uploading room image:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/designer/rooms/${roomId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete room image');
      }

      setSuccess('Room image deleted successfully!');
      setShowDeleteConfirm(null);
      await fetchRooms();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error deleting room image:', err);
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-rv-textMuted">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ImpersonationBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate('/dashboard/designer')}
          className="mb-6 flex items-center gap-2 text-rv-primary hover:text-rv-primaryHover transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>

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
          <h1 className="text-3xl font-bold mb-4 text-rv-primary">{project.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.client_name && (
              <div>
                <p className="text-sm font-semibold text-rv-text mb-1">Client</p>
                <p className="text-rv-textMuted">{project.client_name}</p>
              </div>
            )}
            
            {project.room_type && (
              <div>
                <p className="text-sm font-semibold text-rv-text mb-1">Room Type</p>
                <p className="text-rv-textMuted">{project.room_type}</p>
              </div>
            )}
          </div>
          
          {project.notes && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-rv-text mb-1">Notes</p>
              <p className="text-rv-textMuted italic">{project.notes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-rv-neutral">
            <p className="text-xs text-rv-textMuted">
              Created: {formatDate(project.created_at)} • Last updated: {formatDate(project.updated_at)}
            </p>
          </div>
        </div>

        <div className="mb-10 p-6 bg-white rounded-rvLg border border-rv-neutral">
          <h2 className="text-2xl font-bold mb-6 text-rv-text">Upload Room Image</h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="roomImage" className="block text-sm font-semibold text-rv-text mb-2">
                Room Photo <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="roomImage"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary file:mr-4 file:py-2 file:px-4 file:rounded-rvMd file:border-0 file:text-sm file:font-semibold file:bg-rv-primary file:text-white hover:file:bg-rv-primaryHover"
                required
              />
              <p className="mt-1 text-xs text-rv-textMuted">
                Supported formats: JPG, PNG, WEBP (max 10MB)
              </p>
            </div>

            {uploadPreview && (
              <div className="p-4 bg-rv-surface rounded-rvMd border border-rv-neutral">
                <p className="text-sm font-semibold text-rv-text mb-2">Preview</p>
                <img
                  src={uploadPreview}
                  alt="Upload preview"
                  className="max-h-64 rounded-rvMd mx-auto"
                />
              </div>
            )}

            <div>
              <label htmlFor="label" className="block text-sm font-semibold text-rv-text mb-2">
                Label (optional)
              </label>
              <input
                type="text"
                id="label"
                value={imageLabel}
                onChange={(e) => setImageLabel(e.target.value)}
                className="w-full px-4 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="e.g., Main view, Corner angle, Before photo"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="w-full px-6 py-3 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Upload Room Image'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-rv-text">
            Room Images ({rooms.length})
          </h2>
          
          {rooms.length === 0 ? (
            <div className="text-center py-12 bg-rv-surface rounded-rvLg border border-rv-neutral">
              <p className="text-rv-textMuted text-lg">No room images yet. Upload your first image above!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 bg-white border border-rv-neutral rounded-rvLg hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video mb-3 bg-rv-surface rounded-rvMd overflow-hidden">
                    <img
                      src={`${API_URL}${room.image_url}`}
                      alt={room.label || 'Room image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {room.label && (
                    <p className="text-sm font-semibold text-rv-text mb-2">{room.label}</p>
                  )}
                  
                  <p className="text-xs text-rv-textMuted mb-3">
                    Uploaded: {formatDate(room.created_at)}
                  </p>

                  <button
                    onClick={() => setShowDeleteConfirm(room.id)}
                    className="w-full px-4 py-2 text-sm bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold"
                  >
                    Delete Image
                  </button>

                  {showDeleteConfirm === room.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-rvMd">
                      <p className="text-sm text-red-700 mb-2 font-semibold">
                        Are you sure you want to delete this image?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
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
      </div>
    </div>
  );
}
