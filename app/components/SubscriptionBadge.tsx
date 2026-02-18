"use client";

type SubscriptionTier = 'free' | 'personal' | 'business';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  subscriptionStartDate?: string | null;
  className?: string;
}

export function SubscriptionBadge({ tier, subscriptionStartDate, className = '' }: SubscriptionBadgeProps) {
  const getBadgeStyles = () => {
    switch (tier) {
      case 'free':
        return {
          container: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
          label: 'Free'
        };
      case 'personal':
        return {
          container: 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white animate-gradient-shift',
          label: 'Family'
        };
      case 'business':
        return {
          container: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-gray-900 animate-gradient-shift animate-glow-pulse',
          label: 'Business'
        };
      default:
        return {
          container: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
          label: 'Free'
        };
    }
  };

  // Calculate months since subscription start
  const getMonthsSinceStart = (): number => {
    if (!subscriptionStartDate || tier === 'free') return 0;

    const start = new Date(subscriptionStartDate);
    const now = new Date();

    const yearsDiff = now.getFullYear() - start.getFullYear();
    const monthsDiff = now.getMonth() - start.getMonth();

    return yearsDiff * 12 + monthsDiff;
  };

  const { container, label } = getBadgeStyles();
  const months = getMonthsSinceStart();
  const showMonths = tier !== 'free' && months >= 0;

  // Don't show badge for free tier
  if (tier === 'free') return null;

  return (
    <span
      className={`inline-flex flex-col items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${container} ${className}`}
    >
      <span>{label}</span>
      {showMonths && (
        <span className="text-[9px] font-normal normal-case opacity-90 mt-0.5">
          {months < 1 ? '<1 month' : `${months} month${months !== 1 ? 's' : ''}`}
        </span>
      )}
    </span>
  );
}
