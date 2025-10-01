-- Fix existing user_profiles table - add subscription columns
-- Run this in Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Add subscription_plan column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'personal', 'business'));
  END IF;
END $$;

-- Add max_vehicles column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'max_vehicles'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN max_vehicles INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Add max_invited_users column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'max_invited_users'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN max_invited_users INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add is_primary_user column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_primary_user'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_primary_user BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Update admin user to have business plan (using 'id' column instead of 'user_id')
UPDATE user_profiles
SET
  subscription_plan = 'business',
  max_vehicles = 999,
  max_invited_users = 99,
  is_primary_user = true
WHERE id = 'b73a07b2-ed72-41b1-943f-e119afc9eddb';

-- Verify the changes
SELECT
  id,
  email,
  full_name,
  subscription_plan,
  max_vehicles,
  max_invited_users,
  is_primary_user
FROM user_profiles;
