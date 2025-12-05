import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rv-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-slate-600 mb-4">Please log in to access this page.</p>
          <a
            href="#/login"
            className="inline-block px-6 py-2 rounded-lg text-white font-medium"
            style={{ background: 'var(--accent)' }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Your role: <span className="font-medium">{user.role}</span>
          </p>
          <a
            href="#/dashboard"
            className="inline-block px-6 py-2 rounded-lg text-white font-medium"
            style={{ background: 'var(--accent)' }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
