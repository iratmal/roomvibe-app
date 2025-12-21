import { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Artist {
  id: number;
  name: string;
  email: string;
  bio?: string;
  city?: string;
  country?: string;
  primaryMedium?: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  artworkCount: number;
  styleTags: string[];
}

interface FilterOptions {
  styles: string[];
  mediums: string[];
  availabilities: string[];
  countries: string[];
  cities: string[];
  sizeRange: {
    min_width: number;
    max_width: number;
    min_height: number;
    max_height: number;
  };
}

interface GalleryArtistDirectoryProps {
  onArtistSelect: (artistId: number) => void;
}

export function GalleryArtistDirectory({ onArtistSelect }: GalleryArtistDirectoryProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    style: '',
    medium: '',
    availability: '',
    country: '',
    city: '',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: ''
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchArtists();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gallery/artist-directory/filters`, {
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

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${API_URL}/api/gallery/artist-directory?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }

      const data = await response.json();
      setArtists(data.artists || []);
    } catch (err: any) {
      console.error('Error fetching artists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchArtists();
  };

  const clearFilters = () => {
    setFilters({
      style: '',
      medium: '',
      availability: '',
      country: '',
      city: '',
      minWidth: '',
      maxWidth: '',
      minHeight: '',
      maxHeight: ''
    });
    setTimeout(fetchArtists, 0);
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Artist Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Discover artists available for exhibitions and collaborations
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Availability</option>
                {filterOptions.availabilities.map(avail => (
                  <option key={avail} value={avail}>{avail}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Countries</option>
                {filterOptions.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#264C61] bg-white"
              >
                <option value="">All Cities</option>
                {filterOptions.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
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
      ) : artists.length === 0 ? (
        <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100">
          <div className="mb-4 mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No artists found</h3>
          <p className="text-slate-500 text-sm">
            {activeFilterCount > 0 
              ? 'Try adjusting your filters to see more results'
              : 'Artists who enable gallery visibility will appear here'}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm text-[#264C61] border border-[#264C61] rounded-lg hover:bg-[#264C61]/5 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onArtistSelect(artist.id)}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {artist.profileImageUrl ? (
                    <img
                      src={artist.profileImageUrl}
                      alt={artist.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#264C61] flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                      {artist.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#264C61] text-lg truncate group-hover:text-[#1D3A4A] transition-colors">
                      {artist.name}
                    </h3>
                    {(artist.city || artist.country) && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {[artist.city, artist.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {artist.primaryMedium && (
                      <p className="text-xs text-[#D8B46A] mt-1">{artist.primaryMedium}</p>
                    )}
                  </div>
                </div>

                {artist.styleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {artist.styleTags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {artist.styleTags.length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                        +{artist.styleTags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    {artist.artworkCount} {artist.artworkCount === 1 ? 'artwork' : 'artworks'}
                  </span>
                  <span className="text-sm text-[#264C61] font-medium group-hover:text-[#1D3A4A] transition-colors flex items-center gap-1">
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
