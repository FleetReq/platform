-- Comprehensive Maintenance Schema Update
-- Run this in your Supabase SQL Editor to fix all maintenance issues

-- 1. Add missing columns to maintenance_records table
ALTER TABLE maintenance_records
ADD COLUMN IF NOT EXISTS oil_type VARCHAR(20) DEFAULT NULL;

-- 2. Add missing columns to fill_ups table
ALTER TABLE fill_ups
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) DEFAULT NULL;

-- 3. Add current_mileage column to cars table (if not exists)
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS current_mileage INTEGER DEFAULT NULL;

-- 4. Make cost and description optional in maintenance_records
ALTER TABLE maintenance_records
ALTER COLUMN cost DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN mileage DROP NOT NULL;

-- 5. Make price_per_gallon and total_cost optional in fill_ups (focus on MPG, not cost)
ALTER TABLE fill_ups
DROP CONSTRAINT IF EXISTS fill_ups_price_per_gallon_check,
DROP CONSTRAINT IF EXISTS fill_ups_total_cost_check,
ALTER COLUMN price_per_gallon DROP NOT NULL,
ALTER COLUMN total_cost DROP NOT NULL;

-- Add new constraints that allow NULL but still validate positive values when present
ALTER TABLE fill_ups
ADD CONSTRAINT fill_ups_price_per_gallon_check
CHECK (price_per_gallon IS NULL OR price_per_gallon > 0);

ALTER TABLE fill_ups
ADD CONSTRAINT fill_ups_total_cost_check
CHECK (total_cost IS NULL OR total_cost > 0);

-- 6. Update the maintenance type constraint to include all 8 types
ALTER TABLE maintenance_records
DROP CONSTRAINT IF EXISTS maintenance_records_type_check;

ALTER TABLE maintenance_records
ADD CONSTRAINT maintenance_records_type_check
CHECK (type IN (
  'oil_change',
  'tire_rotation',
  'brake_inspection',
  'air_filter',
  'transmission_service',
  'coolant_flush',
  'wipers',
  'registration'
));

-- 7. Add comments to document the new columns
COMMENT ON COLUMN maintenance_records.oil_type IS 'Type of oil used for oil changes (conventional, full_synthetic, synthetic_blend)';
COMMENT ON COLUMN fill_ups.fuel_type IS 'Type of fuel used (regular, midgrade, premium, diesel, e85)';
COMMENT ON COLUMN cars.current_mileage IS 'Current odometer reading for the vehicle in miles';

-- 8. Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_maintenance_records_oil_type ON maintenance_records(oil_type);
CREATE INDEX IF NOT EXISTS idx_fill_ups_fuel_type ON fill_ups(fuel_type);
CREATE INDEX IF NOT EXISTS idx_cars_current_mileage ON cars(current_mileage);

-- 9. Update any existing maintenance records with old types (if needed)
-- This is safe to run even if no old records exist
UPDATE maintenance_records SET type = 'brake_inspection' WHERE type = 'brake_service';

-- Verification queries (optional - just to check the results)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'maintenance_records' ORDER BY ordinal_position;

-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'fill_ups' ORDER BY ordinal_position;

-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'cars' ORDER BY ordinal_position;