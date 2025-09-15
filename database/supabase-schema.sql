-- Gas Mileage & Maintenance Tracker Database Schema
-- This file contains the SQL to set up the Supabase database

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cars table
CREATE TABLE cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
  color TEXT,
  license_plate TEXT,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fill_ups table for gas mileage tracking
CREATE TABLE fill_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading INTEGER NOT NULL CHECK (odometer_reading >= 0),
  gallons DECIMAL(6,3) NOT NULL CHECK (gallons > 0),
  price_per_gallon DECIMAL(5,3) NOT NULL CHECK (price_per_gallon > 0),
  total_cost DECIMAL(8,2) NOT NULL CHECK (total_cost > 0),
  gas_station TEXT,
  location TEXT,
  notes TEXT,
  mpg DECIMAL(5,2), -- Calculated field
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_records table
CREATE TABLE maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('oil_change', 'tire_rotation', 'brake_service', 'tune_up', 'repair', 'other')),
  description TEXT NOT NULL,
  cost DECIMAL(8,2) NOT NULL CHECK (cost >= 0),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  service_provider TEXT,
  location TEXT,
  next_service_date DATE,
  next_service_mileage INTEGER CHECK (next_service_mileage >= mileage),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_fill_ups_car_id ON fill_ups(car_id);
CREATE INDEX idx_fill_ups_date ON fill_ups(date);
CREATE INDEX idx_maintenance_records_car_id ON maintenance_records(car_id);
CREATE INDEX idx_maintenance_records_date ON maintenance_records(date);
CREATE INDEX idx_maintenance_records_type ON maintenance_records(type);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cars policies
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- Fill-ups policies
CREATE POLICY "Users can view own fill-ups" ON fill_ups
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

CREATE POLICY "Users can insert own fill-ups" ON fill_ups
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

CREATE POLICY "Users can update own fill-ups" ON fill_ups
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

CREATE POLICY "Users can delete own fill-ups" ON fill_ups
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

-- Maintenance records policies
CREATE POLICY "Users can view own maintenance records" ON maintenance_records
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

CREATE POLICY "Users can insert own maintenance records" ON maintenance_records
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

CREATE POLICY "Users can update own maintenance records" ON maintenance_records
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

CREATE POLICY "Users can delete own maintenance records" ON maintenance_records
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_fill_ups_updated_at BEFORE UPDATE ON fill_ups
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically calculate MPG when inserting/updating fill-ups
CREATE OR REPLACE FUNCTION calculate_mpg()
RETURNS TRIGGER AS $$
DECLARE
  previous_odometer INTEGER;
  miles_driven INTEGER;
BEGIN
  -- Find the previous fill-up for this car
  SELECT odometer_reading INTO previous_odometer
  FROM fill_ups
  WHERE car_id = NEW.car_id
    AND date < NEW.date
  ORDER BY date DESC, created_at DESC
  LIMIT 1;

  -- Calculate MPG if we have a previous reading
  IF previous_odometer IS NOT NULL THEN
    miles_driven := NEW.odometer_reading - previous_odometer;
    IF miles_driven > 0 THEN
      NEW.mpg := ROUND((miles_driven::DECIMAL / NEW.gallons), 2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to calculate MPG
CREATE TRIGGER calculate_fill_up_mpg
  BEFORE INSERT OR UPDATE ON fill_ups
  FOR EACH ROW EXECUTE PROCEDURE calculate_mpg();

-- Function to handle user signup (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Public statistics view (for displaying stats on main website)
CREATE OR REPLACE VIEW public_stats AS
SELECT
  COUNT(DISTINCT c.id) as total_cars,
  COUNT(f.id) as total_fill_ups,
  ROUND(AVG(f.mpg), 2) as average_mpg,
  SUM(f.gallons) as total_gallons,
  SUM(f.total_cost) as total_spent,
  COUNT(m.id) as total_maintenance_records,
  SUM(m.cost) as total_maintenance_cost
FROM cars c
LEFT JOIN fill_ups f ON c.id = f.car_id
LEFT JOIN maintenance_records m ON c.id = m.car_id;

-- Grant access to the public stats view
GRANT SELECT ON public_stats TO anon;
GRANT SELECT ON public_stats TO authenticated;