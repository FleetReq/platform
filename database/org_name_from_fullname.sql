-- ============================================================
-- MIGRATION: Better org names from user's full name
-- Date: 2026-02-16
-- ============================================================
-- Changes:
-- 1. Updates handle_new_user() to generate "First L.'s Organization" format
-- 2. Populates user_profiles.full_name and email in trigger
-- 3. Fixes admin org name (one-time)
-- ============================================================

-- Replace the trigger function with smarter org name logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  user_name text;
  first_name text;
  last_part text;
  org_display text;
BEGIN
  -- Extract display name from metadata, fallback to email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Build org display name: "First L.'s Organization"
  first_name := split_part(trim(user_name), ' ', 1);

  IF first_name IS NULL OR first_name = '' THEN
    org_display := 'My Organization';
  ELSE
    last_part := split_part(trim(user_name), ' ',
      array_length(string_to_array(trim(user_name), ' '), 1));
    IF last_part IS NOT NULL AND last_part <> '' AND last_part <> first_name THEN
      org_display := first_name || ' ' || upper(left(last_part, 1)) || '.''s Organization';
    ELSE
      org_display := first_name || '''s Organization';
    END IF;
  END IF;

  -- Create user profile with name and email
  INSERT INTO public.user_profiles (id, email, full_name, subscription_plan, max_vehicles, max_invited_users)
  VALUES (NEW.id, NEW.email, user_name, 'free', 1, 0)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(user_profiles.email, EXCLUDED.email),
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
    subscription_plan = COALESCE(user_profiles.subscription_plan, 'free');

  -- Create organization for new user
  INSERT INTO public.organizations (id, name, subscription_plan, max_vehicles, max_members)
  VALUES (gen_random_uuid(), org_display, 'free', 1, 1)
  RETURNING id INTO new_org_id;

  -- Create org membership (owner)
  INSERT INTO public.org_members (org_id, user_id, role, accepted_at)
  VALUES (new_org_id, NEW.id, 'owner', now());

  RETURN NEW;
END;
$$;

-- ============================================================
-- ONE-TIME FIX: Update admin org name
-- ============================================================
UPDATE organizations SET name = 'DT''s Organization'
WHERE id = (
  SELECT org_id FROM org_members
  WHERE user_id = 'b73a07b2-ed72-41b1-943f-e119afc9eddb'
    AND role = 'owner'
  LIMIT 1
);
