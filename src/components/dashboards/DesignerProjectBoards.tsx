import { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ProjectArtwork {
  linkId: number;
  addedAt: string;
  linkNotes?: string;
  id: number;
  artistId: number;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  dimensionUnit: string;
  orientation?: string;
  styleTags: string[];
  dominantColors: string[];
  medium?: string;
  artistName: string;
}

interface Project {
  id: number;
  title: string;
  client_name?: string;
  room_type?: string;
  notes?: string;
  image_count: number;
  created_at: string;
}

interface DesignerProjectBoardsProps {
  projects: Project[];
  onRefresh: () => void;
}

export function DesignerProjectBoards({ projects, onRefresh }: DesignerProjectBoardsProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectArtworks, setProjectArtworks] = useState<ProjectArtwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectArtworks(selectedProjectId);
    } else {
      setProjectArtworks([]);
    }
  }, [selectedProjectId]);

  const fetchProjectArtworks = async (projectId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/designer/projects/${projectId}/artworks`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project artworks');
      }

      const data = await response.json();
      setProjectArtworks(data.artworks || []);
    } catch (err: any) {
      console.error('Error fetching project artworks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveArtwork = async (artworkId: number) => {
    if (!selectedProjectId) return;
    
    setRemovingId(artworkId);
    try {
      const response = await fetch(
        `${API_URL}/api/designer/projects/${selectedProjectId}/artworks/${artworkId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove artwork');
      }

      setProjectArtworks(prev => prev.filter(a => a.id !== artworkId));
      onRefresh();
    } catch (err: any) {
      console.error('Error removing artwork:', err);
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Project Boards
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          View and manage saved artworks in your projects
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100">
          <div className="mb-4 mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No projects yet</h3>
          <p className="text-slate-500 text-sm">
            Create a project first to start saving artworks to it
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-4">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700">Your Projects</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedProjectId === project.id
                        ? 'bg-[#264C61]/5 border-l-4 border-[#264C61]'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <p className={`font-medium truncate ${
                      selectedProjectId === project.id ? 'text-[#264C61]' : 'text-slate-800'
                    }`}>
                      {project.title}
                    </p>
                    {project.client_name && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{project.client_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {project.image_count} {project.image_count === 1 ? 'artwork' : 'artworks'}
                      </span>
                      {project.room_type && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{project.room_type}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {!selectedProjectId ? (
              <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100">
                <div className="mb-4 mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">Select a project</h3>
                <p className="text-slate-500 text-sm">
                  Choose a project from the list to view saved artworks
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-xl font-semibold text-[#264C61]">{selectedProject?.title}</h3>
                  {selectedProject?.client_name && (
                    <p className="text-sm text-slate-500 mt-1">Client: {selectedProject.client_name}</p>
                  )}
                  {selectedProject?.notes && (
                    <p className="text-sm text-slate-500 mt-2 italic border-l-2 border-[#D8B46A] pl-3">
                      {selectedProject.notes}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="m-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#264C61] border-t-transparent"></div>
                  </div>
                ) : projectArtworks.length === 0 ? (
                  <div className="text-center py-12 px-8">
                    <div className="mb-4 mx-auto w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium">No artworks saved yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Browse the Art Library to find and add artworks to this project
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectArtworks.map((artwork) => (
                        <div
                          key={artwork.linkId}
                          className="group bg-slate-50 rounded-xl overflow-hidden hover:shadow-md transition-all"
                        >
                          <div className="aspect-square relative overflow-hidden bg-slate-200">
                            <img
                              src={artwork.imageUrl}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <button
                              onClick={() => handleRemoveArtwork(artwork.id)}
                              disabled={removingId === artwork.id}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                            >
                              {removingId === artwork.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-slate-800 text-sm truncate">{artwork.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">by {artwork.artistName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {artwork.width} × {artwork.height} {artwork.dimensionUnit}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Added {formatDate(artwork.addedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
