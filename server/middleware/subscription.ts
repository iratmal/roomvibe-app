import { Request, Response, NextFunction } from 'express';
import { query } from '../db/database.js';
import { 
  getEffectivePlan, 
  getPlanLimits, 
  isWithinLimit, 
  getUpgradeMessage,
  PLAN_HIERARCHY,
  PLAN_NAMES,
  PlanType,
  PlanLimits
} from '../config/planLimits.js';

export { PLAN_HIERARCHY, PLAN_NAMES, getEffectivePlan, getPlanLimits, isWithinLimit, getUpgradeMessage };
export type { PlanType, PlanLimits };

export function requireSubscription(requiredPlans: string | string[]) {
  const plans = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];

  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const effectivePlan = getEffectivePlan(req.user);
    req.user.effectivePlan = effectivePlan;
    req.user.planLimits = getPlanLimits(req.user);

    if (plans.includes(effectivePlan) || effectivePlan === 'admin') {
      return next();
    }

    return res.status(403).json({
      error: 'Subscription required',
      required_plans: plans,
      current_plan: effectivePlan,
      subscription_status: req.user.subscription_status,
    });
  };
}

export function attachSubscriptionInfo(req: any, res: Response, next: NextFunction) {
  if (req.user) {
    const effectivePlan = getEffectivePlan(req.user);
    req.user.effectivePlan = effectivePlan;
    req.user.planLimits = getPlanLimits(req.user);
    req.user.isActiveSubscriber = req.user.subscription_status === 'active' || req.user.subscription_status === 'free';
  }
  next();
}

export function requireMinimumPlan(minimumPlan: string) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const effectivePlan = getEffectivePlan(req.user);
    req.user.effectivePlan = effectivePlan;
    req.user.planLimits = getPlanLimits(req.user);

    const userLevel = PLAN_HIERARCHY[effectivePlan] || 0;
    const requiredLevel = PLAN_HIERARCHY[minimumPlan as PlanType] || 0;

    if (userLevel >= requiredLevel) {
      return next();
    }

    const { message, suggestedPlan } = getUpgradeMessage(effectivePlan, 'general');

    return res.status(403).json({
      error: 'Subscription upgrade required',
      message: `This feature requires ${PLAN_NAMES[minimumPlan as PlanType] || minimumPlan} plan or higher.`,
      minimum_plan: minimumPlan,
      current_plan: effectivePlan,
      suggested_plan: suggestedPlan,
      subscription_status: req.user.subscription_status,
    });
  };
}

export function requireFeature(feature: keyof PlanLimits) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const effectivePlan = getEffectivePlan(req.user);
    const limits = getPlanLimits(req.user);
    req.user.effectivePlan = effectivePlan;
    req.user.planLimits = limits;

    const featureValue = limits[feature];
    const hasAccess = typeof featureValue === 'boolean' ? featureValue : featureValue !== 0;

    if (hasAccess) {
      return next();
    }

    const { message, suggestedPlan } = getUpgradeMessage(effectivePlan, feature);

    return res.status(403).json({
      error: 'Feature not available',
      message,
      feature,
      current_plan: effectivePlan,
      suggested_plan: suggestedPlan,
      upgrade_url: '/pricing',
    });
  };
}

export async function checkArtworkLimit(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const effectivePlan = getEffectivePlan(req.user);
  const limits = getPlanLimits(req.user);
  req.user.effectivePlan = effectivePlan;
  req.user.planLimits = limits;

  if (limits.maxArtworks === -1) {
    return next();
  }

  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM artworks WHERE artist_id = $1',
      [req.user.id]
    );
    const currentCount = parseInt(result.rows[0].count, 10);

    if (currentCount >= limits.maxArtworks) {
      const { message, suggestedPlan } = getUpgradeMessage(effectivePlan, 'maxArtworks');
      return res.status(403).json({
        error: 'Artwork limit reached',
        message,
        current_count: currentCount,
        limit: limits.maxArtworks,
        current_plan: effectivePlan,
        suggested_plan: suggestedPlan,
        upgrade_url: '/pricing',
      });
    }

    req.user.artworkCount = currentCount;
    next();
  } catch (error) {
    console.error('Error checking artwork limit:', error);
    next();
  }
}

export async function checkWallPhotoLimit(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const effectivePlan = getEffectivePlan(req.user);
  const limits = getPlanLimits(req.user);
  req.user.effectivePlan = effectivePlan;
  req.user.planLimits = limits;

  if (limits.maxWallPhotos === -1) {
    return next();
  }

  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM room_images ri JOIN projects p ON ri.project_id = p.id WHERE p.designer_id = $1',
      [req.user.id]
    );
    const currentCount = parseInt(result.rows[0].count, 10);

    if (currentCount >= limits.maxWallPhotos) {
      const { message, suggestedPlan } = getUpgradeMessage(effectivePlan, 'maxWallPhotos');
      return res.status(403).json({
        error: 'Wall photo limit reached',
        message,
        current_count: currentCount,
        limit: limits.maxWallPhotos,
        current_plan: effectivePlan,
        suggested_plan: suggestedPlan,
        upgrade_url: '/pricing',
      });
    }

    req.user.wallPhotoCount = currentCount;
    next();
  } catch (error) {
    console.error('Error checking wall photo limit:', error);
    next();
  }
}

export async function checkProjectLimit(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const effectivePlan = getEffectivePlan(req.user);
  const limits = getPlanLimits(req.user);
  req.user.effectivePlan = effectivePlan;
  req.user.planLimits = limits;

  if (limits.maxProjects === -1) {
    return next();
  }

  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM projects WHERE designer_id = $1',
      [req.user.id]
    );
    const currentCount = parseInt(result.rows[0].count, 10);

    if (currentCount >= limits.maxProjects) {
      const { message, suggestedPlan } = getUpgradeMessage(effectivePlan, 'maxProjects');
      return res.status(403).json({
        error: 'Project limit reached',
        message,
        current_count: currentCount,
        limit: limits.maxProjects,
        current_plan: effectivePlan,
        suggested_plan: suggestedPlan,
        upgrade_url: '/pricing',
      });
    }

    req.user.projectCount = currentCount;
    next();
  } catch (error) {
    console.error('Error checking project limit:', error);
    next();
  }
}

export async function checkGalleryArtworkLimit(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const effectivePlan = getEffectivePlan(req.user);
  const limits = getPlanLimits(req.user);
  req.user.effectivePlan = effectivePlan;
  req.user.planLimits = limits;

  if (limits.maxArtworks === -1) {
    return next();
  }

  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM gallery_artworks ga 
       JOIN gallery_collections gc ON ga.collection_id = gc.id 
       WHERE gc.gallery_id = $1`,
      [req.user.id]
    );
    const currentCount = parseInt(result.rows[0].count, 10);

    if (currentCount >= limits.maxArtworks) {
      const { message, suggestedPlan } = getUpgradeMessage(effectivePlan, 'maxArtworks');
      return res.status(403).json({
        error: 'Gallery artwork limit reached',
        message,
        current_count: currentCount,
        limit: limits.maxArtworks,
        current_plan: effectivePlan,
        suggested_plan: suggestedPlan,
        upgrade_url: '/pricing',
      });
    }

    req.user.galleryArtworkCount = currentCount;
    next();
  } catch (error) {
    console.error('Error checking gallery artwork limit:', error);
    next();
  }
}
