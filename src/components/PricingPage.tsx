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
    whoItsFor: 'Trying RoomVibe for the first time.',
    features: [
      'Upload up to 3 artworks',
      'Upload a photo of your own wall or use basic rooms',
      'Instantly see how your artwork looks on a wall',
      'Download images for preview and sharing',
      'Add a Buy button to link your artwork',
    ],
    buttonText: 'Get Started Free',
  },
  {
    id: 'artist',
    name: 'Artist',
    price: '€9',
    priceValue: 9,
    whoItsFor: 'Independent artists who want to present, share, and sell their art online.',
    entitlement: 'artist_access',
    features: [
      'Upload up to 50 artworks',
      'Upload your own walls or use realistic interiors',
      'See your artwork instantly on real walls',
      'Create and share your own virtual exhibition',
      'Download images for your website and social media',
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
      'Upload client wall photos or use premium rooms',
      'Create clear visual concepts for interiors',
      'Export images and PDFs for client presentations',
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
    whoItsFor: 'Galleries, exhibition spaces, and artists hosting their own virtual exhibitions.',
    entitlement: 'gallery_access',
    features: [
      'Upload unlimited artworks',
      'Upload real gallery or studio walls',
      'Create virtual exhibitions (up to 3 active)',
      'Share public exhibition links with visitors and collectors',
      'Export exhibition PDFs',
    ],
    highlightFeature: 'Discover and work with artists through the RoomVibe platform',
    buttonText: 'Unlock Exhibition Tools',
  },
  {
    id: 'allaccess',
    name: 'All-Access',
    price: '€79',
    priceValue: 79,
    whoItsFor: 'Full-time professionals, studios, and power users.',
    isAllAccess: true,
    recommended: true,
    features: [
      'Unlimited artworks, walls, and exhibitions',
      'Full Artist, Designer, and Gallery tools',
      'Unlimited exports',
      'Priority support',
      'Early access to new features',
    ],
    buttonText: 'Upgrade to All-Access',
  },
];

const COMPARISON_FEATURES = [
  { name: 'Artwork upload limit', free: '3', artist: '50', designer: '100', gallery: 'Unlimited', allaccess: 'Unlimited' },
  { name: 'Upload your own wall photos', free: true, artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Basic rooms (10)', free: true, artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Standard rooms', free: false, artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Premium rooms', free: false, artist: false, designer: true, gallery: true, allaccess: true },
  { name: 'Instant wall visualization', free: true, artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Image download', free: true, artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'PDF export', free: false, artist: false, designer: true, gallery: true, allaccess: true },
  { name: 'Virtual exhibitions', free: false, artist: true, designer: false, gallery: 'Up to 3', allaccess: 'Unlimited' },
  { name: 'Public exhibition share links', free: false, artist: true, designer: false, gallery: true, allaccess: true },
  { name: 'Designer Studio tools', free: false, artist: false, designer: true, gallery: false, allaccess: true },
  { name: 'Gallery / Exhibition Hub', free: false, artist: false, designer: false, gallery: true, allaccess: true },
  { name: 'Buy button integration', free: true, artist: true, designer: true, gallery: true, allaccess: true },
  { name: 'Priority support', free: false, artist: false, designer: false, gallery: false, allaccess: true },
  { name: 'Early access to new features', free: false, artist: false, designer: false, gallery: false, allaccess: true },
];

function CheckIcon({ className = "w-5 h-5", color }: { className?: string; color?: string }) {
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
    <div className="min-h-screen bg-white">
      <SiteHeader showPlanBadge={false} />

      <main className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section 1: Pricing Plans */}
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

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-20">
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

          {/* Section 2: Feature Comparison Table */}
          <div className="mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--roomvibe-navy)] text-center mb-10">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto rounded-xl border border-rv-neutral">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-rv-text border-b border-rv-neutral">Feature</th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-500 border-b border-rv-neutral min-w-[70px]">Free</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#264C61] border-b border-rv-neutral min-w-[70px]">Artist</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#264C61] border-b border-rv-neutral min-w-[80px]">Designer</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#264C61] border-b border-rv-neutral min-w-[90px]">Gallery</th>
                    <th className="text-center py-4 px-3 font-semibold text-[#C9A24A] border-b border-rv-neutral min-w-[90px]">All-Access</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-3.5 px-4 text-sm text-rv-text border-b border-rv-neutral/30">{feature.name}</td>
                      <td className="py-3.5 px-3 text-center border-b border-rv-neutral/30">
                        <ComparisonCell value={feature.free} />
                      </td>
                      <td className="py-3.5 px-3 text-center border-b border-rv-neutral/30">
                        <ComparisonCell value={feature.artist} />
                      </td>
                      <td className="py-3.5 px-3 text-center border-b border-rv-neutral/30">
                        <ComparisonCell value={feature.designer} />
                      </td>
                      <td className="py-3.5 px-3 text-center border-b border-rv-neutral/30">
                        <ComparisonCell value={feature.gallery} />
                      </td>
                      <td className="py-3.5 px-3 text-center border-b border-rv-neutral/30">
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
      className="relative flex flex-col bg-white h-full"
      style={{
        border: plan.recommended ? '2px solid #C9A24A' : '1.5px solid #DDE1E7',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: plan.recommended 
          ? '0px 8px 20px rgba(201, 162, 74, 0.18)' 
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
      </div>

      {/* Who it's for */}
      <div className="mb-4 pb-4 border-b border-rv-neutral/50">
        <p className="text-sm text-rv-textMuted">
          <span className="font-medium text-[#264C61]">Who it's for:</span><br />
          {plan.whoItsFor}
        </p>
      </div>

      {/* What you get */}
      <div className="mb-2">
        <p className="text-sm font-medium text-[#264C61] mb-2">What you get:</p>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-4">
        {plan.features.map((feature, i) => (
          <li 
            key={i} 
            className="flex items-start gap-2"
            style={{ fontSize: '14px', color: '#4A5A7F', lineHeight: '1.5' }}
          >
            <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Highlight Feature */}
      {plan.highlightFeature && (
        <div 
          className="mb-4 p-3 rounded-lg"
          style={{ 
            backgroundColor: plan.recommended ? 'rgba(201, 162, 74, 0.1)' : 'rgba(38, 76, 97, 0.06)',
            border: plan.recommended ? '1px solid rgba(201, 162, 74, 0.3)' : '1px solid rgba(38, 76, 97, 0.1)'
          }}
        >
          <div className="flex items-start gap-2">
            <StarIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.recommended ? 'text-[#C9A24A]' : 'text-[#C9A24A]'}`} />
            <p className="text-sm font-medium" style={{ color: '#264C61' }}>
              {plan.highlightFeature}
            </p>
          </div>
        </div>
      )}

      {/* Active Badge - Don't show for Free plan */}
      {isActive && plan.id !== 'free' && (
        <div 
          className="mb-4 py-2 px-3 rounded-lg text-sm text-center flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#E8EBF7',
            color: '#264C61',
            fontWeight: 600,
          }}
        >
          <CheckIcon className="w-4 h-4" color="#264C61" />
          {plan.isAllAccess ? 'Active – All Modules Unlocked' : 'Active'}
        </div>
      )}

      {/* Button */}
      <button
        onClick={onSelect}
        disabled={isActive && plan.id !== 'free' || isLoading}
        className={`w-full ${
          isActive && plan.id !== 'free'
            ? 'btn-primary text-sm bg-gray-100 !text-gray-400 cursor-not-allowed' 
            : plan.id === 'free'
              ? 'btn-outline text-sm'
              : plan.recommended 
                ? 'btn-premium text-sm' 
                : 'btn-primary text-sm'
        } disabled:opacity-50`}
      >
        {isLoading ? 'Loading...' : (isActive && plan.id !== 'free' ? 'Already Active' : plan.buttonText)}
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
      <CheckIcon 
        className="w-5 h-5 mx-auto" 
        color={isHighlighted ? '#C9A24A' : '#22c55e'}
      />
    );
  }
  
  return <span className="text-gray-400 text-lg">—</span>;
}

export default PricingPage;
