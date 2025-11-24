import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';
import { ImpersonationBanner } from '../ImpersonationBanner';

export function DesignerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <ImpersonationBanner />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">Designer Dashboard</h1>
            <p className="text-rv-textMuted">Create and manage custom room designs</p>
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
            <h2 className="text-xl font-bold mb-2 text-rv-primary">My Projects</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View and edit your ongoing and completed design projects.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View Projects
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Upload Project</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Start a new room design project with custom layouts.
            </p>
            <button className="px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated">
              New Project
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">PDF/Moodboard Export</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Export high-resolution renders and moodboards of your designs.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              Export Tools
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-indigo-50 rounded-rvLg border border-indigo-200">
            <h3 className="text-lg font-bold mb-3 text-indigo-700">Designer Account</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Role:</span> <span className="text-rv-textMuted">Designer</span></p>
              <p><span className="font-semibold text-rv-text">Status:</span> {user?.emailConfirmed ? <span className="text-green-600 font-semibold">✓ Verified</span> : <span className="text-amber-600 font-semibold">⚠ Pending</span>}</p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
