-- Migration: Separate brake_inspection into brake_pads and rotors
-- Date: 2026-02-12
-- Description:
--   - Adds 'brake_pads' and 'rotors' as distinct maintenance types
--   - Migrates existing 'brake_inspection' records to 'brake_pads'
--   - Removes deprecated 'brake_inspection' type
--   - Database uses text column with CHECK constraint (not an enum type)

-- Step 1: Migrate existing 'brake_inspection' records to 'brake_pads'
-- (Most users track brake pads, not rotor inspections)
UPDATE maintenance_records
SET type = 'brake_pads'
WHERE type = 'brake_inspection';

-- Step 2: Drop old CHECK constraint and add updated one with brake_pads and rotors
ALTER TABLE maintenance_records DROP CONSTRAINT maintenance_records_type_check;

ALTER TABLE maintenance_records ADD CONSTRAINT maintenance_records_type_check CHECK (
  type = ANY (ARRAY[
    'oil_change'::text,
    'tire_rotation'::text,
    'brake_pads'::text,
    'rotors'::text,
    'air_filter'::text,
    'transmission_service'::text,
    'coolant_flush'::text,
    'wipers'::text,
    'registration'::text
  ])
);

-- Verification: Check that migration worked
-- SELECT DISTINCT type FROM maintenance_records ORDER BY type;
