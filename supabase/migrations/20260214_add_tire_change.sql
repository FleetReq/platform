-- Migration: Add tire_change maintenance type
-- Date: 2026-02-14
-- Description:
--   - Adds 'tire_change' as a new maintenance type
--   - Typical interval: 50,000 miles or 48 months (4 years)
--   - Database uses text column with CHECK constraint (not an enum type)

-- Drop old CHECK constraint and add updated one with tire_change
ALTER TABLE maintenance_records DROP CONSTRAINT maintenance_records_type_check;

ALTER TABLE maintenance_records ADD CONSTRAINT maintenance_records_type_check CHECK (
  type = ANY (ARRAY[
    'oil_change'::text,
    'tire_rotation'::text,
    'tire_change'::text,
    'brake_pads'::text,
    'rotors'::text,
    'air_filter'::text,
    'transmission_service'::text,
    'coolant_flush'::text,
    'wipers'::text,
    'registration'::text
  ])
);
