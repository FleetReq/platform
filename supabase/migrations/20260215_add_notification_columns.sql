-- Add email notification preferences to user_profiles
-- email_notifications_enabled: opt-out toggle (default true for all users)
-- last_notification_sent_at: dedup guard so we never send more than once per ~7 days

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_notification_sent_at timestamptz NULL;
