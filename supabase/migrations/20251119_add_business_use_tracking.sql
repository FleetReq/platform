-- Add business use tracking to cars table and create history tables
-- This enables IRS-compliant tax deduction tracking with proper method lock-in rules

-- ============================================================================
-- 1. Add business use fields to cars table
-- ============================================================================

ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS business_use_percentage INTEGER DEFAULT 0 CHECK (business_use_percentage >= 0 AND business_use_percentage <= 100),
ADD COLUMN IF NOT EXISTS business_use_start_date DATE,
ADD COLUMN IF NOT EXISTS first_year_deduction_method VARCHAR(20) CHECK (first_year_deduction_method IN ('standard_mileage', 'actual_expense'));

-- Add helpful comments
COMMENT ON COLUMN public.cars.business_use_percentage IS 'Percentage of vehicle used for business (0=personal, 100=business only, 1-99=mixed use)';
COMMENT ON COLUMN public.cars.business_use_start_date IS 'Date when business use began (determines first tax year)';
COMMENT ON COLUMN public.cars.first_year_deduction_method IS 'IRS deduction method chosen in first year (locks out standard_mileage if actual_expense)';

-- ============================================================================
-- 2. Create business_use_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_use_history (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,

  -- Business use change details
  effective_date DATE NOT NULL,
  business_use_percentage INTEGER NOT NULL CHECK (business_use_percentage >= 0 AND business_use_percentage <= 100),

  -- Optional context
  reason TEXT, -- e.g., "Started new business", "Retired vehicle from business use"
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_business_use_history_car_id ON public.business_use_history(car_id);
CREATE INDEX IF NOT EXISTS idx_business_use_history_car_date ON public.business_use_history(car_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_business_use_history_user_id ON public.business_use_history(user_id);

-- Enable Row Level Security
ALTER TABLE public.business_use_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own business use history

-- SELECT: Users can view only their own history
CREATE POLICY "users_select_own_business_use_history"
  ON public.business_use_history
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- INSERT: Users can only create history for themselves
CREATE POLICY "users_insert_own_business_use_history"
  ON public.business_use_history
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own history
CREATE POLICY "users_update_own_business_use_history"
  ON public.business_use_history
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own history
CREATE POLICY "users_delete_own_business_use_history"
  ON public.business_use_history
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.business_use_history IS 'Tracks changes in vehicle business use percentage over time for accurate tax calculations';
COMMENT ON COLUMN public.business_use_history.effective_date IS 'Date when this business use percentage took effect';
COMMENT ON COLUMN public.business_use_history.business_use_percentage IS 'Business use percentage (0-100) starting from effective_date';

-- ============================================================================
-- 3. Create deduction_method_by_year table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deduction_method_by_year (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,

  -- Tax year and method
  tax_year INTEGER NOT NULL CHECK (tax_year >= 2020 AND tax_year <= 2100),
  method VARCHAR(20) NOT NULL CHECK (method IN ('standard_mileage', 'actual_expense')),

  -- Ensure one method per vehicle per year
  UNIQUE(car_id, tax_year),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_deduction_method_car_id ON public.deduction_method_by_year(car_id);
CREATE INDEX IF NOT EXISTS idx_deduction_method_car_year ON public.deduction_method_by_year(car_id, tax_year DESC);
CREATE INDEX IF NOT EXISTS idx_deduction_method_user_id ON public.deduction_method_by_year(user_id);
CREATE INDEX IF NOT EXISTS idx_deduction_method_year ON public.deduction_method_by_year(tax_year DESC);

-- Enable Row Level Security
ALTER TABLE public.deduction_method_by_year ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own deduction methods

-- SELECT: Users can view only their own methods
CREATE POLICY "users_select_own_deduction_methods"
  ON public.deduction_method_by_year
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- INSERT: Users can only create methods for themselves
CREATE POLICY "users_insert_own_deduction_methods"
  ON public.deduction_method_by_year
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own methods
CREATE POLICY "users_update_own_deduction_methods"
  ON public.deduction_method_by_year
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own methods
CREATE POLICY "users_delete_own_deduction_methods"
  ON public.deduction_method_by_year
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_deduction_method_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deduction_method_updated_at
  BEFORE UPDATE ON public.deduction_method_by_year
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deduction_method_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.deduction_method_by_year IS 'Tracks IRS deduction method choice per vehicle per tax year (prevents mid-year switching)';
COMMENT ON COLUMN public.deduction_method_by_year.tax_year IS 'Tax year (e.g., 2025)';
COMMENT ON COLUMN public.deduction_method_by_year.method IS 'IRS deduction method: standard_mileage or actual_expense';

-- ============================================================================
-- 4. Create function to automatically record business use history changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_business_use_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if business_use_percentage changed
  IF (TG_OP = 'INSERT') OR (OLD.business_use_percentage IS DISTINCT FROM NEW.business_use_percentage) THEN
    INSERT INTO public.business_use_history (
      user_id,
      car_id,
      effective_date,
      business_use_percentage,
      reason
    ) VALUES (
      NEW.user_id,
      NEW.id,
      COALESCE(NEW.business_use_start_date, CURRENT_DATE),
      NEW.business_use_percentage,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Initial business use setting'
        ELSE 'Business use percentage changed'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically record business use changes
CREATE TRIGGER trigger_record_business_use_change
  AFTER INSERT OR UPDATE OF business_use_percentage ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.record_business_use_change();

COMMENT ON FUNCTION public.record_business_use_change() IS 'Automatically records business use percentage changes to history table';
