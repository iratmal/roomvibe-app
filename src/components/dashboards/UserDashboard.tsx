import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePassword } from '../ChangePassword';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { YourPlanCard } from '../YourPlanCard';

export function UserDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <ImpersonationBanner />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-rv-primary">User Dashboard</h1>
            <p className="text-rv-textMuted">Welcome back, {user?.email}!</p>
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
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Browse Artwork</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Explore our collection of artwork and see how they look in different rooms.
            </p>
            <a
              href="#/studio"
              className="inline-block px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated"
            >
              Open Studio
            </a>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">My Favorites</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              Save your favorite artwork combinations for later.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View Favorites
            </button>
          </div>

          <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
            <h2 className="text-xl font-bold mb-2 text-rv-primary">Recent Visualizations</h2>
            <p className="text-rv-textMuted mb-5 leading-relaxed">
              View your recently created room visualizations.
            </p>
            <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
              View History
            </button>
          </div>
        </div>

        <div className="mt-10">
          <YourPlanCard />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
            <h3 className="text-lg font-bold mb-3 text-rv-primary">Account Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
              <p><span className="font-semibold text-rv-text">Account Type:</span> <span className="text-rv-textMuted">{user?.role}</span></p>
              <p>
                <span className="font-semibold text-rv-text">Email Confirmed:</span>{' '}
                {user?.emailConfirmed ? (
                  <span className="text-green-600 font-semibold">✓ Verified</span>
                ) : (
                  <span className="text-amber-600 font-semibold">⚠ Pending</span>
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
