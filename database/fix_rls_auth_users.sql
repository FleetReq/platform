-- Fix: The users_can_view_own_invites policy on org_members queries auth.users
-- directly, which the authenticated role doesn't have access to.
-- Replace with auth.email() which is a SECURITY DEFINER function.
--
-- Run in Supabase SQL Editor.

DROP POLICY IF EXISTS "users_can_view_own_invites" ON org_members;

CREATE POLICY "users_can_view_own_invites" ON org_members
  FOR SELECT USING (
    invited_email = auth.email()
    AND user_id IS NULL
  );
