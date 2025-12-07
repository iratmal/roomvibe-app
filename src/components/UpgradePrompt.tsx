import React from 'react';

interface UpgradePromptProps {
  message: string;
  currentPlan?: string;
  suggestedPlan?: string;
  feature?: string;
  onUpgrade?: () => void;
  onClose?: () => void;
  variant?: 'modal' | 'inline' | 'toast';
}

const PLAN_NAMES: Record<string, string> = {
  user: 'Free',
  artist: 'Artist',
  designer: 'Designer',
  gallery: 'Gallery',
  allaccess: 'All-Access',
  admin: 'Admin',
};

const PLAN_PRICES: Record<string, string> = {
  user: 'Free',
  artist: '€9/month',
  designer: '€29/month',
  gallery: '€49/month',
  allaccess: '€79/month',
};

export function UpgradePrompt({
  message,
  currentPlan = 'user',
  suggestedPlan = 'artist',
  feature,
  onUpgrade,
  onClose,
  variant = 'inline',
}: UpgradePromptProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.hash = '#/pricing';
    }
  };

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-rvLg shadow-rvElevated max-w-md w-full p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-rv-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-rv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-rv-primary mb-1">Upgrade Required</h3>
              <p className="text-rv-textMuted text-sm">{message}</p>
            </div>
          </div>

          <div className="bg-rv-surface rounded-rvMd p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-rv-textMuted uppercase tracking-wide">Recommended Plan</p>
                <p className="text-lg font-bold text-rv-primary">{PLAN_NAMES[suggestedPlan]}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-rv-accent">{PLAN_PRICES[suggestedPlan]}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-rv-neutral rounded-rvMd text-rv-text font-semibold hover:bg-rv-surface transition-colors"
              >
                Maybe Later
              </button>
            )}
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2.5 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors shadow-rvSoft"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'toast') {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-rvLg shadow-rvElevated p-4 max-w-sm z-50 border border-rv-neutral">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-rv-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-rv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-rv-text font-medium mb-2">{message}</p>
            <button
              onClick={handleUpgrade}
              className="text-sm text-rv-primary font-semibold hover:text-rv-primaryHover transition-colors"
            >
              Upgrade to {PLAN_NAMES[suggestedPlan]} →
            </button>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-rv-textMuted hover:text-rv-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-rv-primary/5 to-rv-accent/5 border border-rv-primary/20 rounded-rvMd p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rv-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-rv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-rv-text font-medium">{message}</p>
          <p className="text-xs text-rv-textMuted mt-0.5">
            Current: {PLAN_NAMES[currentPlan]} • Suggested: {PLAN_NAMES[suggestedPlan]} ({PLAN_PRICES[suggestedPlan]})
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-4 py-2 bg-rv-primary text-white rounded-rvMd text-sm font-semibold hover:bg-rv-primaryHover transition-colors shadow-rvSoft whitespace-nowrap"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number;
  planName?: string;
}

export function UsageMeter({ label, current, limit, planName }: UsageMeterProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  return (
    <div className="p-4 bg-white rounded-rvMd border border-rv-neutral">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-rv-text">{label}</span>
        <span className={`text-sm font-semibold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-rv-textMuted'}`}>
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-rv-neutral rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-rv-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <p className="text-xs text-rv-textMuted">Unlimited on {planName || 'your'} plan</p>
      )}
      {isAtLimit && (
        <p className="text-xs text-red-600 mt-1 font-medium">Limit reached. Upgrade to add more.</p>
      )}
    </div>
  );
}

interface PlanFeatureBadgeProps {
  feature: string;
  hasAccess: boolean;
  requiredPlan?: string;
}

export function PlanFeatureBadge({ feature, hasAccess, requiredPlan }: PlanFeatureBadgeProps) {
  if (hasAccess) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {feature}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-rv-neutral text-rv-textMuted rounded text-xs font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      {feature} ({requiredPlan ? PLAN_NAMES[requiredPlan] : 'Upgrade'})
    </span>
  );
}
