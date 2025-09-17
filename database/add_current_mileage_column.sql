-- Add current_mileage column to cars table
-- Run this in your Supabase SQL Editor

-- Add the current_mileage column to the cars table
ALTER TABLE cars
ADD COLUMN current_mileage INTEGER DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN cars.current_mileage IS 'Current odometer reading for the vehicle in miles';

-- Optional: Set initial values based on latest fill-up or maintenance records
-- This will populate existing cars with their highest recorded mileage
UPDATE cars
SET current_mileage = (
  SELECT MAX(odometer_reading)
  FROM fill_ups
  WHERE fill_ups.car_id = cars.id
)
WHERE id IN (
  SELECT DISTINCT car_id
  FROM fill_ups
);

-- For cars without fill-ups, try to get from maintenance records
UPDATE cars
SET current_mileage = (
  SELECT MAX(mileage)
  FROM maintenance_records
  WHERE maintenance_records.car_id = cars.id
)
WHERE current_mileage IS NULL
AND id IN (
  SELECT DISTINCT car_id
  FROM maintenance_records
);

-- Create an index for better performance on mileage-based queries
CREATE INDEX IF NOT EXISTS idx_cars_current_mileage ON cars(current_mileage);