-- Fix: users_can_accept_own_invite queries auth.users directly,
-- which the authenticated role cannot access.
-- Same root cause as fix_rls_auth_users.sql (users_can_view_own_invites).
-- Replace with auth.email() which is a SECURITY DEFINER function.
--
-- Run in Supabase SQL Editor.

DROP POLICY IF EXISTS "users_can_accept_own_invite" ON org_members;

-- USING: row must be a pending invite for this user (before update)
-- WITH CHECK: after setting user_id, only require email still matches
--   (omitting user_id IS NULL because it will be non-null after accept)
CREATE POLICY "users_can_accept_own_invite" ON org_members
  FOR UPDATE
  USING (
    invited_email = auth.email()
    AND user_id IS NULL
  )
  WITH CHECK (
    invited_email = auth.email()
  );
