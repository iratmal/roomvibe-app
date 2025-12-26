import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface SearchUser {
  id: number;
  email: string;
  effectivePlan: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface FixtureUser {
  plan: string;
  email: string;
  exists: boolean;
  user: { id: number; email: string; effectivePlan: string } | null;
}

export function AdminDashboard() {
  const { user, logout, startImpersonation, setImpersonation } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [fixtures, setFixtures] = useState<FixtureUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingFixtures, setLoadingFixtures] = useState(true);

  useEffect(() => {
    fetchFixtureUsers();
  }, []);

  const fetchFixtureUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/impersonate/fixture-users`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFixtures(data.fixtures || []);
      }
    } catch (err) {
      console.error('Error fetching fixture users:', err);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/impersonate/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleImpersonateUser = async (userId: number, plan: string) => {
    await startImpersonation(userId);
    const routes: Record<string, string> = {
      user: '#/dashboard',
      artist: '#/dashboard/artist',
      designer: '#/dashboard/designer',
      gallery: '#/dashboard/gallery',
      allaccess: '#/dashboard',
    };
    setTimeout(() => {
      window.location.hash = routes[plan] || '#/dashboard';
    }, 100);
  };

  const handleImpersonateFixture = async (fixture: FixtureUser) => {
    if (!fixture.exists || !fixture.user) return;
    await handleImpersonateUser(fixture.user.id, fixture.user.effectivePlan);
  };

  const handleLegacyImpersonate = (role: 'user' | 'artist' | 'designer' | 'gallery' | 'allin') => {
    setImpersonation(role);
    const routes: Record<string, string> = {
      user: '#/dashboard',
      artist: '#/dashboard/artist',
      designer: '#/dashboard/designer',
      gallery: '#/dashboard/gallery',
      allin: '#/dashboard',
    };
    setTimeout(() => {
      window.location.hash = routes[role];
    }, 50);
  };

  const planColors: Record<string, string> = {
    user: 'bg-blue-100 text-blue-800',
    free: 'bg-blue-100 text-blue-800',
    artist: 'bg-amber-100 text-amber-800',
    designer: 'bg-indigo-100 text-indigo-800',
    gallery: 'bg-purple-100 text-purple-800',
    allaccess: 'bg-green-100 text-green-800',
  };

  const planLabels: Record<string, string> = {
    user: 'Free',
    free: 'Free',
    artist: 'Artist',
    designer: 'Designer',
    gallery: 'Gallery',
    allaccess: 'All-Access',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">Admin Dashboard</h1>
            <p className="text-rv-textMuted">Full platform administration and management</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/studio"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rv-primary text-white text-sm font-semibold rounded-lg hover:bg-rv-primaryHover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Open Studio</span>
              <span className="sm:hidden">Studio</span>
            </a>
            <button
              onClick={logout}
              className="px-4 py-2.5 text-sm font-semibold border-2 border-rv-neutral rounded-lg hover:bg-rv-surface transition-colors text-rv-text"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-10 p-6 bg-gradient-to-r from-rv-primary/5 to-rv-accent/5 rounded-rvLg border border-rv-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rv-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-rv-primary">Impersonate User</h2>
          </div>
          <p className="text-rv-textMuted mb-6 text-sm">
            View dashboards exactly as real users see them. Search for a specific user or use test fixtures.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-rv-text mb-2">Search by Email</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter user email..."
                className="flex-1 px-4 py-2.5 border border-rv-neutral rounded-lg focus:outline-none focus:ring-2 focus:ring-rv-primary/30 focus:border-rv-primary"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-5 py-2.5 bg-rv-primary text-white rounded-lg font-semibold text-sm hover:bg-rv-primaryHover transition-colors disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-rv-text mb-3">Search Results</h3>
              <div className="bg-white rounded-lg border border-rv-neutral divide-y divide-rv-neutral">
                {searchResults.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-rv-surface/50">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${planColors[u.effectivePlan] || 'bg-gray-100 text-gray-800'}`}>
                        {planLabels[u.effectivePlan] || u.effectivePlan}
                      </span>
                      <span className="text-sm text-rv-text">{u.email}</span>
                    </div>
                    <button
                      onClick={() => handleImpersonateUser(u.id, u.effectivePlan)}
                      className="px-3 py-1.5 text-xs font-semibold text-rv-primary hover:bg-rv-primary/10 rounded transition-colors"
                    >
                      View Dashboard →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-rv-text mb-3">Quick Access - Test Fixtures</h3>
            {loadingFixtures ? (
              <p className="text-sm text-rv-textMuted">Loading fixtures...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {fixtures.map((fixture) => (
                  <button
                    key={fixture.plan}
                    onClick={() => handleImpersonateFixture(fixture)}
                    disabled={!fixture.exists}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      fixture.exists 
                        ? 'bg-white border-rv-neutral hover:border-rv-primary hover:shadow-sm cursor-pointer' 
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mb-2 ${planColors[fixture.plan] || 'bg-gray-100 text-gray-800'}`}>
                      {planLabels[fixture.plan] || fixture.plan}
                    </span>
                    <p className="text-xs text-rv-textMuted truncate">{fixture.email}</p>
                    {!fixture.exists && (
                      <p className="text-xs text-red-500 mt-1">Not found</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-rv-neutral/50">
            <h3 className="text-sm font-semibold text-rv-text mb-3">Legacy Quick Switch (Role-Based)</h3>
            <p className="text-xs text-rv-textMuted mb-3">
              Preview dashboard UI without real user data. For accurate testing, use user search above.
            </p>
            <div className="flex flex-wrap gap-2">
              {['user', 'artist', 'designer', 'gallery', 'allin'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleLegacyImpersonate(role as any)}
                  className="px-3 py-1.5 text-xs font-medium border border-rv-neutral rounded hover:bg-rv-surface transition-colors"
                >
                  {role === 'allin' ? 'All-In' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">User Management</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View, edit, and manage all platform users.
            </p>
            <button className="px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated">
              Manage Users
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Content Moderation</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Review and approve artwork uploads and content.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Review Content
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Platform Analytics</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View comprehensive stats and usage metrics.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View Analytics
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Role Management</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Assign and modify user roles and permissions.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Manage Roles
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">System Settings</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Configure platform settings and features.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Settings
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Database Management</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Access and manage platform database.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Database Tools
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Reports & Logs</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View system logs and generate reports.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View Logs
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Backup & Security</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Manage backups and security settings.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Security
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Platform Preview</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View the platform as different user roles.
            </p>
            <a href="#/studio" className="inline-block px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Open Studio
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-red-50 rounded-rvLg border border-red-200">
            <h3 className="text-lg font-bold mb-3 text-red-700">Administrator Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Admin (Full Access)</span></p>
              <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-green-600 font-semibold">Verified</span> : <span className="text-amber-600 font-semibold">Pending</span>}</p>
              <p className="text-xs text-red-600 mt-3 font-medium">
                You have full administrative privileges. Use carefully.
              </p>
            </div>
          </div>
          
          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
