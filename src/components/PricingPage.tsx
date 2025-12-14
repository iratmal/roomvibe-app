import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from './SiteHeader';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface PlanConfig {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  valuePromise: string;
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
    valuePromise: 'See instantly how your artwork looks on a real wall.',
    whoItsFor: 'People trying RoomVibe for the first time.',
    features: [
      'Upload up to 3 artworks',
      '10 basic mockup rooms',
      'Upload your own wall photo or use basic rooms',
      'See instantly how your artwork looks on a wall',
      'Download images for preview and sharing',
    ],
    buttonText: 'Get Started Free',
  },
  {
    id: 'artist',
    name: 'Artist',
    price: '€9',
    priceValue: 9,
    valuePromise: 'Present, share, and sell your art online – without technical hassle.',
    whoItsFor: 'Independent artists and creatives.',
    entitlement: 'artist_access',
    features: [
      'Upload up to 50 artworks',
      'Up to 40 standard mockup rooms',
      'Upload your own walls or use realistic interiors',
      'Create 1 active virtual exhibition',
      'Download images for website & social media',
    ],
    highlightFeature: 'Get discovered by interior designers and galleries using RoomVibe',
    buttonText: 'Activate Artist Plan',
  },
  {
    id: 'designer',
    name: 'Designer',
    price: '€29',
    priceValue: 29,
    valuePromise: 'Create clear visual concepts for clients using real artworks.',
    whoItsFor: 'Interior designers working with clients.',
    entitlement: 'designer_access',
    features: [
      'Upload up to 100 artworks',
      '100+ premium mockup rooms',
      'Upload client wall photos or use premium rooms',
      'Create visual concepts and PDF presentations',
      'Unlimited previews while designing',
    ],
    highlightFeature: 'Find and connect with artists for your interior projects using RoomVibe',
    buttonText: 'Unlock Designer Tools',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    price: '€49',
    priceValue: 49,
    valuePromise: 'Host professional virtual exhibitions and share them with the world.',
    whoItsFor: 'Galleries, exhibition spaces, and artists hosting their own exhibitions.',
    entitlement: 'gallery_access',
    features: [
      'Upload unlimited artworks',
      '100+ premium mockup rooms',
      'Upload real gallery or studio walls',
      'Create up to 3 active virtual exhibitions',
      'Share public exhibition links with visitors & collectors',
    ],
    highlightFeature: 'Discover and work with artists through the RoomVibe platform',
    buttonText: 'Unlock Exhibition Tools',
  },
  {
    id: 'allaccess',
    name: 'All-Access',
    price: '€79',
    priceValue: 79,
    valuePromise: 'Everything RoomVibe offers – without limits.',
    whoItsFor: 'Full-time professionals, studios, galleries, and power users.',
    isAllAccess: true,
    recommended: true,
    features: [
      'Unlimited artworks, walls, exhibitions & exports',
      'Full Artist + Designer + Gallery tools',
      'Unlimited virtual exhibitions',
      'Priority support',
      'Early access to new features',
    ],
    buttonText: 'Upgrade to All-Access',
  },
];

function NavyCheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="#264C61" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function GoldXIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

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
            <h1 className="text-3xl sm:text-4xl font-bold text-[#264C61] tracking-tight mb-4">
              Visualize Your Art on Any Wall. Choose the Plan That Fits You
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, transparent pricing for artists, designers, and galleries. Upgrade or cancel anytime.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {/* TABLE 1: Plans Overview */}
          <div className="space-y-6 mb-20">
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

          {/* TABLE 2: Feature Comparison */}
          <div>
            <h2 className="text-2xl font-bold text-[#0B1F2A] text-center mb-8">
              Compare All Features
            </h2>
            <FeatureComparisonTable />
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              All plans include a 14-day money-back guarantee. Cancel anytime.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Need help choosing?{' '}
              <a href="mailto:hello@roomvibe.app" className="text-[#0B1F2A] hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; 2025 RoomVibe. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#/privacy" className="hover:text-[#0B1F2A] transition-colors">Privacy</a>
              <a href="#/terms" className="hover:text-[#0B1F2A] transition-colors">Terms</a>
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
        plan.recommended ? 'ring-2 ring-[#C9A24D]' : 'border border-gray-200'
      }`}
      style={{
        boxShadow: plan.recommended 
          ? '0px 8px 24px rgba(201, 162, 77, 0.15)' 
          : '0px 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Recommended Badge */}
      {plan.recommended && (
        <div className="absolute top-0 right-0">
          <span 
            className="inline-block px-4 py-1.5 text-xs font-semibold rounded-bl-lg"
            style={{ backgroundColor: '#C9A24D', color: 'white' }}
          >
            RECOMMENDED
          </span>
        </div>
      )}

      <div className="p-6 sm:p-8">
        {/* 4-Column Layout: Plan Name + Price | Value Promise + Who it's for | What you get | CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Column 1: Plan Name + Price */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-[#264C61] mb-1">
              {plan.name}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#264C61]">{plan.price}</span>
              <span className="text-gray-500 text-sm">/ month</span>
            </div>
          </div>

          {/* Column 2: Value Promise + Who it's for */}
          <div className="lg:col-span-3">
            <p className="font-semibold text-[#264C61] mb-2">
              {plan.valuePromise}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-500">Who it's for:</span> {plan.whoItsFor}
            </p>
          </div>

          {/* Column 3: What you get */}
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold text-gray-500 mb-3">What you get:</p>
            <div className="space-y-1.5">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <NavyCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            
            {/* Highlight Feature */}
            {plan.highlightFeature && (
              <div 
                className="mt-4 p-3 rounded-lg flex items-start gap-2"
                style={{ 
                  backgroundColor: 'rgba(201, 162, 77, 0.08)',
                  border: '1px solid rgba(201, 162, 77, 0.2)'
                }}
              >
                <StarIcon className="w-4 h-4 flex-shrink-0 text-[#C9A24D] mt-0.5" />
                <p className="text-sm font-medium text-[#264C61]">
                  {plan.highlightFeature}
                </p>
              </div>
            )}
          </div>

          {/* Column 4: CTA Button */}
          <div className="lg:col-span-2 flex items-center">
            {isActive && plan.id !== 'free' ? (
              <div 
                className="w-full py-3 px-4 rounded-lg text-sm text-center flex items-center justify-center gap-2"
                style={{ backgroundColor: '#E8EBF7', color: '#264C61', fontWeight: 600 }}
              >
                <CheckIcon className="w-5 h-5" color="#264C61" />
                {plan.isAllAccess ? 'All Modules Active' : 'Active'}
              </div>
            ) : (
              <button
                onClick={onSelect}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                  plan.id === 'free'
                    ? 'bg-white border-2 border-[#264C61] text-[#264C61] hover:bg-gray-50'
                    : plan.recommended 
                      ? 'bg-[#C9A24D] text-white hover:bg-[#b8933d] shadow-md'
                      : 'bg-[#264C61] text-white hover:bg-[#1d3a4a]'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Loading...' : plan.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureRow {
  feature: string;
  free: string | boolean;
  artist: string | boolean;
  designer: string | boolean;
  gallery: string | boolean;
  allAccess: string | boolean;
}

const FEATURE_ROWS: FeatureRow[] = [
  { feature: 'Artwork uploads', free: '3', artist: '50', designer: '100', gallery: 'Unlimited', allAccess: 'Unlimited' },
  { feature: 'Mockup rooms', free: '10 basic', artist: '40 standard', designer: '100+ premium', gallery: '100+ premium', allAccess: 'All rooms' },
  { feature: 'Upload own wall photos', free: true, artist: true, designer: true, gallery: true, allAccess: true },
  { feature: 'Real-scale preview', free: true, artist: true, designer: true, gallery: true, allAccess: true },
  { feature: 'Frame styling controls', free: true, artist: true, designer: true, gallery: true, allAccess: true },
  { feature: 'Image downloads', free: true, artist: true, designer: true, gallery: true, allAccess: true },
  { feature: 'PDF exports', free: false, artist: false, designer: true, gallery: true, allAccess: true },
  { feature: 'Widget embed', free: false, artist: true, designer: true, gallery: true, allAccess: true },
  { feature: 'Buy button integration', free: false, artist: true, designer: true, gallery: true, allAccess: true },
  { feature: 'Virtual exhibitions', free: false, artist: '1 active', designer: false, gallery: '3 active', allAccess: 'Unlimited' },
  { feature: 'Public exhibition links', free: false, artist: true, designer: false, gallery: true, allAccess: true },
  { feature: 'Designer Studio tools', free: false, artist: false, designer: true, gallery: false, allAccess: true },
  { feature: 'Multi-art wall presentations', free: false, artist: false, designer: true, gallery: true, allAccess: true },
  { feature: 'Gallery Hub', free: false, artist: false, designer: false, gallery: true, allAccess: true },
  { feature: 'Connect with designers', free: false, artist: true, designer: false, gallery: false, allAccess: true },
  { feature: 'Connect with galleries', free: false, artist: true, designer: false, gallery: false, allAccess: true },
  { feature: 'Browse artist directory', free: false, artist: false, designer: true, gallery: true, allAccess: true },
  { feature: 'Priority support', free: false, artist: false, designer: false, gallery: false, allAccess: true },
  { feature: 'Early access to features', free: false, artist: false, designer: false, gallery: false, allAccess: true },
];

function FeatureComparisonTable() {
  const renderCell = (value: string | boolean) => {
    if (value === true) {
      return <NavyCheckIcon className="w-5 h-5 mx-auto" />;
    }
    if (value === false) {
      return <GoldXIcon className="w-5 h-5 mx-auto" />;
    }
    return <span className="text-sm text-gray-700 font-medium">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' }}>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-4 px-4 sm:px-6 font-semibold text-[#0B1F2A] text-sm min-w-[200px]">Feature</th>
            <th className="text-center py-4 px-2 sm:px-4 font-semibold text-[#0B1F2A] text-sm min-w-[80px]">Free</th>
            <th className="text-center py-4 px-2 sm:px-4 font-semibold text-[#0B1F2A] text-sm min-w-[80px]">Artist</th>
            <th className="text-center py-4 px-2 sm:px-4 font-semibold text-[#0B1F2A] text-sm min-w-[80px]">Designer</th>
            <th className="text-center py-4 px-2 sm:px-4 font-semibold text-[#0B1F2A] text-sm min-w-[80px]">Gallery</th>
            <th className="text-center py-4 px-2 sm:px-4 font-semibold text-sm min-w-[100px]" style={{ backgroundColor: 'rgba(201, 162, 77, 0.1)', color: '#0B1F2A' }}>All-Access</th>
          </tr>
        </thead>
        <tbody>
          {FEATURE_ROWS.map((row, index) => (
            <tr 
              key={row.feature} 
              className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <td className="py-3.5 px-4 sm:px-6 text-sm text-gray-700">{row.feature}</td>
              <td className="py-3.5 px-2 sm:px-4 text-center">{renderCell(row.free)}</td>
              <td className="py-3.5 px-2 sm:px-4 text-center">{renderCell(row.artist)}</td>
              <td className="py-3.5 px-2 sm:px-4 text-center">{renderCell(row.designer)}</td>
              <td className="py-3.5 px-2 sm:px-4 text-center">{renderCell(row.gallery)}</td>
              <td className="py-3.5 px-2 sm:px-4 text-center" style={{ backgroundColor: 'rgba(201, 162, 77, 0.05)' }}>{renderCell(row.allAccess)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PricingPage;
