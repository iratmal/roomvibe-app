import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface SubscriptionInfo {
  subscription_status: string;
  subscription_plan: string;
  has_stripe_customer: boolean;
  has_active_subscription: boolean;
}

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  user: {
    name: 'RoomVibe User',
    price: 'Free',
    features: ['Browse artwork', 'Basic visualization', 'Save favorites'],
  },
  artist: {
    name: 'RoomVibe Artist',
    price: '€9/month',
    features: ['Upload your artworks', 'Embed widgets on your site', 'Analytics dashboard'],
  },
  designer: {
    name: 'RoomVibe Designer',
    price: '€29/month',
    features: ['Create client projects', 'Upload room photos', 'Client presentations'],
  },
  gallery: {
    name: 'RoomVibe Gallery',
    price: '€49/month',
    features: ['Curated collections', 'Exhibition previews', 'Multi-artwork management'],
  },
};

export function SubscriptionCard() {
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

  const handleUpgrade = async (plan: string) => {
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError('Failed to start checkout process');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  const currentPlan = subscription?.subscription_plan || user?.role || 'user';
  const planDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.user;
  const status = subscription?.subscription_status || 'free';

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'canceled':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Canceled</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">Expired</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Free</span>;
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-rv-primary/5 to-rv-accent/5 rounded-rvLg border border-rv-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-rv-primary">Your Subscription</h3>
        {getStatusBadge()}
      </div>

      <div className="mb-4">
        <p className="text-xl font-bold text-rv-text">{planDetails.name}</p>
        <p className="text-rv-accent font-semibold">{planDetails.price}</p>
      </div>

      <ul className="mb-6 space-y-2">
        {planDetails.features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm text-rv-textMuted">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {subscription?.has_stripe_customer && (
          <button
            onClick={handleManageBilling}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-semibold border-2 border-rv-primary text-rv-primary rounded-rvMd hover:bg-rv-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Loading...' : 'Manage Billing'}
          </button>
        )}

        {currentPlan === 'user' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleUpgrade('artist')}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-semibold bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors disabled:opacity-50"
            >
              Upgrade to Artist
            </button>
            <button
              onClick={() => handleUpgrade('designer')}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-semibold bg-rv-accent text-rv-text rounded-rvMd hover:bg-rv-accent/80 transition-colors disabled:opacity-50"
            >
              Upgrade to Designer
            </button>
            <button
              onClick={() => handleUpgrade('gallery')}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-semibold bg-rv-text text-white rounded-rvMd hover:bg-rv-text/80 transition-colors disabled:opacity-50"
            >
              Upgrade to Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
