import express from 'express';
import stripe, { STRIPE_PRICE_IDS, PLAN_NAMES } from '../stripe/stripe.js';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL || 'https://app.roomvibe.app';
  }
  const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
  if (replitDomain) {
    return `https://${replitDomain}`;
  }
  return 'http://localhost:5000';
};

router.post('/create-checkout-session', authenticateToken, async (req: any, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!['user', 'artist', 'designer', 'gallery'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be user, artist, designer, or gallery.' });
    }

    if (plan === 'user') {
      return res.status(400).json({ error: 'User plan is free. No checkout required.' });
    }

    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
      return res.status(500).json({ error: 'Price ID not configured for this plan.' });
    }

    const userResult = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    const existingCustomerId = userResult.rows[0]?.stripe_customer_id;

    const baseUrl = getBaseUrl();

    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/#/dashboard?billing=success`,
      cancel_url: `${baseUrl}/#/dashboard?billing=cancel`,
      metadata: {
        userId: userId.toString(),
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          plan: plan,
        },
      },
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`✅ Checkout session created for user ${userId}, plan: ${plan}`);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});

router.post('/customer-portal', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    const stripeCustomerId = userResult.rows[0]?.stripe_customer_id;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found. Please subscribe to a plan first.' });
    }

    const baseUrl = getBaseUrl();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/#/dashboard?billing=portal-return`,
    });

    console.log(`✅ Portal session created for user ${userId}`);
    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create billing portal session', details: error.message });
  }
});

router.get('/subscription', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      'SELECT subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      subscription_status: user.subscription_status || 'free',
      subscription_plan: user.subscription_plan || 'user',
      has_stripe_customer: !!user.stripe_customer_id,
      has_active_subscription: !!user.stripe_subscription_id,
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details', details: error.message });
  }
});

export default router;
