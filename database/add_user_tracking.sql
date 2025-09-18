-- Migration: Add user tracking to fill_ups and maintenance_records tables
-- This allows tracking who actually created each record (audit trail)

-- Add created_by_user_id column to fill_ups table
ALTER TABLE fill_ups
ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- Add created_by_user_id column to maintenance_records table
ALTER TABLE maintenance_records
ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- Add foreign key constraints to reference auth.users
ALTER TABLE fill_ups
ADD CONSTRAINT fk_fill_ups_created_by_user
FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);

ALTER TABLE maintenance_records
ADD CONSTRAINT fk_maintenance_records_created_by_user
FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fill_ups_created_by_user_id
ON fill_ups(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_created_by_user_id
ON maintenance_records(created_by_user_id);

-- Update RLS policies to allow users to see records they created
-- (in addition to seeing records for cars they own)

-- Drop existing RLS policies and recreate with user tracking
DROP POLICY IF EXISTS "Users can view fill-ups for their cars" ON fill_ups;
DROP POLICY IF EXISTS "Users can view maintenance records for their cars" ON maintenance_records;

-- New RLS policies that include created_by_user_id
CREATE POLICY "Users can view fill-ups for their cars or records they created" ON fill_ups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = fill_ups.car_id
    AND cars.user_id = auth.uid()
  ) OR
  fill_ups.created_by_user_id = auth.uid()
);

CREATE POLICY "Users can view maintenance records for their cars or records they created" ON maintenance_records
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = maintenance_records.car_id
    AND cars.user_id = auth.uid()
  ) OR
  maintenance_records.created_by_user_id = auth.uid()
);

-- Comments for documentation
COMMENT ON COLUMN fill_ups.created_by_user_id IS 'ID of the user who created this fill-up record';
COMMENT ON COLUMN maintenance_records.created_by_user_id IS 'ID of the user who created this maintenance record';