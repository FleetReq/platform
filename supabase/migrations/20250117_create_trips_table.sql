-- Create trips table for IRS-compliant mileage tracking
-- This table allows users to log individual trips with business/personal categorization
-- Required for accurate tax deduction calculations

CREATE TABLE IF NOT EXISTS public.trips (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,

  -- Trip details (IRS requirements)
  date DATE NOT NULL,
  start_location TEXT,
  end_location TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('business', 'personal')),
  business_purpose TEXT, -- Detailed description for business trips (e.g., "Client meeting at ABC Corp")
  miles DECIMAL(10, 2) NOT NULL CHECK (miles > 0),

  -- Optional metadata
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_car_id ON public.trips(car_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON public.trips("date" DESC); -- DESC for recent trips first
CREATE INDEX IF NOT EXISTS idx_trips_purpose ON public.trips(purpose);
CREATE INDEX IF NOT EXISTS idx_trips_user_date ON public.trips(user_id, "date" DESC); -- Composite for user's recent trips

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own trips

-- SELECT: Users can view only their own trips
CREATE POLICY "users_select_own_trips"
  ON public.trips
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- INSERT: Users can only create trips for themselves
CREATE POLICY "users_insert_own_trips"
  ON public.trips
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own trips
CREATE POLICY "users_update_own_trips"
  ON public.trips
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own trips
CREATE POLICY "users_delete_own_trips"
  ON public.trips
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trips_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.trips IS 'Stores individual trip records for IRS-compliant mileage tracking';
COMMENT ON COLUMN public.trips.purpose IS 'Trip purpose: business or personal (required for tax deductions)';
COMMENT ON COLUMN public.trips.business_purpose IS 'Detailed description of business purpose (required for IRS compliance if purpose=business)';
COMMENT ON COLUMN public.trips.miles IS 'Miles driven for this trip';
