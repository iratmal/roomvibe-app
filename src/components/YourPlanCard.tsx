import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface SubscriptionInfo {
  subscription_status: string;
  subscription_plan: string;
  has_stripe_customer: boolean;
  has_active_subscription: boolean;
}

interface PlanDisplay {
  badge: string;
  badgeColor: string;
  description: string;
  bullets: string[];
}

const PLAN_DISPLAYS: Record<string, PlanDisplay> = {
  user: {
    badge: 'User',
    badgeColor: 'bg-gray-100 text-gray-700',
    description: "You're on the free plan. Perfect for testing RoomVibe with basic features.",
    bullets: ['10 Basic Mockup Rooms', 'Up to 3 artworks'],
  },
  artist: {
    badge: 'Artist',
    badgeColor: 'bg-rv-primary/10 text-rv-primary',
    description: 'For artists who want professional mockups and high-quality exports.',
    bullets: ['Up to 50 artworks', 'Premium mockup rooms'],
  },
  designer: {
    badge: 'Designer',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'For interior designers presenting concepts to clients.',
    bullets: ['Unlimited artworks & mockups', 'Client folders & projects'],
  },
  gallery: {
    badge: 'Gallery',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'For galleries managing collections and exhibitions.',
    bullets: ['Gallery dashboard', 'Collections & multi-artist support'],
  },
};

export function YourPlanCard() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="bg-white rounded-rvLg border border-rv-neutral p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const plan = subscription?.subscription_plan || user?.role || 'user';
  const status = subscription?.subscription_status || 'free';
  const planDisplay = PLAN_DISPLAYS[plan] || PLAN_DISPLAYS.user;

  const isFree = plan === 'user' && status === 'free';
  const isActive = status === 'active' && plan !== 'user';
  const isCanceledOrExpired = status === 'canceled' || status === 'expired';

  const getStatusDisplay = () => {
    switch (status) {
      case 'active':
        return { text: 'Active', color: 'text-green-600' };
      case 'canceled':
        return { text: 'Canceled', color: 'text-red-600' };
      case 'expired':
        return { text: 'Expired', color: 'text-amber-600' };
      default:
        return { text: 'Free', color: 'text-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white rounded-rvLg border border-rv-neutral overflow-hidden">
      <div className="bg-gradient-to-r from-rv-primary/5 to-rv-accent/5 px-6 py-4 border-b border-rv-neutral">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-rv-text">Your Plan</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${planDisplay.badgeColor}`}>
            {planDisplay.badge}
            {isCanceledOrExpired && ` (${statusDisplay.text})`}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-rv-textMuted mb-2">
            Status: <span className={`font-semibold ${statusDisplay.color}`}>{statusDisplay.text}</span>
          </p>
          <p className="text-sm text-rv-text">
            {isCanceledOrExpired
              ? 'Your subscription is canceled. You still have free access to the basic RoomVibe studio.'
              : planDisplay.description}
          </p>
        </div>

        {!isCanceledOrExpired && planDisplay.bullets.length > 0 && (
          <ul className="mb-6 space-y-2">
            {planDisplay.bullets.map((bullet, i) => (
              <li key={i} className="flex items-center text-sm text-rv-textMuted">
                <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {(isFree || isCanceledOrExpired) ? (
            <>
              <a
                href="#/pricing"
                className="flex-1 text-center py-2.5 px-4 rounded-rvMd font-semibold text-sm bg-rv-primary text-white hover:bg-rv-primaryHover transition-colors"
              >
                {isCanceledOrExpired ? 'Upgrade again' : 'Upgrade plan'}
              </a>
              <a
                href="#/pricing"
                className="flex-1 text-center py-2.5 px-4 rounded-rvMd font-semibold text-sm border-2 border-rv-neutral text-rv-text hover:border-rv-primary hover:text-rv-primary transition-colors"
              >
                View all plans
              </a>
            </>
          ) : isActive ? (
            <>
              <button
                onClick={handleManageBilling}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 rounded-rvMd font-semibold text-sm bg-rv-primary text-white hover:bg-rv-primaryHover transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Loading...' : 'Manage billing'}
              </button>
              <a
                href="#/pricing"
                className="flex-1 text-center py-2.5 px-4 rounded-rvMd font-semibold text-sm border-2 border-rv-neutral text-rv-text hover:border-rv-primary hover:text-rv-primary transition-colors"
              >
                View all plans
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default YourPlanCard;
