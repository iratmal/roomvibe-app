import { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Artist {
  id: number;
  name: string;
  email: string;
  city?: string;
  country?: string;
  bio?: string;
  primaryMedium?: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

interface LibraryArtwork {
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
  availability?: string;
  artist: Artist;
}

interface FilterOptions {
  styles: string[];
  mediums: string[];
  orientations: string[];
  colors: string[];
  sizeRange: {
    min_width: number;
    max_width: number;
    min_height: number;
    max_height: number;
  };
}

interface Project {
  id: number;
  title: string;
}

interface DesignerArtLibraryProps {
  onArtworkSelect?: (artwork: LibraryArtwork) => void;
  projects?: Project[];
}

export function DesignerArtLibrary({ onArtworkSelect, projects = [] }: DesignerArtLibraryProps) {
  const [artworks, setArtworks] = useState<LibraryArtwork[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState<LibraryArtwork | null>(null);
  const [addToProjectId, setAddToProjectId] = useState<number | null>(null);
  const [addingToProject, setAddingToProject] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    style: '',
    medium: '',
    orientation: '',
    color: '',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: ''
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchArtworks();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/designer/art-library/filters`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${API_URL}/api/designer/art-library?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch art library');
      }

      const data = await response.json();
      setArtworks(data.artworks || []);
    } catch (err: any) {
      console.error('Error fetching art library:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchArtworks();
  };

  const clearFilters = () => {
    setFilters({
      style: '',
      medium: '',
      orientation: '',
      color: '',
      minWidth: '',
      maxWidth: '',
      minHeight: '',
      maxHeight: ''
    });
    setTimeout(fetchArtworks, 0);
  };

  const handleAddToProject = async (artworkId: number, projectId: number) => {
    setAddingToProject(true);
    try {
      const response = await fetch(`${API_URL}/api/designer/projects/${projectId}/artworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ artworkId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add artwork');
      }

      setAddToProjectId(null);
      setSelectedArtwork(null);
      alert('Artwork added to project successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingToProject(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Art Library
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Discover artwork from artists who share their work with designers
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-[#264C61] text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && filterOptions && (
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Style</label>
              <select
                value={filters.style}
                onChange={(e) => handleFilterChange('style', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Styles</option>
                {filterOptions.styles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medium</label>
              <select
                value={filters.medium}
                onChange={(e) => handleFilterChange('medium', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Mediums</option>
                {filterOptions.mediums.map(medium => (
                  <option key={medium} value={medium}>{medium}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
              <select
                value={filters.orientation}
                onChange={(e) => handleFilterChange('orientation', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Orientations</option>
                {filterOptions.orientations.map(orientation => (
                  <option key={orientation} value={orientation}>{orientation.charAt(0).toUpperCase() + orientation.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
              <select
                value={filters.color}
                onChange={(e) => handleFilterChange('color', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Colors</option>
                {filterOptions.colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Width (cm)</label>
              <input
                type="number"
                value={filters.minWidth}
                onChange={(e) => handleFilterChange('minWidth', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61]"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Width (cm)</label>
              <input
                type="number"
                value={filters.maxWidth}
                onChange={(e) => handleFilterChange('maxWidth', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61]"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Height (cm)</label>
              <input
                type="number"
                value={filters.minHeight}
                onChange={(e) => handleFilterChange('minHeight', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61]"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Height (cm)</label>
              <input
                type="number"
                value={filters.maxHeight}
                onChange={(e) => handleFilterChange('maxHeight', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61]"
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-[#264C61] text-white rounded-lg hover:bg-[#1D3A4A] transition-colors text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#264C61] border-t-transparent"></div>
        </div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100">
          <div className="mb-4 mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No artworks found</h3>
          <p className="text-slate-500 text-sm">
            {activeFilterCount > 0 
              ? 'Try adjusting your filters to see more results'
              : 'Artists who enable designer visibility will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer"
              onClick={() => {
                setSelectedArtwork(artwork);
                onArtworkSelect?.(artwork);
              }}
            >
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-medium truncate">
                      {artwork.artist.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-slate-800 text-sm truncate">{artwork.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {artwork.width} × {artwork.height} {artwork.dimensionUnit}
                </p>
                {artwork.medium && (
                  <p className="text-xs text-[#D8B46A] mt-1 truncate">{artwork.medium}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArtwork && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="aspect-video bg-slate-100">
                <img
                  src={selectedArtwork.imageUrl}
                  alt={selectedArtwork.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-semibold text-[#264C61] mb-2">{selectedArtwork.title}</h2>
              
              <div className="flex items-center gap-3 mb-4">
                {selectedArtwork.artist.profileImageUrl ? (
                  <img
                    src={selectedArtwork.artist.profileImageUrl}
                    alt={selectedArtwork.artist.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#264C61] flex items-center justify-center text-white font-medium">
                    {selectedArtwork.artist.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-800">{selectedArtwork.artist.name}</p>
                  {(selectedArtwork.artist.city || selectedArtwork.artist.country) && (
                    <p className="text-sm text-slate-500">
                      {[selectedArtwork.artist.city, selectedArtwork.artist.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-0.5">Dimensions</p>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedArtwork.width} × {selectedArtwork.height} {selectedArtwork.dimensionUnit}
                  </p>
                </div>
                {selectedArtwork.medium && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Medium</p>
                    <p className="text-sm font-medium text-slate-800">{selectedArtwork.medium}</p>
                  </div>
                )}
                {selectedArtwork.orientation && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Orientation</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{selectedArtwork.orientation}</p>
                  </div>
                )}
                {selectedArtwork.availability && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Availability</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{selectedArtwork.availability}</p>
                  </div>
                )}
              </div>

              {selectedArtwork.styleTags.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Style Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArtwork.styleTags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedArtwork.artist.bio && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">About the Artist</p>
                  <p className="text-sm text-slate-700">{selectedArtwork.artist.bio}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {projects.length > 0 && (
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-slate-500 mb-1">Add to Project</label>
                    <div className="flex gap-2">
                      <select
                        value={addToProjectId || ''}
                        onChange={(e) => setAddToProjectId(Number(e.target.value) || null)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#264C61]"
                      >
                        <option value="">Select project...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addToProjectId && handleAddToProject(selectedArtwork.id, addToProjectId)}
                        disabled={!addToProjectId || addingToProject}
                        className="px-4 py-2 bg-[#264C61] text-white rounded-lg hover:bg-[#1D3A4A] transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {addingToProject ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedArtwork.artist.websiteUrl && (
                    <a
                      href={selectedArtwork.artist.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      Website
                    </a>
                  )}
                  {selectedArtwork.artist.instagramUrl && (
                    <a
                      href={selectedArtwork.artist.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
