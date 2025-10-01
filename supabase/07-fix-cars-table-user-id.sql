-- Fix cars table: Rename owner_id to user_id and update RLS policies
-- This ensures consistency across all API routes

-- Step 1: Check current column name
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cars'
  AND column_name IN ('owner_id', 'user_id');

-- Step 2: Rename owner_id to user_id if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'owner_id'
  ) THEN
    -- Rename the column
    ALTER TABLE cars RENAME COLUMN owner_id TO user_id;
    RAISE NOTICE 'Renamed owner_id to user_id in cars table';
  ELSE
    RAISE NOTICE 'Column already named user_id or owner_id does not exist';
  END IF;
END $$;

-- Step 3: Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can view their own cars" ON cars;
DROP POLICY IF EXISTS "Users can create their own cars" ON cars;
DROP POLICY IF EXISTS "Users can update their own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete their own cars" ON cars;

-- Create new RLS policies using user_id
CREATE POLICY "Users can view their own cars"
  ON cars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
  ON cars FOR DELETE
  USING (auth.uid() = user_id);

-- Step 4: Verify the changes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'cars';
