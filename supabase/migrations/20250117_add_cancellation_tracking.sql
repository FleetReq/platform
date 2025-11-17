-- Add cancellation and data deletion tracking to user_profiles table

-- Add subscription end date (when subscription renews or expires)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone NULL;

-- Add cancellation requested timestamp
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamp with time zone NULL;

-- Add scheduled deletion date (subscription_end + 30 days grace period)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS scheduled_deletion_date timestamp with time zone NULL;

-- Add cancellation reason (optional, for analytics)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS cancellation_reason text NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.subscription_end_date IS 'Date when subscription ends/renews (for monthly/annual billing)';
COMMENT ON COLUMN public.user_profiles.cancellation_requested_at IS 'Timestamp when user requested subscription cancellation';
COMMENT ON COLUMN public.user_profiles.scheduled_deletion_date IS 'Date when all user data will be permanently deleted (subscription_end + 30 days)';
COMMENT ON COLUMN public.user_profiles.cancellation_reason IS 'Optional reason provided by user for cancellation';

-- Create index for cleanup cron job (to find accounts ready for deletion)
CREATE INDEX IF NOT EXISTS idx_user_profiles_scheduled_deletion
ON public.user_profiles(scheduled_deletion_date)
WHERE scheduled_deletion_date IS NOT NULL;
