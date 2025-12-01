import { Request, Response, NextFunction } from 'express';

export function requireSubscription(requiredPlans: string | string[]) {
  const plans = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];

  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPlan = req.user.subscription_plan || 'user';
    const subscriptionStatus = req.user.subscription_status || 'free';

    const isActiveSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'free';

    req.user.isActiveSubscriber = isActiveSubscriber;

    if (plans.includes(userPlan) && isActiveSubscriber) {
      return next();
    }

    return res.status(403).json({
      error: 'Subscription required',
      required_plans: plans,
      current_plan: userPlan,
      subscription_status: subscriptionStatus,
    });
  };
}

export function attachSubscriptionInfo(req: any, res: Response, next: NextFunction) {
  if (req.user) {
    const subscriptionStatus = req.user.subscription_status || 'free';
    req.user.isActiveSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'free';
  }
  next();
}

export const PLAN_HIERARCHY: Record<string, number> = {
  user: 0,
  artist: 1,
  designer: 2,
  gallery: 3,
  admin: 99,
};

export function requireMinimumPlan(minimumPlan: string) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPlan = req.user.subscription_plan || 'user';
    const subscriptionStatus = req.user.subscription_status || 'free';

    const userLevel = PLAN_HIERARCHY[userPlan] || 0;
    const requiredLevel = PLAN_HIERARCHY[minimumPlan] || 0;

    const isActiveSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'free';
    req.user.isActiveSubscriber = isActiveSubscriber;

    if (userLevel >= requiredLevel && isActiveSubscriber) {
      return next();
    }

    return res.status(403).json({
      error: 'Subscription upgrade required',
      minimum_plan: minimumPlan,
      current_plan: userPlan,
      subscription_status: subscriptionStatus,
    });
  };
}
