import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface SubscriptionInfo {
  subscription_status: string;
  subscription_plan: string;
  has_stripe_customer: boolean;
  has_active_subscription: boolean;
}

interface ModuleConfig {
  id: 'artist' | 'designer' | 'gallery';
  name: string;
  entitlement: 'artist_access' | 'designer_access' | 'gallery_access';
  price: string;
  features: string[];
}

const MODULES: ModuleConfig[] = [
  {
    id: 'artist',
    name: 'Artist Module',
    entitlement: 'artist_access',
    price: '€9/mo',
    features: [
      'Upload up to 50 artworks',
      'Access all premium mockup rooms',
      'High-resolution exports & PDFs',
      'Embed "View in Your Room" widget',
    ],
  },
  {
    id: 'designer',
    name: 'Designer Module',
    entitlement: 'designer_access',
    price: '€29/mo',
    features: [
      'Unlimited artwork and mockups',
      'Client folders & project organization',
      'Professional PDF proposals',
      'Upload client room photos',
    ],
  },
  {
    id: 'gallery',
    name: 'Gallery Module',
    entitlement: 'gallery_access',
    price: '€49/mo',
    features: [
      'Multi-artist collections',
      'Up to 500 artworks',
      'Virtual exhibitions',
      'White-label presentations',
    ],
  },
];

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

export function BillingPage() {
  const { user, hasEntitlement } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`${API_URL}/api/billing/subscription`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/billing/customer-portal`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open billing portal');
      }
    } catch (err) {
      setError('Failed to connect to billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setError('');
    setCheckoutLoading(planId);
    try {
      const response = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planId }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError('Failed to connect to checkout service');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const activeModules = MODULES.filter(m => isAdmin || hasEntitlement(m.entitlement));
  const lockedModules = MODULES.filter(m => !isAdmin && !hasEntitlement(m.entitlement));

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-rv-neutral">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <a href="#/" className="flex items-center">
                <img src="/roomvibe-logo-transparent.png" alt="RoomVibe" className="h-16 w-auto" />
              </a>
              <a href="#/dashboard" className="text-sm font-medium text-rv-text hover:text-rv-primary transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-rv-neutral">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <a href="#/" className="flex items-center">
              <img src="/roomvibe-logo-transparent.png" alt="RoomVibe" className="h-16 w-auto" />
            </a>
            <a href="#/dashboard" className="text-sm font-medium text-rv-text hover:text-rv-primary transition-colors">
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--roomvibe-navy)] mb-2">Billing & Subscriptions</h1>
          <p className="text-rv-textMuted">Manage your active modules and subscriptions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* SECTION 1: Active Modules */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-rv-text mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            Your Active Modules
          </h2>
          
          {activeModules.length > 0 ? (
            <div className="space-y-3">
              {activeModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-md"
                  style={{
                    backgroundColor: '#E8EBF7',
                    borderLeft: '4px solid #264C61',
                  }}
                >
                  <CheckCircleIcon className="w-5 h-5 text-[#264C61] flex-shrink-0" />
                  <span className="font-medium text-[#264C61]">{module.name}</span>
                  <span className="ml-auto text-sm text-[#264C61] font-medium px-2 py-0.5 bg-white/60 rounded">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
              You don't have any active modules yet. Upgrade below to unlock premium features.
            </div>
          )}
        </section>

        {/* SECTION 2: Available Plans to Unlock */}
        {lockedModules.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-rv-text mb-4 flex items-center gap-2">
              <LockIcon className="w-5 h-5 text-[#C9A24A]" />
              Unlock More Tools
            </h2>
            
            <div className="space-y-4">
              {lockedModules.map((module) => (
                <div
                  key={module.id}
                  className="p-4 sm:p-5 bg-white rounded-lg"
                  style={{ 
                    border: '1.5px solid #C9A24A',
                    boxShadow: '0px 2px 6px rgba(0,0,0,0.05)' 
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <LockIcon className="w-5 h-5 text-[#C9A24A]" />
                        <h3 className="font-bold text-rv-text">{module.name}</h3>
                        <span className="text-sm font-medium text-[#264C61]">{module.price}</span>
                      </div>
                      <ul className="space-y-2 ml-0 sm:ml-8">
                        {module.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: '#4A5A7F', lineHeight: '1.45' }}
                          >
                            <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgrade(module.id)}
                      disabled={checkoutLoading === module.id}
                      className="btn-outline-gold text-sm py-2.5 px-4 w-full sm:w-auto disabled:opacity-50"
                    >
                      {checkoutLoading === module.id ? (
                        'Loading...'
                      ) : (
                        <>
                          Unlock
                          <ArrowRightIcon className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: Billing Management */}
        <section className="pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-rv-text mb-4">Billing Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleManageBilling}
              disabled={actionLoading}
              className="btn-primary text-sm py-2.5 px-4 disabled:opacity-50"
            >
              {actionLoading ? (
                'Loading...'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Manage Billing
                </>
              )}
            </button>
            
            <a
              href="#/pricing"
              className="btn-outline text-sm py-2.5 px-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View All Plans
            </a>
          </div>
          
          <p className="mt-4 text-xs text-rv-textMuted">
            Use "Manage Billing" to update payment methods, view invoices, or cancel subscriptions.
          </p>
        </section>
      </main>
    </div>
  );
}

export default BillingPage;
