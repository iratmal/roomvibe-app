import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

export const STRIPE_PRICE_IDS: Record<string, string> = {
  user: process.env.STRIPE_PRICE_USER || 'prod_TWYCZTwBGyatt8',
  artist: process.env.STRIPE_PRICE_ARTIST || 'prod_TWYDkK6OaSaj4C',
  designer: process.env.STRIPE_PRICE_DESIGNER || 'prod_TWYDnd6eV54oMN',
  gallery: process.env.STRIPE_PRICE_GALLERY || 'prod_TWYEqX7PHujFrO',
  'all-access': process.env.STRIPE_PRICE_ALL_ACCESS || '',
};

export const PRICE_ID_TO_PLAN: Record<string, string> = Object.entries(STRIPE_PRICE_IDS).reduce(
  (acc, [plan, priceId]) => {
    acc[priceId] = plan;
    return acc;
  },
  {} as Record<string, string>
);

export function getPlanFromPriceId(priceId: string): string | null {
  return PRICE_ID_TO_PLAN[priceId] || null;
}

export const PLAN_NAMES: Record<string, string> = {
  user: 'RoomVibe User',
  artist: 'RoomVibe Artist',
  designer: 'RoomVibe Designer',
  gallery: 'RoomVibe Gallery',
  'all-access': 'RoomVibe All-Access',
};

export const PLAN_PRICES: Record<string, number> = {
  user: 0,
  artist: 9,
  designer: 29,
  gallery: 49,
  'all-access': 79,
};

export default stripe;
