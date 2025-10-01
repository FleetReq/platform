-- Rename owner_id to user_id in cars table
-- This is required because the API code uses user_id

-- First check what we have
SELECT column_name FROM information_schema.columns
WHERE table_name = 'cars' AND column_name IN ('owner_id', 'user_id');

-- Rename the column
ALTER TABLE cars RENAME COLUMN owner_id TO user_id;

-- Verify the change
SELECT column_name FROM information_schema.columns
WHERE table_name = 'cars' AND column_name IN ('owner_id', 'user_id');
