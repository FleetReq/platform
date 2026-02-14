-- Migration: Auto-create tire_rotation when tire_change is added
-- Date: 2026-02-14
-- Description:
--   - Adds source_record_id column to maintenance_records (links auto-created records to their source)
--   - Creates trigger to auto-insert tire_rotation when tire_change is inserted
--   - Creates trigger to cascade-delete auto-created records when source record is deleted

-- 1. Add source_record_id column (nullable FK to self)
ALTER TABLE maintenance_records
  ADD COLUMN source_record_id uuid NULL;

ALTER TABLE maintenance_records
  ADD CONSTRAINT maintenance_records_source_record_fkey
  FOREIGN KEY (source_record_id) REFERENCES maintenance_records (id) ON DELETE CASCADE;

CREATE INDEX idx_maintenance_records_source_record_id ON maintenance_records (source_record_id);

-- 2. Function: Auto-create tire_rotation when tire_change is inserted
CREATE OR REPLACE FUNCTION auto_create_tire_rotation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'tire_change' THEN
    INSERT INTO maintenance_records (
      car_id,
      date,
      type,
      mileage,
      created_by_user_id,
      source_record_id,
      description
    ) VALUES (
      NEW.car_id,
      NEW.date,
      'tire_rotation',
      NEW.mileage,
      NEW.created_by_user_id,
      NEW.id,
      'Auto-created from tire change'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: Fire after INSERT on maintenance_records
CREATE TRIGGER auto_tire_rotation_on_tire_change
  AFTER INSERT ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tire_rotation();
