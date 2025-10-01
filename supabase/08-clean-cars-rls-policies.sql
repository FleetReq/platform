-- Clean up duplicate RLS policies on cars table and fix INSERT policy
-- The INSERT policy needs a WITH CHECK clause to validate user_id

-- Step 1: Drop ALL existing policies on cars table
DROP POLICY IF EXISTS "Allow public read for demo" ON cars;
DROP POLICY IF EXISTS "Users can create their own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete their own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert own cars" ON cars;
DROP POLICY IF EXISTS "Users can update own cars" ON cars;
DROP POLICY IF EXISTS "Users can update their own cars" ON cars;
DROP POLICY IF EXISTS "Users can view own cars" ON cars;
DROP POLICY IF EXISTS "Users can view their own cars" ON cars;

-- Step 2: Create clean, non-duplicate policies

-- SELECT: Users can only view their own cars
CREATE POLICY "users_select_own_cars"
  ON cars FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- INSERT: Users can only create cars with their own user_id
CREATE POLICY "users_insert_own_cars"
  ON cars FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own cars
CREATE POLICY "users_update_own_cars"
  ON cars FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own cars
CREATE POLICY "users_delete_own_cars"
  ON cars FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Step 3: Verify the policies
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cars'
ORDER BY cmd, policyname;
