-- Test Users Setup for FleetReq Platform
-- Run this in Supabase SQL Editor to create test users with different subscription tiers

-- First, ensure the user_profiles table exists
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

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, subscription_plan, max_vehicles, max_invited_users)
  VALUES (NEW.id, 'free', 1, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- IMPORTANT: Test User Credentials
-- ===================================================================
-- You'll need to manually create these test users in Supabase Auth UI:
--
-- 1. Admin User (already exists):
--    Email: deeahtee@live.com
--    User ID: b73a07b2-ed72-41b1-943f-e119afc9eddb
--    Plan: business (automatically assigned via isAdmin())
--
-- 2. Free User:
--    Email: test-free@fleetreq.com
--    Password: TestFree123!
--    Plan: free (1 vehicle, view-only maintenance)
--
-- 3. Personal User:
--    Email: test-personal@fleetreq.com
--    Password: TestPersonal123!
--    Plan: personal (3 vehicles, full maintenance tracking)
--
-- 4. Business User:
--    Email: test-business@fleetreq.com
--    Password: TestBusiness123!
--    Plan: business (unlimited vehicles, team collaboration)
-- ===================================================================

-- After creating the users in Supabase Auth UI, run this to set their subscription plans:

-- Update admin user profile (if not already set)
INSERT INTO user_profiles (user_id, subscription_plan, max_vehicles, max_invited_users)
VALUES ('b73a07b2-ed72-41b1-943f-e119afc9eddb', 'business', 999, 99)
ON CONFLICT (user_id) DO UPDATE
SET subscription_plan = 'business', max_vehicles = 999, max_invited_users = 99;

-- NOTE: After creating the test users in Supabase Auth UI, you'll need to:
-- 1. Get their user IDs from the auth.users table
-- 2. Update the subscription plans below with the correct user IDs

-- Example queries to update subscription plans (replace USER_ID with actual IDs):

-- For Free User:
-- UPDATE user_profiles SET subscription_plan = 'free', max_vehicles = 1, max_invited_users = 0
-- WHERE user_id = 'REPLACE_WITH_FREE_USER_ID';

-- For Personal User:
-- UPDATE user_profiles SET subscription_plan = 'personal', max_vehicles = 3, max_invited_users = 0
-- WHERE user_id = 'REPLACE_WITH_PERSONAL_USER_ID';

-- For Business User:
-- UPDATE user_profiles SET subscription_plan = 'business', max_vehicles = 999, max_invited_users = 6
-- WHERE user_id = 'REPLACE_WITH_BUSINESS_USER_ID';

-- Query to view all user profiles and their plans:
-- SELECT
--   u.email,
--   p.subscription_plan,
--   p.max_vehicles,
--   p.max_invited_users,
--   p.user_id
-- FROM auth.users u
-- LEFT JOIN user_profiles p ON u.id = p.user_id
-- ORDER BY p.subscription_plan;
