-- Auth Migration Strategy: GitHub to Multi-Provider
-- This script ensures admin user preservation during auth provider migration

-- Step 1: Create user profiles table for better user management
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  github_id TEXT UNIQUE, -- Store GitHub ID for migration reference
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 4: Create admin user mapping for existing owner
-- This preserves the current admin user with ID: b73a07b2-ed72-41b1-943f-e119afc9eddb
INSERT INTO user_profiles (id, email, full_name, is_admin, github_id)
VALUES (
  'b73a07b2-ed72-41b1-943f-e119afc9eddb',
  'bruce@brucetruong.com', -- Update with your actual email
  'Bruce Truong',
  TRUE,
  '12345' -- Will be updated with actual GitHub ID during migration
) ON CONFLICT (id) DO UPDATE SET
  is_admin = TRUE,
  updated_at = NOW();

-- Step 5: Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 7: Update existing tables to reference user_profiles
-- This ensures data integrity during migration
ALTER TABLE cars ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE fill_ups ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS created_by_email TEXT;

-- Step 8: Populate email fields for existing data (run after auth migration)
-- UPDATE cars SET owner_email = 'bruce@brucetruong.com'
-- WHERE user_id = 'b73a07b2-ed72-41b1-943f-e119afc9eddb';

-- Step 9: Create helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notes for implementation:
-- 1. Run this script in Supabase SQL editor
-- 2. Update bruce@brucetruong.com with your actual email
-- 3. Configure auth providers in Supabase dashboard
-- 4. Test migration with a secondary email first
-- 5. Update frontend to use new auth flow