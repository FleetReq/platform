-- Migration: Add 5 new maintenance types
-- Date: 2026-02-14
-- Description:
--   - Adds brake_fluid_flush, spark_plugs, battery, cabin_air_filter, serpentine_belt
--   - Database uses text column with CHECK constraint (not an enum type)
--   - Typical intervals:
--     brake_fluid_flush: 24 months (time-based only)
--     spark_plugs: 36 months / 30,000 miles
--     battery: 48 months (time-based only)
--     cabin_air_filter: 12 months / 15,000 miles
--     serpentine_belt: 60 months / 60,000 miles

-- Drop old CHECK constraint and add updated one with all 15 types
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
    'brake_fluid_flush'::text,
    'spark_plugs'::text,
    'battery'::text,
    'cabin_air_filter'::text,
    'serpentine_belt'::text,
    'wipers'::text,
    'registration'::text
  ])
);
