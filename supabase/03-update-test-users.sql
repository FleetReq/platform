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
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.email;

-- After creating the test users, update their profiles:

-- For Free User (test-free@fleetreq.com)
-- REPLACE 'USER_ID_HERE' with the actual user_id from the query above
/*
UPDATE user_profiles
SET subscription_plan = 'free', max_vehicles = 1, max_invited_users = 0
WHERE user_id = 'USER_ID_HERE';
*/

-- For Personal User (test-personal@fleetreq.com)
-- REPLACE 'USER_ID_HERE' with the actual user_id from the query above
/*
UPDATE user_profiles
SET subscription_plan = 'personal', max_vehicles = 3, max_invited_users = 0
WHERE user_id = 'USER_ID_HERE';
*/

-- For Business User (test-business@fleetreq.com)
-- REPLACE 'USER_ID_HERE' with the actual user_id from the query above
/*
UPDATE user_profiles
SET subscription_plan = 'business', max_vehicles = 999, max_invited_users = 6
WHERE user_id = 'USER_ID_HERE';
*/

-- Verify all profiles are set correctly:
SELECT
  u.id as user_id,
  u.email,
  p.subscription_plan,
  p.max_vehicles,
  p.max_invited_users
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY p.subscription_plan, u.email;
