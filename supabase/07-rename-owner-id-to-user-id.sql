-- Rename owner_id to user_id in cars table for consistency
-- This ensures the API routes work correctly with user_id

-- Check if owner_id column exists and user_id doesn't
DO $$
BEGIN
  -- Only proceed if owner_id exists and user_id doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cars' AND column_name = 'user_id'
  ) THEN
    -- Rename the column
    ALTER TABLE cars RENAME COLUMN owner_id TO user_id;

    RAISE NOTICE 'Successfully renamed owner_id to user_id in cars table';
  ELSE
    RAISE NOTICE 'Column migration not needed - user_id already exists or owner_id does not exist';
  END IF;
END $$;

-- Verify the change
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cars'
  AND column_name IN ('owner_id', 'user_id')
ORDER BY column_name;
