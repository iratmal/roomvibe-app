import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isStagingEnvironment } from '../utils/featureFlags';

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function getPlanDisplayName(effectivePlan: string | undefined): string {
  switch (effectivePlan) {
    case 'artist': return 'Artist';
    case 'designer': return 'Designer';
    case 'gallery': return 'Gallery';
    case 'all-access': return 'All-Access';
    case 'free':
    case 'user':
    default:
      return 'Free';
  }
}

function getPlanBadgeColor(effectivePlan: string | undefined): string {
  switch (effectivePlan) {
    case 'artist': return 'bg-purple-100 text-purple-700';
    case 'designer': return 'bg-indigo-100 text-indigo-700';
    case 'gallery': return 'bg-green-100 text-green-700';
    case 'all-access': return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

interface SiteHeaderProps {
  showPlanBadge?: boolean;
}

export function SiteHeader({ showPlanBadge = false }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const effectivePlan = user?.effectivePlan || user?.role || 'free';
  const planName = getPlanDisplayName(effectivePlan);
  const badgeColor = getPlanBadgeColor(effectivePlan);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    window.location.hash = '#/';
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/95 border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 lg:h-[72px] items-center justify-between">
          <a href="#/" className="flex items-center">
            <img 
              src="/roomvibe-logo-transparent.png" 
              alt="RoomVibe" 
              className="h-16 lg:h-[68px] w-auto"
            />
          </a>
          {isStagingEnvironment() && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded uppercase tracking-wide">
              STAGING
            </span>
          )}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-sm font-medium">
            <a href="#how" className="text-[#1A1A1A] hover:text-[#264C61] transition-colors">
              How it works
            </a>
            <a href="#/pricing" className="text-[#1A1A1A] hover:text-[#264C61] transition-colors">
              Pricing
            </a>
            <a href="#/studio" className="text-[#1A1A1A] hover:text-[#264C61] transition-colors">
              Studio
            </a>
            {user ? (
              <>
                <a href="#/dashboard" className="text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                  Dashboard
                </a>
                {showPlanBadge && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>
                    {planName}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="text-[#1A1A1A] hover:text-[#264C61] transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a href="#/login" className="text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                  Login
                </a>
                <a href="#/register" className="btn-primary">
                  Sign Up
                </a>
              </>
            )}
          </nav>
          <button
            aria-label="Open menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#264C61] hover:bg-gray-50 transition-colors"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg absolute left-0 right-0 top-full z-50">
          <div className="mx-auto max-w-7xl px-6 py-6 text-sm">
            <div className="flex flex-col gap-2 font-medium">
              <a onClick={() => setOpen(false)} href="#how" className="py-3 text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                How it works
              </a>
              <a onClick={() => setOpen(false)} href="#/pricing" className="py-3 text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                Pricing
              </a>
              <a onClick={() => setOpen(false)} href="#/studio" className="py-3 text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                Studio
              </a>
              {user ? (
                <>
                  <a onClick={() => setOpen(false)} href="#/dashboard" className="py-3 text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                    Dashboard
                  </a>
                  {showPlanBadge && (
                    <div className="py-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>
                        Plan: {planName}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="py-3 text-left text-[#1A1A1A] hover:text-[#264C61] transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <a onClick={() => setOpen(false)} href="#/login" className="py-3 text-[#1A1A1A] hover:text-[#264C61] transition-colors">
                  Login
                </a>
              )}
            </div>
            {!user && (
              <a
                href="#/register"
                onClick={() => setOpen(false)}
                className="btn-primary mt-4 w-full"
              >
                Sign Up
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
