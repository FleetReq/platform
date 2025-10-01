-- Fix foreign key constraint on cars table
-- Issue: cars.user_id references profiles.id, but users may not exist in profiles yet
-- Solution: Change to reference auth.users OR ensure user exists in profiles

-- Step 1: Drop the incorrect foreign key
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_user_id_fkey;

-- Step 2: Add correct foreign key to auth.users
ALTER TABLE cars
ADD CONSTRAINT cars_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 3: Verify the change
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid = 'cars'::regclass;
