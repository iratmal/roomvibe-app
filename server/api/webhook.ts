import express from 'express';
import stripe from '../stripe/stripe.js';
import { query } from '../db/database.js';

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📥 Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!userId || !plan) {
          console.error('❌ Missing userId or plan in checkout session metadata');
          break;
        }

        console.log(`✅ Checkout completed for user ${userId}, plan: ${plan}`);

        await query(
          `UPDATE users SET 
            subscription_status = 'active',
            subscription_plan = $1,
            stripe_customer_id = $2,
            stripe_subscription_id = $3,
            role = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4`,
          [plan, customerId, subscriptionId, userId]
        );

        console.log(`✅ User ${userId} subscription updated to ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status;
        const plan = subscription.metadata?.plan;

        console.log(`📝 Subscription updated: customer ${customerId}, status: ${status}`);

        let subscriptionStatus = 'active';
        if (status === 'canceled' || status === 'unpaid') {
          subscriptionStatus = 'canceled';
        } else if (status === 'past_due') {
          subscriptionStatus = 'expired';
        }

        const updateQuery = plan
          ? `UPDATE users SET 
              subscription_status = $1,
              subscription_plan = $2,
              role = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE stripe_customer_id = $3`
          : `UPDATE users SET 
              subscription_status = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE stripe_customer_id = $2`;

        const params = plan ? [subscriptionStatus, plan, customerId] : [subscriptionStatus, customerId];
        await query(updateQuery, params);

        console.log(`✅ Subscription status updated for customer ${customerId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        console.log(`🗑️ Subscription deleted for customer ${customerId}`);

        await query(
          `UPDATE users SET 
            subscription_status = 'canceled',
            subscription_plan = 'user',
            role = 'user',
            stripe_subscription_id = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_customer_id = $1`,
          [customerId]
        );

        console.log(`✅ User downgraded to free plan for customer ${customerId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log(`💰 Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        console.log(`❌ Payment failed for invoice ${invoice.id}, customer ${customerId}`);

        await query(
          `UPDATE users SET 
            subscription_status = 'expired',
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_customer_id = $1`,
          [customerId]
        );
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`❌ Error processing webhook:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
