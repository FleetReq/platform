-- Fix: Populate user_profiles.email and full_name from auth.users
-- Run this in Supabase SQL Editor (one-time fix)

-- Backfill email from auth.users where user_profiles.email is NULL
UPDATE user_profiles up
SET email = u.email
FROM auth.users u
WHERE up.id = u.id
  AND up.email IS NULL
  AND u.email IS NOT NULL;

-- Backfill full_name from auth.users metadata where user_profiles.full_name is NULL
UPDATE user_profiles up
SET full_name = COALESCE(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name'
)
FROM auth.users u
WHERE up.id = u.id
  AND up.full_name IS NULL
  AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.raw_user_meta_data->>'name' IS NOT NULL);

-- Backfill avatar_url from auth.users metadata where user_profiles.avatar_url is NULL
UPDATE user_profiles up
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE up.id = u.id
  AND up.avatar_url IS NULL
  AND (u.raw_user_meta_data->>'avatar_url' IS NOT NULL OR u.raw_user_meta_data->>'picture' IS NOT NULL);

-- Fix org names that are empty or just "'s Organization"
UPDATE organizations o
SET name = COALESCE(up.full_name, split_part(up.email, '@', 1), 'My') || '''s Organization'
FROM org_members om
JOIN user_profiles up ON up.id = om.user_id
WHERE o.id = om.org_id
  AND om.role = 'owner'
  AND (o.name IS NULL OR o.name = '' OR o.name = '''s Organization');
