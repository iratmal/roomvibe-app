import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ArtistProfile {
  displayName: string;
  locationCity: string;
  locationCountry: string;
  bio: string;
  primaryStyleTags: string[];
  primaryMedium: string;
  profileImageUrl: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  pinterestUrl: string;
  etsyUrl: string;
  languages: string[];
  visibleToDesigners: boolean;
  visibleToGalleries: boolean;
  artistAccess: boolean;
  slug: string;
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

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Dutch', 'Polish', 'Czech', 'Slovak',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic'
];

const COUNTRY_OPTIONS = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Brazzaville)', 'Congo (Kinshasa)',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

function SearchableCountrySelect({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRY_OPTIONS.filter(country =>
    country.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: string) => {
    onChange(country);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white text-left flex items-center justify-between"
      >
        <span className={value ? 'text-rv-text' : 'text-rv-textMuted'}>
          {value || 'Select country'}
        </span>
        <svg className={`w-5 h-5 text-rv-textMuted transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-rv-neutral rounded-rvMd shadow-rvElevated max-h-60 overflow-hidden">
          <div className="p-2 border-b border-rv-neutral">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-2 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full px-4 py-2 text-left text-sm text-rv-textMuted hover:bg-rv-surface"
              >
                Clear selection
              </button>
            )}
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-sm text-rv-textMuted text-center">
                No countries found
              </div>
            ) : (
              filteredCountries.map(country => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-rv-primary/10 transition-colors ${
                    value === country ? 'bg-rv-primary/10 text-rv-primary font-medium' : 'text-rv-text'
                  }`}
                >
                  {country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ArtistProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [profile, setProfile] = useState<ArtistProfile>({
    displayName: '',
    locationCity: '',
    locationCountry: '',
    bio: '',
    primaryStyleTags: [],
    primaryMedium: '',
    profileImageUrl: '',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    linkedinUrl: '',
    pinterestUrl: '',
    etsyUrl: '',
    languages: [],
    visibleToDesigners: false,
    visibleToGalleries: false,
    artistAccess: false,
    slug: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/profile`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: string, field: 'primaryStyleTags' | 'languages') => {
    setProfile(prev => {
      const currentTags = prev[field];
      if (currentTags.includes(tag)) {
        return { ...prev, [field]: currentTags.filter(t => t !== tag) };
      } else {
        if (field === 'primaryStyleTags' && currentTags.length >= 5) {
          return prev;
        }
        return { ...prev, [field]: [...currentTags, tag] };
      }
    });
  };

  const handleVisibilityChange = async (field: 'visibleToDesigners' | 'visibleToGalleries', value: boolean) => {
    if (!profile.artistAccess) {
      setError('You need an Artist subscription to enable visibility in Artist Connect.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/artist/profile/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          visibleToDesigners: field === 'visibleToDesigners' ? value : profile.visibleToDesigners,
          visibleToGalleries: field === 'visibleToGalleries' ? value : profile.visibleToGalleries
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to update visibility');
      }

      setProfile(prev => ({ ...prev, [field]: value }));
      setSuccess('Visibility settings updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating visibility:', err);
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/api/artist/profile/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const cacheBustUrl = `${data.profileImageUrl}?t=${Date.now()}`;
      setProfile(prev => ({ ...prev, profileImageUrl: cacheBustUrl }));
      setSuccess('Profile image updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/artist/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: profile.displayName,
          locationCity: profile.locationCity,
          locationCountry: profile.locationCountry,
          bio: profile.bio,
          primaryStyleTags: profile.primaryStyleTags,
          primaryMedium: profile.primaryMedium,
          websiteUrl: profile.websiteUrl,
          instagramUrl: profile.instagramUrl,
          facebookUrl: profile.facebookUrl,
          tiktokUrl: profile.tiktokUrl,
          languages: profile.languages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      if (data.profile?.slug) {
        setProfile(prev => ({ ...prev, slug: data.profile.slug }));
      }

      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileCompleteness = () => {
    const fields = [
      { name: 'displayName', value: profile.displayName },
      { name: 'city', value: profile.locationCity },
      { name: 'country', value: profile.locationCountry },
      { name: 'bio', value: profile.bio },
      { name: 'primaryMedium', value: profile.primaryMedium },
      { name: 'profilePhoto', value: profile.profileImageUrl },
      { name: 'styleTags', value: profile.primaryStyleTags?.length > 0 },
      { name: 'languages', value: profile.languages?.length > 0 },
      { name: 'website', value: profile.websiteUrl },
      { name: 'instagram', value: profile.instagramUrl },
    ];
    
    const filledCount = fields.filter(f => {
      if (typeof f.value === 'boolean') return f.value;
      if (typeof f.value === 'string') return f.value?.trim().length > 0;
      return false;
    }).length;
    
    return Math.round((filledCount / fields.length) * 100);
  };

  const profileCompleteness = calculateProfileCompleteness();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rv-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-rvMd text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-[#C9A24A]/10 border border-[#C9A24A]/30 rounded-rvMd text-[#8B7033]">
          {success}
        </div>
      )}

      <div className="p-4 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#C9A24A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-rv-text">Profile Completeness</span>
          </div>
          <span className={`text-sm font-bold ${profileCompleteness >= 80 ? 'text-[#C9A24A]' : profileCompleteness >= 50 ? 'text-[#C9A24A]/70' : 'text-rv-textMuted'}`}>
            {profileCompleteness}%
          </span>
        </div>
        <div className="w-full h-2 bg-rv-neutral rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 rounded-full bg-[#C9A24A]"
            style={{ width: `${profileCompleteness}%` }}
          />
        </div>
        <p className="text-xs text-rv-textMuted mt-2">
          Profiles with 100% completeness get more visibility
        </p>
      </div>

      {profile.slug && (
        <div className="p-5 bg-gradient-to-r from-[#C9A24A]/10 to-[#C9A24A]/5 rounded-rvLg border-2 border-[#C9A24A]/30 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C9A24A]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#C9A24A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-[#C9A24A] mb-1">Your Public Artist Page</h4>
              <p className="text-sm text-rv-textMuted mb-1">
                Share this page with collectors, designers and galleries
              </p>
              <p className="text-xs text-rv-textMuted mb-3">
                This is your main RoomVibe artist link.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/#/artist/${profile.slug}`}
                  className="flex-1 px-3 py-2 bg-white border border-rv-neutral rounded-rvMd text-sm text-rv-text font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#/artist/${profile.slug}`);
                    setSuccess('Link copied to clipboard!');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className="px-4 py-2 bg-[#C9A24A] text-white rounded-rvMd hover:bg-[#B8913A] transition-colors font-semibold text-sm whitespace-nowrap flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>
              </div>
              <a 
                href={`#/artist/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-[#C9A24A] hover:underline font-medium"
              >
                View your page
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-rv-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-rv-primary">Artist Connect Visibility</h3>
            <p className="text-sm text-rv-textMuted mt-1">
              Control who can discover your profile and reach out to you. Visible artists receive more inquiries.
            </p>
          </div>
        </div>

        {!profile.artistAccess && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-rvMd">
            <p className="text-sm text-amber-700">
              Upgrade to the Artist plan to enable visibility in Artist Connect and receive inquiries from designers and galleries.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className={`flex items-center gap-3 p-4 rounded-rvMd border-2 transition-all cursor-pointer ${
            profile.visibleToDesigners 
              ? 'bg-white border-rv-primary shadow-sm' 
              : 'bg-white/50 border-gray-200'
          } ${!profile.artistAccess ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={profile.visibleToDesigners}
              onChange={(e) => handleVisibilityChange('visibleToDesigners', e.target.checked)}
              disabled={!profile.artistAccess}
              className="w-5 h-5 rounded border-gray-300 text-rv-primary focus:ring-rv-primary accent-rv-primary"
            />
            <div>
              <span className="font-semibold text-rv-text">Visible to Designers</span>
              <p className="text-xs text-rv-textMuted">Interior designers can find and contact you</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-4 rounded-rvMd border-2 transition-all cursor-pointer ${
            profile.visibleToGalleries 
              ? 'bg-white border-rv-primary shadow-sm' 
              : 'bg-white/50 border-gray-200'
          } ${!profile.artistAccess ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={profile.visibleToGalleries}
              onChange={(e) => handleVisibilityChange('visibleToGalleries', e.target.checked)}
              disabled={!profile.artistAccess}
              className="w-5 h-5 rounded border-gray-300 text-rv-primary focus:ring-rv-primary accent-rv-primary"
            />
            <div>
              <span className="font-semibold text-rv-text">Visible to Galleries</span>
              <p className="text-xs text-rv-textMuted">Galleries can find and contact you</p>
            </div>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h3 className="text-xl font-bold mb-6 text-rv-primary">Profile Photo</h3>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-rv-surface border-2 border-rv-neutral overflow-hidden flex-shrink-0">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl.startsWith('http') ? profile.profileImageUrl : `${API_URL}${profile.profileImageUrl}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-rv-textMuted">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors cursor-pointer font-semibold text-sm">
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Photo
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-rv-textMuted mt-2">Max 5MB. JPG, PNG, or WebP.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h3 className="text-xl font-bold mb-6 text-rv-primary">Basic Information</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={profile.displayName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="Your artist name or studio name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                City
              </label>
              <input
                type="text"
                name="locationCity"
                value={profile.locationCity}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="e.g. Prague"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Country
              </label>
              <SearchableCountrySelect
                value={profile.locationCountry}
                onChange={(value) => setProfile(prev => ({ ...prev, locationCountry: value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Bio
              </label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary resize-none"
                placeholder="Tell us about yourself and your artistic practice..."
              />
              <p className="text-xs text-rv-textMuted mt-1">
                {profile.bio.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h3 className="text-xl font-bold mb-6 text-rv-primary">Artistic Practice</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Primary Medium
              </label>
              <select
                name="primaryMedium"
                value={profile.primaryMedium}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white"
              >
                <option value="">Select your primary medium</option>
                {MEDIUM_OPTIONS.map(medium => (
                  <option key={medium} value={medium}>{medium}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Style Tags <span className="font-normal text-rv-textMuted">(select up to 5)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLE_TAG_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag, 'primaryStyleTags')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      profile.primaryStyleTags.includes(tag)
                        ? 'bg-rv-primary text-white'
                        : 'bg-rv-surface text-rv-text border border-rv-neutral hover:border-rv-primary'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h3 className="text-xl font-bold mb-6 text-rv-primary">Contact & Links</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Website URL
              </label>
              <input
                type="text"
                name="websiteUrl"
                value={profile.websiteUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Instagram
              </label>
              <input
                type="text"
                name="instagramUrl"
                value={profile.instagramUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="@yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Facebook
              </label>
              <input
                type="text"
                name="facebookUrl"
                value={profile.facebookUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                TikTok
              </label>
              <input
                type="text"
                name="tiktokUrl"
                value={profile.tiktokUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="@yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                LinkedIn
              </label>
              <input
                type="text"
                name="linkedinUrl"
                value={profile.linkedinUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Pinterest
              </label>
              <input
                type="text"
                name="pinterestUrl"
                value={profile.pinterestUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="https://pinterest.com/yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-rv-text">
                Etsy Shop
              </label>
              <input
                type="text"
                name="etsyUrl"
                value={profile.etsyUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary"
                placeholder="https://etsy.com/shop/yourshop"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h3 className="text-xl font-bold mb-6 text-rv-primary">Languages</h3>
          
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => handleTagToggle(lang, 'languages')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  profile.languages.includes(lang)
                    ? 'bg-rv-primary text-white'
                    : 'bg-rv-surface text-rv-text border border-rv-neutral hover:border-rv-primary'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
