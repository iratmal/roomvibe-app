import express from 'express';
import stripe, { getPlanFromPriceId } from '../stripe/stripe.js';
import { query } from '../db/database.js';

const router = express.Router();

// Helper function to get entitlement field name from plan
function getEntitlementFieldFromPlan(plan: string): string | null {
  const planToEntitlement: Record<string, string> = {
    'artist': 'artist_access',
    'designer': 'designer_access',
    'gallery': 'gallery_access',
  };
  return planToEntitlement[plan] || null;
}

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

        const userResult = await query(
          'SELECT is_admin FROM users WHERE id = $1',
          [userId]
        );
        const isAdmin = userResult.rows[0]?.is_admin === true;

        // Get the entitlement field for this plan
        const entitlementField = getEntitlementFieldFromPlan(plan);

        if (isAdmin) {
          // Admin: update subscription but keep all entitlements (they have all access)
          await query(
            `UPDATE users SET 
              subscription_status = 'active',
              subscription_plan = $1,
              stripe_customer_id = $2,
              stripe_subscription_id = $3,
              artist_access = TRUE,
              designer_access = TRUE,
              gallery_access = TRUE,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4`,
            [plan, customerId, subscriptionId, userId]
          );
          console.log(`✅ Admin user ${userId} subscription updated to ${plan} (all entitlements granted)`);
        } else if (entitlementField) {
          // Non-admin: SET the specific entitlement to TRUE (don't reset others)
          await query(
            `UPDATE users SET 
              subscription_status = 'active',
              subscription_plan = $1,
              stripe_customer_id = $2,
              stripe_subscription_id = $3,
              role = $1,
              ${entitlementField} = TRUE,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4`,
            [plan, customerId, subscriptionId, userId]
          );
          console.log(`✅ User ${userId} subscription updated to ${plan}, ${entitlementField} = TRUE`);
        } else {
          // Unknown plan - just update subscription status
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
          console.log(`✅ User ${userId} subscription updated to ${plan} (unknown plan type)`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status;

        const activePriceId = subscription.items?.data?.[0]?.price?.id;
        let plan = activePriceId ? getPlanFromPriceId(activePriceId) : null;
        
        if (!plan) {
          plan = subscription.metadata?.plan || null;
        }

        console.log(`📝 Subscription updated: customer ${customerId}, status: ${status}, priceId: ${activePriceId}, plan: ${plan}`);

        let subscriptionStatus = 'active';
        if (status === 'canceled' || status === 'unpaid') {
          subscriptionStatus = 'canceled';
        } else if (status === 'past_due') {
          subscriptionStatus = 'expired';
        }

        const adminCheckResult = await query(
          'SELECT is_admin FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );
        const isAdmin = adminCheckResult.rows[0]?.is_admin === true;

        // Get the entitlement field for this plan
        const entitlementField = plan ? getEntitlementFieldFromPlan(plan) : null;

        if (plan) {
          if (isAdmin) {
            // Admin: keep all entitlements
            await query(
              `UPDATE users SET 
                subscription_status = $1,
                subscription_plan = $2,
                artist_access = TRUE,
                designer_access = TRUE,
                gallery_access = TRUE,
                updated_at = CURRENT_TIMESTAMP
              WHERE stripe_customer_id = $3`,
              [subscriptionStatus, plan, customerId]
            );
            console.log(`✅ Admin subscription updated for customer ${customerId}: status=${subscriptionStatus}, plan=${plan}`);
          } else if (entitlementField && subscriptionStatus === 'active') {
            // Active subscription: SET the specific entitlement (don't reset others)
            await query(
              `UPDATE users SET 
                subscription_status = $1,
                subscription_plan = $2,
                role = $2,
                ${entitlementField} = TRUE,
                updated_at = CURRENT_TIMESTAMP
              WHERE stripe_customer_id = $3`,
              [subscriptionStatus, plan, customerId]
            );
            console.log(`✅ Subscription updated for customer ${customerId}: status=${subscriptionStatus}, plan=${plan}, ${entitlementField}=TRUE`);
          } else if (entitlementField && (subscriptionStatus === 'canceled' || subscriptionStatus === 'expired')) {
            // Canceled/expired: revoke the specific entitlement
            await query(
              `UPDATE users SET 
                subscription_status = $1,
                subscription_plan = $2,
                role = $2,
                ${entitlementField} = FALSE,
                updated_at = CURRENT_TIMESTAMP
              WHERE stripe_customer_id = $3`,
              [subscriptionStatus, plan, customerId]
            );
            console.log(`✅ Subscription ${subscriptionStatus} for customer ${customerId}: ${entitlementField}=FALSE`);
          } else {
            await query(
              `UPDATE users SET 
                subscription_status = $1,
                subscription_plan = $2,
                role = $2,
                updated_at = CURRENT_TIMESTAMP
              WHERE stripe_customer_id = $3`,
              [subscriptionStatus, plan, customerId]
            );
            console.log(`✅ Subscription updated for customer ${customerId}: status=${subscriptionStatus}, plan=${plan}`);
          }
        } else {
          await query(
            `UPDATE users SET 
              subscription_status = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE stripe_customer_id = $2`,
            [subscriptionStatus, customerId]
          );
          console.log(`✅ Subscription status updated for customer ${customerId}: status=${subscriptionStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Get the plan from the canceled subscription to know which entitlement to revoke
        const activePriceId = subscription.items?.data?.[0]?.price?.id;
        let plan = activePriceId ? getPlanFromPriceId(activePriceId) : null;
        if (!plan) {
          plan = subscription.metadata?.plan || null;
        }

        console.log(`🗑️ Subscription deleted for customer ${customerId}, plan: ${plan}`);

        const adminCheckResult = await query(
          'SELECT is_admin, subscription_plan FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );
        const isAdmin = adminCheckResult.rows[0]?.is_admin === true;
        const currentPlan = adminCheckResult.rows[0]?.subscription_plan || plan;

        // Get the entitlement field for the canceled plan
        const entitlementField = getEntitlementFieldFromPlan(currentPlan);

        if (isAdmin) {
          // Admin: keep all entitlements but update subscription status
          await query(
            `UPDATE users SET 
              subscription_status = 'canceled',
              subscription_plan = 'user',
              stripe_subscription_id = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE stripe_customer_id = $1`,
            [customerId]
          );
          console.log(`✅ Admin subscription canceled for customer ${customerId} (all entitlements preserved)`);
        } else if (entitlementField) {
          // Non-admin: revoke only the specific entitlement for the canceled plan
          await query(
            `UPDATE users SET 
              subscription_status = 'canceled',
              subscription_plan = 'user',
              role = 'user',
              stripe_subscription_id = NULL,
              ${entitlementField} = FALSE,
              updated_at = CURRENT_TIMESTAMP
            WHERE stripe_customer_id = $1`,
            [customerId]
          );
          console.log(`✅ User downgraded for customer ${customerId}: ${entitlementField}=FALSE`);
        } else {
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
        }
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
