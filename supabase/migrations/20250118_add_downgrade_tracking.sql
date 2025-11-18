-- Add columns to track pending subscription downgrades
-- This allows users to downgrade at the end of their billing period

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pending_downgrade_tier TEXT CHECK (pending_downgrade_tier IN ('free', 'personal')),
ADD COLUMN IF NOT EXISTS downgrade_effective_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS downgrade_requested_at TIMESTAMPTZ;

-- Add index for efficient lookup of pending downgrades
CREATE INDEX IF NOT EXISTS idx_user_profiles_downgrade_effective
ON user_profiles(downgrade_effective_date)
WHERE downgrade_effective_date IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN user_profiles.pending_downgrade_tier IS
'The subscription tier user is downgrading to (null if no pending downgrade)';

COMMENT ON COLUMN user_profiles.downgrade_effective_date IS
'Date when the downgrade will take effect (end of current billing period)';

COMMENT ON COLUMN user_profiles.downgrade_requested_at IS
'Timestamp when user requested the downgrade';
