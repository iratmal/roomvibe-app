import React from 'react';
import { useAuth } from '../context/AuthContext';

export function ImpersonationBanner() {
  const { user, impersonatedRole, clearImpersonation } = useAuth();

  if (!impersonatedRole || user?.role !== 'admin') {
    return null;
  }

  const handleReturnToAdmin = () => {
    clearImpersonation();
    window.location.hash = '#/dashboard';
  };

  const roleLabels = {
    user: 'User',
    artist: 'Artist',
    designer: 'Designer',
    gallery: 'Gallery',
  };

  const roleColors = {
    user: 'bg-blue-100 border-blue-300 text-blue-800',
    artist: 'bg-purple-100 border-purple-300 text-purple-800',
    designer: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    gallery: 'bg-green-100 border-green-300 text-green-800',
  };

  const roleName = roleLabels[impersonatedRole as keyof typeof roleLabels] || impersonatedRole;
  const colorClass = roleColors[impersonatedRole as keyof typeof roleColors] || 'bg-gray-100 border-gray-300 text-gray-800';

  return (
    <div className={`sticky top-0 z-50 border-b-2 ${colorClass} px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎭</span>
          <div>
            <p className="font-semibold text-sm">
              You are viewing as: <span className="font-bold">{roleName}</span> (Admin Impersonation)
            </p>
            <p className="text-xs opacity-80">
              Your actual role is Admin. This is a preview mode only.
            </p>
          </div>
        </div>
        <button
          onClick={handleReturnToAdmin}
          className="px-4 py-2 bg-white border-2 border-current rounded-lg font-medium text-sm hover:opacity-80 transition-opacity"
        >
          Return to Admin Mode
        </button>
      </div>
    </div>
  );
}
