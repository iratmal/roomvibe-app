import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function DesignerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Designer Dashboard</h1>
            <p className="text-slate-600">Create and manage custom room designs</p>
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
            <h2 className="text-xl font-semibold mb-2">Create New Design</h2>
            <p className="text-slate-600 mb-4">
              Start a new room design project with custom layouts.
            </p>
            <button className="px-4 py-2 rounded-lg text-white font-medium" style={{ background: 'var(--accent)' }}>
              New Project
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">My Projects</h2>
            <p className="text-slate-600 mb-4">
              View and edit your ongoing and completed design projects.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Projects
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Client Collaborations</h2>
            <p className="text-slate-600 mb-4">
              Share designs with clients and get feedback.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Clients
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Design Library</h2>
            <p className="text-slate-600 mb-4">
              Access templates and saved room configurations.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Browse Library
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Design Studio</h2>
            <p className="text-slate-600 mb-4">
              Use the visualization tool to create room mockups.
            </p>
            <a href="#/studio" className="inline-block px-4 py-2 rounded-lg text-white font-medium" style={{ background: 'var(--accent)' }}>
              Open Studio
            </a>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Export & Share</h2>
            <p className="text-slate-600 mb-4">
              Export high-resolution renders of your designs.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Export Tools
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold mb-2">Designer Account</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Role:</span> Designer</p>
            <p><span className="font-medium">Status:</span> {user?.emailConfirmed ? '✓ Verified' : '⚠ Pending'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
