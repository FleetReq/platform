-- Step 1: Create user_profiles table
-- Run this FIRST in Supabase SQL Editor

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'personal', 'business')),
  max_vehicles INTEGER NOT NULL DEFAULT 1,
  max_invited_users INTEGER NOT NULL DEFAULT 0,
  is_primary_user BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: System can insert profiles (for new user registration)
CREATE POLICY "System can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Insert profile for admin user (your existing account)
INSERT INTO user_profiles (user_id, subscription_plan, max_vehicles, max_invited_users)
VALUES ('b73a07b2-ed72-41b1-943f-e119afc9eddb', 'business', 999, 99)
ON CONFLICT (user_id) DO UPDATE
SET subscription_plan = 'business', max_vehicles = 999, max_invited_users = 99;
