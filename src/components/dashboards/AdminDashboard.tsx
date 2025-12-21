import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';

export function AdminDashboard() {
  const { user, logout, setImpersonation } = useAuth();

  const handleImpersonate = (role: 'user' | 'artist' | 'designer' | 'gallery' | 'allin') => {
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-rv-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-rv-primary">Dashboard Access (Admin)</h2>
          </div>
          <p className="text-rv-textMuted mb-6 text-sm">
            Quick access to all user dashboards for testing and QA. Your admin role remains unchanged.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <button
              onClick={() => handleImpersonate('user')}
              className="p-5 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-rv-primary mb-1">User Dashboard</h3>
              <p className="text-xs text-rv-textMuted mb-3 leading-relaxed">Free/basic user experience with limited features</p>
              <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                View Dashboard
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => handleImpersonate('artist')}
              className="p-5 bg-white rounded-xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-rv-primary mb-1">Artist Dashboard</h3>
              <p className="text-xs text-rv-textMuted mb-3 leading-relaxed">Artwork management, widgets, visibility settings</p>
              <span className="text-sm font-semibold text-amber-600 group-hover:text-amber-700 flex items-center gap-1">
                View Dashboard
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => handleImpersonate('designer')}
              className="p-5 bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-bold text-rv-primary mb-1">Designer Dashboard</h3>
              <p className="text-xs text-rv-textMuted mb-3 leading-relaxed">Client projects, room uploads, art library</p>
              <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                View Dashboard
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => handleImpersonate('gallery')}
              className="p-5 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <h3 className="font-bold text-rv-primary mb-1">Gallery Dashboard</h3>
              <p className="text-xs text-rv-textMuted mb-3 leading-relaxed">Collections, exhibitions, artist directory</p>
              <span className="text-sm font-semibold text-purple-600 group-hover:text-purple-700 flex items-center gap-1">
                View Dashboard
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => handleImpersonate('allin')}
              className="p-5 bg-white rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-rv-primary mb-1">All-In Dashboard</h3>
              <p className="text-xs text-rv-textMuted mb-3 leading-relaxed">Multi-role user hub with quick links to all roles</p>
              <span className="text-sm font-semibold text-green-600 group-hover:text-green-700 flex items-center gap-1">
                View Dashboard
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
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
            <h3 className="text-lg font-bold mb-3 text-red-700">⚠️ Administrator Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Admin (Full Access)</span></p>
              <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-green-600 font-semibold">✓ Verified</span> : <span className="text-amber-600 font-semibold">⚠ Pending</span>}</p>
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
