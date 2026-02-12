-- Migration: Separate brake_inspection into brake_pads and rotors
-- Date: 2026-02-12
-- Description:
--   - Adds 'brake_pads' and 'rotors' as distinct maintenance types
--   - Migrates existing 'brake_inspection' records to 'brake_pads'
--   - Removes deprecated 'brake_inspection' type

-- Step 1: Add new maintenance types to enum
ALTER TYPE maintenance_type ADD VALUE IF NOT EXISTS 'brake_pads';
ALTER TYPE maintenance_type ADD VALUE IF NOT EXISTS 'rotors';

-- Step 2: Migrate existing 'brake_inspection' records to 'brake_pads'
-- (Most users track brake pads, not rotor inspections)
UPDATE maintenance_records
SET maintenance_type = 'brake_pads'
WHERE maintenance_type = 'brake_inspection';

-- Step 3: Remove 'brake_inspection' from enum
-- Note: PostgreSQL doesn't support removing enum values directly.
-- We need to recreate the enum type.

-- Create new enum type without 'brake_inspection'
CREATE TYPE maintenance_type_new AS ENUM (
  'oil_change',
  'tire_rotation',
  'brake_pads',
  'rotors',
  'air_filter',
  'transmission_service',
  'coolant_flush',
  'wipers',
  'registration'
);

-- Update the column to use the new enum type
ALTER TABLE maintenance_records
  ALTER COLUMN maintenance_type TYPE maintenance_type_new
  USING maintenance_type::text::maintenance_type_new;

-- Drop the old enum type
DROP TYPE maintenance_type;

-- Rename the new enum type to the original name
ALTER TYPE maintenance_type_new RENAME TO maintenance_type;

-- Verification: Check that migration worked
-- (This comment is for manual verification in Supabase SQL editor)
-- SELECT DISTINCT maintenance_type FROM maintenance_records ORDER BY maintenance_type;
