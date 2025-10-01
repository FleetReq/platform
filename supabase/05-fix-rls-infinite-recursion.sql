-- Fix infinite recursion in user_profiles RLS policies
-- This script disables RLS temporarily, drops all policies, and recreates them correctly

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Disable RLS temporarily to allow cleanup
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (catches any with different names)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_profiles';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Recreate simple, non-recursive policies
CREATE POLICY "user_profiles_select_policy"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_policy"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "user_profiles_update_policy"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Verify final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
