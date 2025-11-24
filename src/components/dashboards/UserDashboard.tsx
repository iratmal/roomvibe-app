import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';

export function UserDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">User Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.email}!</p>
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
            <h2 className="text-xl font-semibold mb-2">Browse Artwork</h2>
            <p className="text-slate-600 mb-4">
              Explore our collection of artwork and see how they look in different rooms.
            </p>
            <a
              href="#/studio"
              className="inline-block px-4 py-2 rounded-lg text-white font-medium"
              style={{ background: 'var(--accent)' }}
            >
              Open Studio
            </a>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">My Favorites</h2>
            <p className="text-slate-600 mb-4">
              Save your favorite artwork combinations for later.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View Favorites
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Recent Visualizations</h2>
            <p className="text-slate-600 mb-4">
              View your recently created room visualizations.
            </p>
            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              View History
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2">Account Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Account Type:</span> {user?.role}</p>
              <p>
                <span className="font-medium">Email Confirmed:</span>{' '}
                {user?.emailConfirmed ? (
                  <span className="text-green-600">✓ Verified</span>
                ) : (
                  <span className="text-amber-600">⚠ Pending</span>
                )}
              </p>
            </div>
          </div>

          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
