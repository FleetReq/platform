-- Add fuel_type column to fill_ups table
-- Run this in your Supabase SQL Editor

-- Add the fuel_type column to the fill_ups table
ALTER TABLE fill_ups
ADD COLUMN fuel_type VARCHAR(20) DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN fill_ups.fuel_type IS 'Type of fuel used (regular, midgrade, premium, diesel, e85)';

-- Create an index for better performance on fuel type queries
CREATE INDEX IF NOT EXISTS idx_fill_ups_fuel_type ON fill_ups(fuel_type);