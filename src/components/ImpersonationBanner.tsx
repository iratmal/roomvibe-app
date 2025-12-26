import React from 'react';
import { useAuth, useViewer } from '../context/AuthContext';

export function ImpersonationBanner() {
  const { user, impersonatedRole, stopImpersonation, isImpersonating, viewer } = useAuth();

  if ((!impersonatedRole && !isImpersonating) || user?.role !== 'admin') {
    return null;
  }

  const handleReturnToAdmin = () => {
    stopImpersonation();
  };

  const roleLabels: Record<string, string> = {
    user: 'Free User',
    artist: 'Artist',
    designer: 'Designer',
    gallery: 'Gallery',
    allin: 'All-Access',
    allaccess: 'All-Access',
  };

  const roleColors: Record<string, string> = {
    user: 'bg-blue-50 border-blue-300 text-blue-800',
    artist: 'bg-amber-50 border-amber-300 text-amber-800',
    designer: 'bg-indigo-50 border-indigo-300 text-indigo-800',
    gallery: 'bg-purple-50 border-purple-300 text-purple-800',
    allin: 'bg-green-50 border-green-300 text-green-800',
    allaccess: 'bg-green-50 border-green-300 text-green-800',
  };

  const displayPlan = viewer?.effectivePlan || impersonatedRole || 'user';
  const roleName = roleLabels[displayPlan] || displayPlan;
  const colorClass = roleColors[displayPlan] || 'bg-gray-50 border-gray-300 text-gray-800';

  return (
    <div className={`sticky top-0 z-50 border-b-2 ${colorClass} px-4 py-3.5`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎭</span>
          <div>
            <p className="font-bold text-sm">
              Viewing as: <span className="font-extrabold">{roleName}</span>
              {viewer && (
                <span className="font-normal ml-2">({viewer.email})</span>
              )}
            </p>
            <p className="text-xs opacity-75 font-medium">
              Admin impersonation mode. Changes here affect the real user's data.
            </p>
          </div>
        </div>
        <button
          onClick={handleReturnToAdmin}
          className="px-4 py-2.5 bg-white border-2 border-current rounded-lg font-semibold text-sm hover:opacity-80 transition-opacity shadow-sm"
        >
          Return to Admin
        </button>
      </div>
    </div>
  );
}
