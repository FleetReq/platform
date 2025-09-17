-- Add oil_type column to maintenance_records table
-- Run this in your Supabase SQL Editor

-- Add the oil_type column to the maintenance_records table
ALTER TABLE maintenance_records
ADD COLUMN oil_type VARCHAR(20) DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN maintenance_records.oil_type IS 'Type of oil used for oil changes (conventional, full_synthetic, synthetic_blend)';

-- Create an index for better performance on oil type queries
CREATE INDEX IF NOT EXISTS idx_maintenance_records_oil_type ON maintenance_records(oil_type);