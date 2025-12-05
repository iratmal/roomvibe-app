import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface PlanConfig {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  subtitle: string;
  features: string[];
  buttonText: string;
  entitlement?: 'artist_access' | 'designer_access' | 'gallery_access';
  isAllAccess?: boolean;
  recommended?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: 'artist',
    name: 'Artist',
    price: '€9',
    priceValue: 9,
    subtitle: 'For artists who want professional mockups of their art.',
    entitlement: 'artist_access',
    features: [
      'Upload up to 50 artworks',
      'Standard mockup rooms',
      'Basic download export',
      'Frame styling controls',
      'Widget embed for your website',
      'Buy button integration (Shopify, WooCommerce, Wix)',
    ],
    buttonText: 'Activate Artist Plan',
  },
  {
    id: 'designer',
    name: 'Designer',
    price: '€29',
    priceValue: 29,
    subtitle: 'For interior designers presenting concepts to clients.',
    entitlement: 'designer_access',
    features: [
      'All Artist features +',
      'Premium mockup rooms',
      'High-resolution export (3000px+)',
      'PDF export',
      'Designer Studio tools',
      'Mockup downloads',
      'Unlimited previews',
    ],
    buttonText: 'Unlock Designer Tools',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    price: '€49',
    priceValue: 49,
    subtitle: 'For galleries managing collections and exhibitions.',
    entitlement: 'gallery_access',
    features: [
      'Multi-art wall presentations',
      'Virtual exhibition rooms',
      'Gallery Hub',
      'Exhibition PDF export',
      'Public exhibition share links',
    ],
    buttonText: 'Unlock Gallery Tools',
  },
  {
    id: 'allaccess',
    name: 'All-Access',
    price: '€79',
    priceValue: 79,
    subtitle: 'Best value for full-time professionals.',
    isAllAccess: true,
    recommended: true,
    features: [
      'Artist Module included',
      'Designer Module included',
      'Gallery Module included',
      'All premium features',
      'Priority support',
      'Best price for full access',
    ],
    buttonText: 'Upgrade to All-Access',
  },
];

const COMPARISON_FEATURES = [
  { name: 'Artwork upload limit', artist: '50', designer: 'Unlimited', gallery: '500', allaccess: 'Unlimited' },
  { name: 'Premium rooms', artist: false, designer: true, gallery: true, allaccess: true },
  { name: 'High-resolution export', artist: false, designer: true, gallery: true, allaccess: true },
  { name: 'PDF export', artist: false, designer: true, gallery: true, allaccess: true },
  { name: 'Virtual exhibitions', artist: false, designer: false, gallery: true, allaccess: true },
  { name: 'Widget embed', artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Buy button integration', artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Public gallery pages', artist: false, designer: false, gallery: true, allaccess: true },
];

function CheckCircleIcon({ className = "w-5 h-5", color }: { className?: string; color?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color || "currentColor"} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function PricingPage() {
  const { user, hasEntitlement } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const isPlanActive = (plan: PlanConfig): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    
    if (plan.isAllAccess) {
      return hasEntitlement('artist_access') && 
             hasEntitlement('designer_access') && 
             hasEntitlement('gallery_access');
    }
    
    if (plan.entitlement) {
      return hasEntitlement(plan.entitlement);
    }
    
    return false;
  };

  const handlePlanClick = async (plan: PlanConfig) => {
    setError('');

    if (!user) {
      sessionStorage.setItem('returnToPricing', 'true');
      window.location.hash = '#/login';
      return;
    }

    if (isPlanActive(plan)) {
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const response = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: plan.id }),
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
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-rv-neutral">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <a href="#/" className="flex items-center">
              <img 
                src="/roomvibe-logo-transparent.png" 
                alt="RoomVibe" 
                className="h-16 w-auto"
              />
            </a>
            <div className="flex items-center gap-4">
              {user ? (
                <a href="#/dashboard" className="text-sm font-medium text-rv-text hover:text-rv-primary transition-colors">
                  Dashboard
                </a>
              ) : (
                <>
                  <a href="#/login" className="text-sm font-medium text-rv-text hover:text-rv-primary transition-colors">
                    Login
                  </a>
                  <a href="#/register" className="btn-primary text-sm py-2 px-4">
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--roomvibe-navy)] tracking-tight mb-4">
              Modular Plans for Every Creative
            </h1>
            <p className="text-lg text-rv-textMuted max-w-2xl mx-auto">
              Stack plans to match your needs. Upgrade anytime, cancel anytime.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isActive={isPlanActive(plan)}
                isLoading={loadingPlan === plan.id}
                onSelect={() => handlePlanClick(plan)}
              />
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-[var(--roomvibe-navy)] text-center mb-8">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-rv-neutral">
                    <th className="text-left py-4 px-4 font-semibold text-rv-text">Feature</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#264C61]">Artist</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#264C61]">Designer</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#264C61]">Gallery</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#C9A24A]">All-Access</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature, idx) => (
                    <tr key={idx} className="border-b border-rv-neutral/50">
                      <td className="py-3 px-4 text-sm text-rv-text">{feature.name}</td>
                      <td className="py-3 px-3 text-center">
                        <ComparisonCell value={feature.artist} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <ComparisonCell value={feature.designer} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <ComparisonCell value={feature.gallery} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <ComparisonCell value={feature.allaccess} isHighlighted />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-rv-textMuted">
              All plans include a 14-day money-back guarantee. Cancel anytime.
            </p>
            <p className="text-sm text-rv-textMuted mt-2">
              Need help choosing?{' '}
              <a href="mailto:hello@roomvibe.app" className="text-rv-primary hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-rv-neutral">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-rv-textMuted">
            <p>&copy; 2025 RoomVibe. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#/privacy" className="hover:text-rv-primary transition-colors">Privacy</a>
              <a href="#/terms" className="hover:text-rv-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface PlanCardProps {
  plan: PlanConfig;
  isActive: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, isActive, isLoading, onSelect }: PlanCardProps) {
  return (
    <div
      className="relative flex flex-col bg-white"
      style={{
        border: plan.recommended ? '1.5px solid #C9A24A' : '1.5px solid #DDE1E7',
        borderRadius: '12px',
        padding: '26px',
        boxShadow: plan.recommended 
          ? '0px 6px 16px rgba(201, 162, 74, 0.15)' 
          : '0px 4px 10px rgba(0,0,0,0.04)',
      }}
    >
      {/* Recommended Badge */}
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span 
            className="px-3 py-1 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: '#C9A24A',
              color: 'white',
            }}
          >
            RECOMMENDED
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 
          className="text-xl font-semibold"
          style={{ color: '#264C61' }}
        >
          {plan.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: '#264C61' }}>
            {plan.price}
          </span>
          <span className="text-rv-textMuted text-sm">/ month</span>
        </div>
        <p className="mt-2 text-sm text-rv-textMuted">{plan.subtitle}</p>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {plan.features.map((feature, i) => (
          <li 
            key={i} 
            className="flex items-start gap-2"
            style={{ fontSize: '15px', color: '#4A5A7F', lineHeight: '1.5' }}
          >
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Active Badge */}
      {isActive && (
        <div 
          className="mb-4 py-2 px-3 rounded-lg text-sm text-center flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#E8EBF7',
            color: '#264C61',
            fontWeight: 600,
          }}
        >
          <CheckCircleIcon className="w-4 h-4" color="#264C61" />
          {plan.isAllAccess ? 'Active – All Modules Unlocked' : 'Active'}
        </div>
      )}

      {/* Button */}
      <button
        onClick={onSelect}
        disabled={isActive || isLoading}
        className={`w-full ${
          isActive 
            ? 'py-3 px-4 rounded-lg font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed' 
            : plan.recommended 
              ? 'btn-premium text-sm' 
              : 'btn-primary text-sm'
        } disabled:opacity-50`}
      >
        {isLoading ? 'Loading...' : (isActive ? 'Already Active' : plan.buttonText)}
      </button>
    </div>
  );
}

function ComparisonCell({ value, isHighlighted }: { value: boolean | string; isHighlighted?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span 
        className="text-sm font-medium"
        style={{ color: isHighlighted ? '#C9A24A' : '#264C61' }}
      >
        {value}
      </span>
    );
  }
  
  if (value) {
    return (
      <CheckCircleIcon 
        className="w-5 h-5 mx-auto" 
        color={isHighlighted ? '#C9A24A' : '#22c55e'}
      />
    );
  }
  
  return <span className="text-gray-400">—</span>;
}

export default PricingPage;
