import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from './SiteHeader';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface PlanConfig {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  whoItsFor: string;
  features: string[];
  highlightFeature?: string;
  buttonText: string;
  entitlement?: 'artist_access' | 'designer_access' | 'gallery_access';
  isAllAccess?: boolean;
  recommended?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    priceValue: 0,
    whoItsFor: 'People trying RoomVibe for the first time.',
    features: [
      'Upload up to 3 artworks',
      'Up to 10 basic mockup rooms',
      'Upload a photo of your own wall or use basic rooms',
      'See instantly how your artwork looks on a real wall',
      'Download images for preview and sharing',
      'Frame styling controls',
      'Widget embed',
      'Buy button integration',
    ],
    buttonText: 'Get Started Free',
  },
  {
    id: 'artist',
    name: 'Artist',
    price: '€9',
    priceValue: 9,
    whoItsFor: 'Independent artists and creatives who want to present, sell, and exhibit their art online.',
    entitlement: 'artist_access',
    features: [
      'Upload up to 50 artworks',
      'Up to 40 standard mockup rooms',
      'Upload your own wall photos or use realistic interiors',
      'See your artwork instantly on real walls',
      'Create and share your own virtual exhibitions',
      'Download images for your website & social media',
      'Add a Buy button (Shopify, WooCommerce, Wix)',
      'Frame styling controls',
      'Widget embed',
    ],
    highlightFeature: 'Get discovered by interior designers and galleries using RoomVibe',
    buttonText: 'Activate Artist Plan',
  },
  {
    id: 'designer',
    name: 'Designer',
    price: '€29',
    priceValue: 29,
    whoItsFor: 'Interior designers presenting visual concepts to clients.',
    entitlement: 'designer_access',
    features: [
      'Upload up to 100 artworks',
      'Access to 100+ premium mockup rooms',
      'Upload client wall photos or use premium rooms',
      'Create visual concepts and PDF presentations',
      'Designer Studio tools included',
      'Multi-art wall presentations',
      'Unlimited previews',
      'Widget embed',
      'Buy button integration',
    ],
    highlightFeature: 'Find and connect with artists for your interior projects using RoomVibe',
    buttonText: 'Unlock Designer Tools',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    price: '€49',
    priceValue: 49,
    whoItsFor: 'Galleries, exhibition spaces, and artists hosting their own virtual exhibitions.',
    entitlement: 'gallery_access',
    features: [
      'Upload unlimited artworks',
      'Access to 100+ premium mockup rooms',
      'Upload real gallery or studio walls',
      'Create virtual exhibitions (up to 3 active)',
      'Share public exhibition links with collectors and visitors',
      'Exhibition PDF export (20 per month)',
      'Gallery Hub & multi-art walls',
      'Widget embed',
      'Buy button integration',
    ],
    highlightFeature: 'Discover and connect with artists on the RoomVibe platform',
    buttonText: 'Unlock Exhibition Tools',
  },
  {
    id: 'allaccess',
    name: 'All-Access',
    price: '€79',
    priceValue: 79,
    whoItsFor: 'Full-time art professionals, studios, galleries, and power users.',
    isAllAccess: true,
    recommended: true,
    features: [
      'Upload unlimited artworks',
      'Access to all premium mockup rooms (including future packs)',
      'Unlimited walls, exhibitions, and exports',
      'Artist + Designer + Gallery modules included',
      'Unlimited virtual exhibitions',
      'Unlimited PDF exports',
      'Priority support',
      'Early access to new features',
    ],
    buttonText: 'Upgrade to All-Access',
  },
];

function CheckIcon({ className = "w-4 h-4", color }: { className?: string; color?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={color || "currentColor"} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function PricingPage() {
  const { user, hasEntitlement } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const isPlanActive = (plan: PlanConfig): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    
    if (plan.id === 'free') {
      return true;
    }
    
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

    if (plan.id === 'free') {
      if (!user) {
        window.location.hash = '#/register';
      } else {
        window.location.hash = '#/dashboard';
      }
      return;
    }

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
    <div className="min-h-screen bg-gray-50">
      <SiteHeader showPlanBadge={false} />

      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--roomvibe-navy)] tracking-tight mb-4">
              Choose the plan that fits your creative needs
            </h1>
            <p className="text-lg text-rv-textMuted max-w-2xl mx-auto">
              Simple, transparent pricing. Upgrade or cancel anytime.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Horizontal Pricing Cards */}
          <div className="space-y-6">
            {PLANS.map((plan) => (
              <HorizontalPlanCard
                key={plan.id}
                plan={plan}
                isActive={isPlanActive(plan)}
                isLoading={loadingPlan === plan.id}
                onSelect={() => handlePlanClick(plan)}
              />
            ))}
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

      <footer className="py-8 border-t border-rv-neutral bg-white">
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

interface HorizontalPlanCardProps {
  plan: PlanConfig;
  isActive: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

function HorizontalPlanCard({ plan, isActive, isLoading, onSelect }: HorizontalPlanCardProps) {
  return (
    <div
      className={`relative bg-white rounded-xl overflow-hidden ${
        plan.recommended ? 'ring-2 ring-[#C9A24A]' : 'border border-gray-200'
      }`}
      style={{
        boxShadow: plan.recommended 
          ? '0px 8px 24px rgba(201, 162, 74, 0.15)' 
          : '0px 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Recommended Badge */}
      {plan.recommended && (
        <div className="absolute top-0 right-0">
          <span 
            className="inline-block px-4 py-1.5 text-xs font-semibold rounded-bl-lg"
            style={{
              backgroundColor: '#C9A24A',
              color: 'white',
            }}
          >
            RECOMMENDED
          </span>
        </div>
      )}

      <div className="p-6 sm:p-8">
        {/* Top Row: Plan Name, Price, Who it's for, and CTA Button */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6 pb-6 border-b border-gray-100">
          {/* Left: Plan info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-3 mb-2">
              <h3 className="text-2xl font-bold" style={{ color: '#264C61' }}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: '#264C61' }}>
                  {plan.price}
                </span>
                <span className="text-gray-500 text-sm">/ month</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              <span className="font-medium text-[#264C61]">Who it's for:</span> {plan.whoItsFor}
            </p>
          </div>

          {/* Right: CTA Button */}
          <div className="flex-shrink-0 lg:min-w-[200px]">
            {isActive && plan.id !== 'free' ? (
              <div 
                className="py-3 px-6 rounded-lg text-sm text-center flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#E8EBF7',
                  color: '#264C61',
                  fontWeight: 600,
                }}
              >
                <CheckIcon className="w-5 h-5" color="#264C61" />
                {plan.isAllAccess ? 'All Modules Active' : 'Active'}
              </div>
            ) : (
              <button
                onClick={onSelect}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all ${
                  plan.id === 'free'
                    ? 'bg-white border-2 border-[#264C61] text-[#264C61] hover:bg-gray-50'
                    : plan.recommended 
                      ? 'bg-[#C9A24A] text-white hover:bg-[#b8933f] shadow-md'
                      : 'bg-[#264C61] text-white hover:bg-[#1d3a4a]'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Loading...' : plan.buttonText}
              </button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <p className="text-sm font-semibold text-[#264C61] mb-4">What you get:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-2">
            {plan.features.map((feature, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2"
              >
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight Feature */}
        {plan.highlightFeature && (
          <div 
            className="mt-5 p-4 rounded-lg flex items-start gap-3"
            style={{ 
              backgroundColor: 'rgba(201, 162, 74, 0.08)',
              border: '1px solid rgba(201, 162, 74, 0.2)'
            }}
          >
            <StarIcon className="w-5 h-5 flex-shrink-0 text-[#C9A24A]" />
            <p className="text-sm font-medium text-[#264C61]">
              {plan.highlightFeature}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingPage;
