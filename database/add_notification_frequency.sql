-- Migration: Add notification frequency settings to user_profiles
-- Run this in Supabase SQL Editor
-- Date: 2026-02-18

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS notification_frequency text NOT NULL DEFAULT 'weekly'
    CONSTRAINT user_profiles_notification_frequency_check
    CHECK (notification_frequency IN ('daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS notification_warning_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_profiles.notification_frequency IS
  'How often to re-send overdue maintenance alerts for paid users: daily, weekly (default), or monthly. Free users always get one-time alerts only.';

COMMENT ON COLUMN public.user_profiles.notification_warning_enabled IS
  'Whether to send warning (approaching due) emails. Family/Business plans only. Free users never receive warning emails.';
