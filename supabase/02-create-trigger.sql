-- Step 2: Create trigger for automatic user profile creation
-- Run this AFTER creating the user_profiles table

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, subscription_plan, max_vehicles, max_invited_users)
  VALUES (NEW.id, 'free', 1, 0)
  ON CONFLICT (id) DO UPDATE
  SET subscription_plan = COALESCE(user_profiles.subscription_plan, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
