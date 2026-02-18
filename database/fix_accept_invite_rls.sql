-- Fix: users_can_accept_own_invite queries auth.users directly,
-- which the authenticated role cannot access.
-- Same root cause as fix_rls_auth_users.sql (users_can_view_own_invites).
-- Replace with auth.email() which is a SECURITY DEFINER function.
--
-- Run in Supabase SQL Editor.

DROP POLICY IF EXISTS "users_can_accept_own_invite" ON org_members;

CREATE POLICY "users_can_accept_own_invite" ON org_members
  FOR UPDATE USING (
    invited_email = auth.email()
    AND user_id IS NULL
  );
