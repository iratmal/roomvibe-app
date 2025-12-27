import React from 'react';
import { useAuth } from '../context/AuthContext';

export function ImpersonationBanner() {
  const { 
    impersonatedRole, 
    clearImpersonation, 
    stopImpersonation,
    viewer, 
    impersonatedUserId 
  } = useAuth();

  if (!impersonatedRole && !impersonatedUserId) {
    return null;
  }

  const isBackendImpersonation = !!impersonatedUserId;

  const handleReturnToAdmin = async () => {
    if (isBackendImpersonation) {
      await stopImpersonation();
    } else {
      // Failsafe: Clear sessionStorage directly to ensure synchronous cleanup
      sessionStorage.removeItem('impersonatedRole');
      sessionStorage.removeItem('impersonatedUserId');
      
      // Clear React state
      clearImpersonation();
      
      // Navigate to admin dashboard - use explicit admin route to bypass impersonation checks
      window.location.hash = '#/dashboard/admin';
    }
  };

  const roleLabels: Record<string, string> = {
    user: 'User (Free)',
    artist: 'Artist',
    designer: 'Designer',
    gallery: 'Gallery',
    allin: 'All-In',
    allaccess: 'All-Access',
  };

  const roleColors: Record<string, string> = {
    user: 'bg-blue-50 border-blue-300 text-blue-800',
    artist: 'bg-amber-50 border-amber-300 text-amber-800',
    designer: 'bg-indigo-50 border-indigo-300 text-indigo-800',
    gallery: 'bg-emerald-50 border-emerald-300 text-emerald-800',
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
              {isBackendImpersonation ? 'Viewing as: ' : 'Preview Mode: '}
              <span className="font-extrabold">{roleName} Dashboard</span>
              {viewer && isBackendImpersonation && (
                <span className="font-normal ml-2">({viewer.email})</span>
              )}
            </p>
            <p className="text-xs opacity-75 font-medium">
              {isBackendImpersonation 
                ? 'Admin impersonation mode. Changes here affect the real user\'s data.'
                : `Viewing dashboard as ${roleName.toLowerCase()} plan. Your admin role remains unchanged.`
              }
            </p>
          </div>
        </div>
        <button
          onClick={handleReturnToAdmin}
          className="px-4 py-2.5 bg-white border-2 border-current rounded-lg font-semibold text-sm hover:opacity-80 transition-opacity shadow-sm"
        >
          Return to Admin Mode
        </button>
      </div>
    </div>
  );
}
