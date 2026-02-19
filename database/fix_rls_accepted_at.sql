-- ============================================================
-- FIX: RLS Helper Functions - require accepted_at IS NOT NULL
-- FIX: user_profiles INSERT policy - remove anon bypass
-- ============================================================
-- Issue A: All three RLS helper functions (user_org_ids, user_editor_org_ids,
--           user_owner_org_ids) did not filter on accepted_at IS NOT NULL.
--           A user_id-linked row without accepted_at would bypass invite-acceptance
--           gating at the RLS layer, giving unaccepted-invite users data access.
--
-- Issue B: The user_profiles INSERT policy included `OR auth.uid() IS NULL`,
--           allowing unauthenticated inserts. The handle_new_user() trigger is
--           SECURITY DEFINER and bypasses RLS entirely, so this clause is
--           unnecessary and creates a potential unauthenticated insert path.
-- ============================================================

-- ============================================================
-- ISSUE A: Fix RLS helper functions to require accepted_at
-- ============================================================

CREATE OR REPLACE FUNCTION user_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_editor_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'editor')
    AND accepted_at IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_owner_org_ids() RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid()
    AND role = 'owner'
    AND accepted_at IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ISSUE B: Fix user_profiles INSERT policy
-- Remove the `OR auth.uid() IS NULL` clause — the handle_new_user()
-- trigger is SECURITY DEFINER and bypasses RLS, so it does not need this.
-- ============================================================

DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;

CREATE POLICY "user_profiles_insert_policy"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
