import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';

export function ArtistDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Artist Dashboard</h1>
            <p className="text-slate-600">Manage your artwork portfolio</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Upload Artwork</h2>
            <p className="text-slate-600 mb-4">
              Add new pieces to your portfolio with dimensions and pricing.
            </p>
            <button className="px-4 py-2 rounded-lg text-white font-medium" style={{ background: 'var(--accent)' }}>
              Upload New
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">My Artworks</h2>
            <p className="text-slate-600 mb-4">
              View and manage all your uploaded artwork pieces.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Gallery
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-slate-600 mb-4">
              See how your artwork is performing and user engagement.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Stats
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold mb-2">Artist Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Role:</span> Artist</p>
              <p><span className="font-medium">Status:</span> {user?.emailConfirmed ? '✓ Verified' : '⚠ Pending'}</p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
