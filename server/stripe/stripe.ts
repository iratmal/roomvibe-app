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
};

export const PLAN_NAMES: Record<string, string> = {
  user: 'RoomVibe User',
  artist: 'RoomVibe Artist',
  designer: 'RoomVibe Designer',
  gallery: 'RoomVibe Gallery',
};

export const PLAN_PRICES: Record<string, number> = {
  user: 0,
  artist: 9,
  designer: 29,
  gallery: 49,
};

export default stripe;
