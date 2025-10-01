-- Step 3: Update subscription plans for test users
-- Run this AFTER creating the test users in Supabase Auth UI

-- First, view all users and their current profiles
SELECT
  u.id as user_id,
  u.email,
  p.subscription_plan,
  p.max_vehicles,
  p.max_invited_users
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.email;

-- After creating the test users, update their profiles:

-- For Free User (test-free@fleetreq.com)
UPDATE user_profiles
SET subscription_plan = 'free', max_vehicles = 1, max_invited_users = 0
WHERE id = '644bd072-4d14-4a91-91eb-675d1406c537';

-- For Personal User (test-personal@fleetreq.com)
UPDATE user_profiles
SET subscription_plan = 'personal', max_vehicles = 3, max_invited_users = 0
WHERE id = '36df4089-6b72-4efc-9328-0e346a96c9c2';

-- For Business User (test-business@fleetreq.com)
UPDATE user_profiles
SET subscription_plan = 'business', max_vehicles = 999, max_invited_users = 6
WHERE id = '3317f330-c980-4f02-8587-4194f20906a5';

-- Verify all profiles are set correctly:
SELECT
  u.id as user_id,
  u.email,
  p.subscription_plan,
  p.max_vehicles,
  p.max_invited_users
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY p.subscription_plan, u.email;
