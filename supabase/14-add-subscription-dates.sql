-- Add subscription tracking columns to user_profiles
-- These track when users started their paid subscriptions for membership duration display

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_tier_start_date TIMESTAMP;

COMMENT ON COLUMN user_profiles.subscription_start_date IS 'When user first subscribed to a paid plan (resets if they cancel and resubscribe)';
COMMENT ON COLUMN user_profiles.current_tier_start_date IS 'When user started their current subscription tier (for tracking tier changes)';

-- Set initial dates for existing paid users (assuming they started today for testing)
-- In production, this would be set when Stripe subscription is created
UPDATE user_profiles
SET
  subscription_start_date = NOW(),
  current_tier_start_date = NOW()
WHERE subscription_plan IN ('personal', 'business')
  AND subscription_start_date IS NULL;
