-- Fix security warning: Set search_path for handle_new_user function
-- This prevents schema injection attacks

-- Drop trigger first, then function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function with fixed search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, subscription_plan, max_vehicles, max_invited_users)
  VALUES (NEW.id, 'free', 1, 0)
  ON CONFLICT (id) DO UPDATE
  SET subscription_plan = COALESCE(user_profiles.subscription_plan, 'free');
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the fix
SELECT
  proname as function_name,
  proconfig as search_path_config
FROM pg_proc
WHERE proname = 'handle_new_user';
