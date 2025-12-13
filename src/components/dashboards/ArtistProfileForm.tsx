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
  languages: string[];
  visibleToDesigners: boolean;
  visibleToGalleries: boolean;
  artistAccess: boolean;
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
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy',
  'Spain', 'Netherlands', 'Belgium', 'Austria', 'Switzerland',
  'Poland', 'Czech Republic', 'Slovakia', 'Canada', 'Australia',
  'Japan', 'South Korea', 'China', 'Brazil', 'Mexico', 'Other'
];

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
    languages: [],
    visibleToDesigners: false,
    visibleToGalleries: false,
    artistAccess: false
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
      setProfile(prev => ({ ...prev, profileImageUrl: data.profileImageUrl }));
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
          languages: profile.languages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-rvMd text-green-700">
          {success}
        </div>
      )}

      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-rvLg border border-purple-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-800">Artist Connect Visibility</h3>
            <p className="text-sm text-purple-600 mt-1">
              Control who can discover your profile and reach out to you.
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
              ? 'bg-white border-purple-400 shadow-sm' 
              : 'bg-white/50 border-gray-200'
          } ${!profile.artistAccess ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={profile.visibleToDesigners}
              onChange={(e) => handleVisibilityChange('visibleToDesigners', e.target.checked)}
              disabled={!profile.artistAccess}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="font-semibold text-rv-text">Visible to Designers</span>
              <p className="text-xs text-rv-textMuted">Interior designers can find and contact you</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-4 rounded-rvMd border-2 transition-all cursor-pointer ${
            profile.visibleToGalleries 
              ? 'bg-white border-purple-400 shadow-sm' 
              : 'bg-white/50 border-gray-200'
          } ${!profile.artistAccess ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={profile.visibleToGalleries}
              onChange={(e) => handleVisibilityChange('visibleToGalleries', e.target.checked)}
              disabled={!profile.artistAccess}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
              <select
                name="locationCountry"
                value={profile.locationCountry}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary bg-white"
              >
                <option value="">Select country</option>
                {COUNTRY_OPTIONS.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
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
