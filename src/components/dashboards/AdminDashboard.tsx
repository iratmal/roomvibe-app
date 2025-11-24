import React from 'react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">Full platform administration and management</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-4">🎭 Role Impersonation (View As)</h2>
          <p className="text-slate-600 mb-4 text-sm">
            Test different dashboard views without logging in/out. Your admin role remains unchanged.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleImpersonate('user')}
              className="px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors"
            >
              View as User
            </button>
            <button
              onClick={() => handleImpersonate('artist')}
              className="px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 font-medium transition-colors"
            >
              View as Artist
            </button>
            <button
              onClick={() => handleImpersonate('designer')}
              className="px-4 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
            >
              View as Designer
            </button>
            <button
              onClick={() => handleImpersonate('gallery')}
              className="px-4 py-3 bg-white border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              View as Gallery
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            <p className="text-slate-600 mb-4">
              View, edit, and manage all platform users.
            </p>
            <button className="px-4 py-2 rounded-lg text-white font-medium" style={{ background: 'var(--accent)' }}>
              Manage Users
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Content Moderation</h2>
            <p className="text-slate-600 mb-4">
              Review and approve artwork uploads and content.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Review Content
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Platform Analytics</h2>
            <p className="text-slate-600 mb-4">
              View comprehensive stats and usage metrics.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Analytics
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Role Management</h2>
            <p className="text-slate-600 mb-4">
              Assign and modify user roles and permissions.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Manage Roles
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">System Settings</h2>
            <p className="text-slate-600 mb-4">
              Configure platform settings and features.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Settings
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Database Management</h2>
            <p className="text-slate-600 mb-4">
              Access and manage platform database.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Database Tools
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Reports & Logs</h2>
            <p className="text-slate-600 mb-4">
              View system logs and generate reports.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Logs
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Backup & Security</h2>
            <p className="text-slate-600 mb-4">
              Manage backups and security settings.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Security
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Platform Preview</h2>
            <p className="text-slate-600 mb-4">
              View the platform as different user roles.
            </p>
            <a href="#/studio" className="inline-block px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Open Studio
            </a>
          </div>
        </div>

        <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold mb-2">⚠️ Administrator Account</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Role:</span> Admin (Full Access)</p>
            <p><span className="font-medium">Status:</span> {user?.emailConfirmed ? '✓ Verified' : '⚠ Pending'}</p>
            <p className="text-xs text-red-600 mt-2">
              You have full administrative privileges. Use carefully.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
