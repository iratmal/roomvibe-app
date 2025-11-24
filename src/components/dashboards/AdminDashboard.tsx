import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';

export function AdminDashboard() {
  const { user, logout, setImpersonation } = useAuth();

  const handleImpersonate = (role: 'user' | 'artist' | 'designer' | 'gallery') => {
    setImpersonation(role);
    const routes = {
      user: '#/dashboard',
      artist: '#/dashboard/artist',
      designer: '#/dashboard/designer',
      gallery: '#/dashboard/gallery',
    };
    window.location.hash = routes[role];
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">Admin Dashboard</h1>
            <p className="text-rv-textMuted">Full platform administration and management</p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 text-sm font-semibold border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors text-rv-text"
          >
            Logout
          </button>
        </div>

        <div className="mb-10 p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
          <h2 className="text-xl font-bold mb-4 text-rv-primary">🎭 Role Impersonation (View As)</h2>
          <p className="text-rv-textMuted mb-5 text-sm">
            Test different dashboard views without logging in/out. Your admin role remains unchanged.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleImpersonate('user')}
              className="px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-rvMd hover:bg-blue-50 font-semibold transition-colors"
            >
              View as User
            </button>
            <button
              onClick={() => handleImpersonate('artist')}
              className="px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-rvMd hover:bg-purple-50 font-semibold transition-colors"
            >
              View as Artist
            </button>
            <button
              onClick={() => handleImpersonate('designer')}
              className="px-4 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-rvMd hover:bg-indigo-50 font-semibold transition-colors"
            >
              View as Designer
            </button>
            <button
              onClick={() => handleImpersonate('gallery')}
              className="px-4 py-3 bg-white border-2 border-green-300 text-green-700 rounded-rvMd hover:bg-green-50 font-semibold transition-colors"
            >
              View as Gallery
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
