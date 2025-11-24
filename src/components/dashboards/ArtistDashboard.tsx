import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';
import { ImpersonationBanner } from '../ImpersonationBanner';

export function ArtistDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <ImpersonationBanner />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">Artist Dashboard</h1>
            <p className="text-rv-textMuted">Manage your artwork portfolio</p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 text-sm font-semibold border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors text-rv-text"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Upload Artwork</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Add new pieces to your portfolio with dimensions and pricing.
            </p>
            <button className="px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated">
              Upload New
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">My Artworks</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View and manage all your uploaded artwork pieces.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View Gallery
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Analytics</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              See how your artwork is performing and user engagement.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View Stats
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-purple-50 rounded-rvLg border border-purple-200">
            <h3 className="text-lg font-bold mb-3 text-purple-700">Artist Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Artist</span></p>
              <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-green-600 font-semibold">✓ Verified</span> : <span className="text-amber-600 font-semibold">⚠ Pending</span>}</p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
