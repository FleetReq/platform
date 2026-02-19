-- FleetReq Multi-Tenancy: Organization-Based Architecture
-- Run this migration in Supabase SQL Editor with service_role
--
-- Phase 1A: New tables (organizations, org_members)
-- Phase 1B: Alter existing tables (cars.org_id)
-- Phase 1C: Update handle_new_user() trigger
-- Phase 1D: Data migration (backfill existing users)
-- Phase 1E: Swap RLS policies
--
-- IMPORTANT: Run each section sequentially. Verify between sections.

-- ============================================================
-- PHASE 1A: NEW TABLES
-- ============================================================

-- Organizations table
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Organization',
  slug text NULL,

  -- Subscription / billing (moved from user_profiles)
  subscription_plan text NOT NULL DEFAULT 'free'::text,
  max_vehicles integer NOT NULL DEFAULT 1,
  max_members integer NOT NULL DEFAULT 1,
  stripe_customer_id text NULL,
  subscription_start_date timestamp without time zone NULL,
  current_tier_start_date timestamp without time zone NULL,
  subscription_end_date timestamp with time zone NULL,
  cancellation_requested_at timestamp with time zone NULL,
  scheduled_deletion_date timestamp with time zone NULL,
  cancellation_reason text NULL,
  pending_downgrade_tier text NULL,
  downgrade_effective_date timestamp with time zone NULL,
  downgrade_requested_at timestamp with time zone NULL,

  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_slug_key UNIQUE (slug),
  CONSTRAINT organizations_subscription_plan_check CHECK (
    subscription_plan = ANY (ARRAY['free'::text, 'personal'::text, 'business'::text])
  ),
  CONSTRAINT organizations_pending_downgrade_tier_check CHECK (
    pending_downgrade_tier IN ('free', 'personal')
  )
);

-- Indexes
CREATE INDEX idx_organizations_stripe_customer_id ON organizations (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Org members table
CREATE TABLE public.org_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NULL,
  role text NOT NULL DEFAULT 'viewer'::text,
  invited_email text NULL,
  invited_at timestamp with time zone NULL,
  accepted_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT org_members_pkey PRIMARY KEY (id),
  CONSTRAINT org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT org_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT org_members_role_check CHECK (role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text]))
);

-- Unique indexes
CREATE UNIQUE INDEX idx_org_members_org_user ON org_members (org_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_org_members_org_email ON org_members (org_id, invited_email) WHERE invited_email IS NOT NULL;

-- Lookup indexes
CREATE INDEX idx_org_members_user_id ON org_members (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_org_members_invited_email ON org_members (invited_email) WHERE invited_email IS NOT NULL;

-- RLS helper function: returns org IDs the current user belongs to
CREATE OR REPLACE FUNCTION user_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS helper function: returns org IDs where user has editor or owner role
CREATE OR REPLACE FUNCTION user_editor_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS helper function: returns org IDs where user is owner
CREATE OR REPLACE FUNCTION user_owner_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role = 'owner'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Organizations RLS: members can SELECT, owners can UPDATE
CREATE POLICY "org_members_can_view_org" ON organizations
  FOR SELECT USING (id IN (SELECT user_org_ids()));

CREATE POLICY "org_owners_can_update_org" ON organizations
  FOR UPDATE USING (id IN (SELECT user_owner_org_ids()));

-- Org members RLS
CREATE POLICY "org_members_can_view_members" ON org_members
  FOR SELECT USING (org_id IN (SELECT user_org_ids()));

-- Allow users to see their own pending invites (matched by email)
CREATE POLICY "users_can_view_own_invites" ON org_members
  FOR SELECT USING (
    invited_email = auth.email()
    AND user_id IS NULL
  );

CREATE POLICY "org_owners_can_insert_members" ON org_members
  FOR INSERT WITH CHECK (org_id IN (SELECT user_owner_org_ids()));

CREATE POLICY "org_owners_can_update_members" ON org_members
  FOR UPDATE USING (org_id IN (SELECT user_owner_org_ids()));

-- Allow invited users to accept their own invite
CREATE POLICY "users_can_accept_own_invite" ON org_members
  FOR UPDATE USING (
    invited_email = auth.email()
    AND user_id IS NULL
  );

CREATE POLICY "org_owners_can_delete_members" ON org_members
  FOR DELETE USING (org_id IN (SELECT user_owner_org_ids()));

-- Grant permissions
GRANT SELECT ON organizations TO authenticated;
GRANT UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON org_members TO authenticated;

-- ============================================================
-- PHASE 1B: ALTER EXISTING TABLES
-- ============================================================

-- Add org_id to cars (nullable during migration, will be set NOT NULL after backfill)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS org_id uuid NULL;
ALTER TABLE cars ADD CONSTRAINT cars_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations (id) ON DELETE CASCADE;
CREATE INDEX idx_cars_org_id ON cars (org_id) WHERE org_id IS NOT NULL;

-- ============================================================
-- PHASE 1C: UPDATE handle_new_user() TRIGGER
-- ============================================================

-- Replace the trigger function to also create org + membership
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  user_name text;
BEGIN
  -- Extract display name from metadata, fallback to email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create user profile (existing behavior)
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  -- Create organization for new user
  INSERT INTO public.organizations (id, name, subscription_plan, max_vehicles, max_members)
  VALUES (gen_random_uuid(), user_name || '''s Organization', 'free', 1, 1)
  RETURNING id INTO new_org_id;

  -- Create org membership (owner)
  INSERT INTO public.org_members (org_id, user_id, role, accepted_at)
  VALUES (new_org_id, NEW.id, 'owner', now());

  RETURN NEW;
END;
$$;

-- ============================================================
-- PHASE 1D: DATA MIGRATION (backfill existing users)
-- ============================================================

-- Create orgs for all existing users who don't have one yet
DO $$
DECLARE
  user_rec RECORD;
  new_org_id uuid;
  org_name text;
  plan text;
  max_v int;
  max_m int;
BEGIN
  FOR user_rec IN
    SELECT
      up.id,
      up.email,
      up.full_name,
      up.subscription_plan,
      up.max_vehicles,
      up.stripe_customer_id,
      up.subscription_start_date,
      up.current_tier_start_date,
      up.subscription_end_date,
      up.cancellation_requested_at,
      up.scheduled_deletion_date,
      up.cancellation_reason,
      up.pending_downgrade_tier,
      up.downgrade_effective_date,
      up.downgrade_requested_at
    FROM user_profiles up
    WHERE NOT EXISTS (
      SELECT 1 FROM org_members om WHERE om.user_id = up.id
    )
  LOOP
    -- Determine org name
    org_name := COALESCE(user_rec.full_name, split_part(user_rec.email, '@', 1), 'My') || '''s Organization';

    -- Determine max_members based on plan
    plan := COALESCE(user_rec.subscription_plan, 'free');
    max_v := COALESCE(user_rec.max_vehicles, 1);
    CASE plan
      WHEN 'free' THEN max_m := 1;
      WHEN 'personal' THEN max_m := 3;
      WHEN 'business' THEN max_m := 6;
      ELSE max_m := 1;
    END CASE;

    -- Create organization with billing data from user_profiles
    INSERT INTO organizations (
      name, subscription_plan, max_vehicles, max_members,
      stripe_customer_id, subscription_start_date, current_tier_start_date,
      subscription_end_date, cancellation_requested_at, scheduled_deletion_date,
      cancellation_reason, pending_downgrade_tier, downgrade_effective_date,
      downgrade_requested_at
    ) VALUES (
      org_name, plan, max_v, max_m,
      user_rec.stripe_customer_id, user_rec.subscription_start_date,
      user_rec.current_tier_start_date, user_rec.subscription_end_date,
      user_rec.cancellation_requested_at, user_rec.scheduled_deletion_date,
      user_rec.cancellation_reason, user_rec.pending_downgrade_tier,
      user_rec.downgrade_effective_date, user_rec.downgrade_requested_at
    )
    RETURNING id INTO new_org_id;

    -- Create membership
    INSERT INTO org_members (org_id, user_id, role, accepted_at)
    VALUES (new_org_id, user_rec.id, 'owner', now());

    -- Set org_id on all user's cars
    UPDATE cars SET org_id = new_org_id WHERE user_id = user_rec.id;

    RAISE NOTICE 'Migrated user % (%) → org %', user_rec.id, user_rec.email, new_org_id;
  END LOOP;
END;
$$;

-- Verify: every car should have an org_id now
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cars WHERE org_id IS NULL) THEN
    RAISE EXCEPTION 'Migration incomplete: some cars still have NULL org_id';
  END IF;
END;
$$;

-- Now make org_id NOT NULL
ALTER TABLE cars ALTER COLUMN org_id SET NOT NULL;

-- ============================================================
-- PHASE 1E: SWAP RLS POLICIES
-- ============================================================

-- === CARS ===
-- Drop old user_id-based policies
DROP POLICY IF EXISTS "users_select_own_cars" ON cars;
DROP POLICY IF EXISTS "users_insert_own_cars" ON cars;
DROP POLICY IF EXISTS "users_update_own_cars" ON cars;
DROP POLICY IF EXISTS "users_delete_own_cars" ON cars;
-- Also drop old team-based policies if they exist
DROP POLICY IF EXISTS "Users can view cars in their team" ON cars;
DROP POLICY IF EXISTS "Team editors can insert cars" ON cars;
DROP POLICY IF EXISTS "Team editors can update cars" ON cars;

-- New org-based policies for cars
CREATE POLICY "org_members_select_cars" ON cars
  FOR SELECT USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "org_editors_insert_cars" ON cars
  FOR INSERT WITH CHECK (org_id IN (SELECT user_editor_org_ids()));

CREATE POLICY "org_editors_update_cars" ON cars
  FOR UPDATE USING (org_id IN (SELECT user_editor_org_ids()));

CREATE POLICY "org_owners_delete_cars" ON cars
  FOR DELETE USING (org_id IN (SELECT user_owner_org_ids()));

-- === FILL_UPS ===
-- Drop old policies
DROP POLICY IF EXISTS "Users can view fill-ups for their cars or records they created" ON fill_ups;
DROP POLICY IF EXISTS "Users can insert own fill-ups" ON fill_ups;
DROP POLICY IF EXISTS "Users can update own fill-ups" ON fill_ups;
DROP POLICY IF EXISTS "Users can delete own fill-ups" ON fill_ups;
-- Drop old team-based policies if they exist
DROP POLICY IF EXISTS "Team members can view fill ups" ON fill_ups;
DROP POLICY IF EXISTS "Team editors can insert fill ups" ON fill_ups;

-- New org-based policies for fill_ups (through car → org)
CREATE POLICY "org_members_select_fill_ups" ON fill_ups
  FOR SELECT USING (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_org_ids()))
  );

CREATE POLICY "org_editors_insert_fill_ups" ON fill_ups
  FOR INSERT WITH CHECK (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_editor_org_ids()))
  );

CREATE POLICY "org_editors_update_fill_ups" ON fill_ups
  FOR UPDATE USING (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_editor_org_ids()))
  );

CREATE POLICY "org_owners_delete_fill_ups" ON fill_ups
  FOR DELETE USING (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_owner_org_ids()))
  );

-- === MAINTENANCE_RECORDS ===
-- Drop old policies
DROP POLICY IF EXISTS "Users can view maintenance records for their cars or records th..." ON maintenance_records;
DROP POLICY IF EXISTS "Users can insert own maintenance records" ON maintenance_records;
DROP POLICY IF EXISTS "Users can update own maintenance records" ON maintenance_records;
DROP POLICY IF EXISTS "Users can delete own maintenance records" ON maintenance_records;
-- Drop old team-based policies if they exist
DROP POLICY IF EXISTS "Team members can view maintenance records" ON maintenance_records;
DROP POLICY IF EXISTS "Team editors can insert maintenance records" ON maintenance_records;

-- New org-based policies for maintenance_records (through car → org)
CREATE POLICY "org_members_select_maintenance" ON maintenance_records
  FOR SELECT USING (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_org_ids()))
  );

CREATE POLICY "org_editors_insert_maintenance" ON maintenance_records
  FOR INSERT WITH CHECK (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_editor_org_ids()))
  );

CREATE POLICY "org_editors_update_maintenance" ON maintenance_records
  FOR UPDATE USING (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_editor_org_ids()))
  );

CREATE POLICY "org_owners_delete_maintenance" ON maintenance_records
  FOR DELETE USING (
    car_id IN (SELECT id FROM cars WHERE org_id IN (SELECT user_owner_org_ids()))
  );

-- === STORAGE: RECEIPTS ===
-- Note: Storage policies use path convention {org_id}/... instead of {user_id}/...
-- Update these manually in Supabase dashboard if bucket policies exist:
--   (storage.foldername(name))[1] IN (SELECT user_org_ids()::text)

-- ============================================================
-- VERIFICATION QUERIES (run these to check migration success)
-- ============================================================

-- Check every user has exactly 1 org membership
-- SELECT up.id, up.email, COUNT(om.id) as membership_count
-- FROM user_profiles up
-- LEFT JOIN org_members om ON om.user_id = up.id
-- GROUP BY up.id, up.email
-- HAVING COUNT(om.id) != 1;

-- Check every car has a valid org_id
-- SELECT c.id, c.org_id FROM cars c WHERE c.org_id IS NULL;

-- Check org billing data matches user_profiles
-- SELECT up.id, up.stripe_customer_id as up_stripe, o.stripe_customer_id as org_stripe
-- FROM user_profiles up
-- JOIN org_members om ON om.user_id = up.id
-- JOIN organizations o ON o.id = om.org_id
-- WHERE up.stripe_customer_id IS DISTINCT FROM o.stripe_customer_id;
