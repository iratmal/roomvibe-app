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
  highlighted?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: 'user',
    name: 'User',
    price: '€0',
    priceValue: 0,
    subtitle: 'Perfect to try RoomVibe without commitment.',
    features: [
      'Basic RoomVibe studio',
      'Upload 1 wall photo & 1 artwork',
      '5 starter mockup rooms',
      'Move and resize artwork on the wall',
      'No exports or downloads',
      'No premium rooms or client tools',
    ],
    buttonText: 'Start for free',
  },
  {
    id: 'artist',
    name: 'Artist',
    price: '€9',
    priceValue: 9,
    subtitle: 'For artists who want professional mockups of their art.',
    features: [
      'Everything in User',
      'Upload up to 50 artworks',
      'Access all premium mockup rooms',
      'High-resolution exports & PDFs',
      'Save unlimited projects',
      'Artist dashboard & collections',
    ],
    buttonText: 'Upgrade to Artist',
    highlighted: true,
  },
  {
    id: 'designer',
    name: 'Designer',
    price: '€29',
    priceValue: 29,
    subtitle: 'For interior designers presenting concepts to clients.',
    features: [
      'Everything in Artist',
      'Unlimited artwork and mockups',
      'Client folders & project organization',
      'Professional PDF proposals',
      'Light custom branding on exports',
      'Before/After layouts (coming soon)',
    ],
    buttonText: 'Upgrade to Designer',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    price: '€49',
    priceValue: 49,
    subtitle: 'For galleries managing collections and exhibitions.',
    features: [
      'Everything in Designer',
      'Gallery dashboard',
      'Multi-artist collections',
      'Up to 500 artworks',
      'White-label presentations',
      'Virtual gallery (future upgrade)',
    ],
    buttonText: 'Upgrade to Gallery',
  },
];

export function PricingPage() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handlePlanClick = async (plan: PlanConfig) => {
    setError('');

    if (plan.id === 'user') {
      if (!user) {
        window.location.hash = '#/register';
      }
      return;
    }

    if (!user) {
      sessionStorage.setItem('returnToPricing', 'true');
      window.location.hash = '#/login';
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

  const currentPlan = user?.role || 'user';
  const isCurrentPlan = (planId: string): boolean => !!(user && currentPlan === planId);

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
                  <a
                    href="#/register"
                    className="inline-flex items-center rounded-rvMd px-4 py-2 text-sm text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-rv-primary tracking-tight mb-4">
              Choose the RoomVibe plan that fits your art world
            </h1>
            <p className="text-lg text-rv-textMuted max-w-2xl mx-auto">
              From casual users to pro artists, designers and galleries – upgrade only when you're ready.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={isCurrentPlan(plan.id)}
                isLoading={loadingPlan === plan.id}
                onSelect={() => handlePlanClick(plan)}
                user={user}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
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
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelect: () => void;
  user: any;
}

function PlanCard({ plan, isCurrentPlan, isLoading, onSelect, user }: PlanCardProps) {
  const getButtonState = () => {
    if (isCurrentPlan) {
      if (plan.id === 'user') {
        return { text: "You're on the free plan", disabled: true, style: 'secondary' };
      }
      return { text: 'Current plan', disabled: true, style: 'secondary' };
    }
    if (isLoading) {
      return { text: 'Loading...', disabled: true, style: 'primary' };
    }
    return { text: plan.buttonText, disabled: false, style: plan.highlighted ? 'highlighted' : 'primary' };
  };

  const buttonState = getButtonState();

  return (
    <div
      className={`relative flex flex-col rounded-rvLg border-2 p-6 transition-all ${
        plan.highlighted
          ? 'border-rv-accent bg-gradient-to-b from-rv-accent/5 to-transparent shadow-lg scale-[1.02]'
          : 'border-rv-neutral bg-white hover:border-rv-primary/30 hover:shadow-md'
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-bold bg-rv-accent text-rv-text rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-rv-text">{plan.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-rv-primary">{plan.price}</span>
          {plan.priceValue > 0 && <span className="text-rv-textMuted">/ month</span>}
        </div>
        <p className="mt-2 text-sm text-rv-textMuted">{plan.subtitle}</p>
      </div>

      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start text-sm text-rv-text">
            <svg
              className={`w-5 h-5 mr-2 flex-shrink-0 ${
                feature.includes('No ') ? 'text-gray-400' : 'text-green-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {feature.includes('No ') ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              )}
            </svg>
            <span className={feature.includes('No ') ? 'text-rv-textMuted' : ''}>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={buttonState.disabled}
        className={`w-full py-3 px-4 rounded-rvMd font-semibold text-sm transition-all ${
          buttonState.disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : buttonState.style === 'highlighted'
            ? 'bg-rv-accent text-rv-text hover:bg-rv-accent/90 shadow-sm'
            : 'bg-rv-primary text-white hover:bg-rv-primaryHover'
        }`}
      >
        {buttonState.text}
      </button>
    </div>
  );
}

export default PricingPage;
