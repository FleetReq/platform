-- Fix: Remove the empty org created by self-healing, so next request
-- reconnects Bruce to his original org (the one with his cars).
--
-- Run this in Supabase SQL Editor.

-- Step 1: Find the empty org (the one with no cars)
-- and the original org (the one with Bruce's cars)
DO $$
DECLARE
  v_admin_id uuid := 'b73a07b2-ed72-41b1-943f-e119afc9eddb';
  v_old_org_id uuid;
  v_new_org_id uuid;
BEGIN
  -- Find the org that has Bruce's cars
  SELECT DISTINCT org_id INTO v_old_org_id
  FROM cars
  WHERE user_id = v_admin_id
  LIMIT 1;

  -- Find the org from Bruce's current membership that has NO cars
  SELECT om.org_id INTO v_new_org_id
  FROM org_members om
  WHERE om.user_id = v_admin_id
    AND om.org_id != v_old_org_id;

  RAISE NOTICE 'Old org (has cars): %', v_old_org_id;
  RAISE NOTICE 'New empty org to delete: %', v_new_org_id;

  -- Delete the empty org (CASCADE will remove the org_members row too)
  IF v_new_org_id IS NOT NULL THEN
    DELETE FROM organizations WHERE id = v_new_org_id;
    RAISE NOTICE 'Deleted empty org %', v_new_org_id;
  ELSE
    RAISE NOTICE 'No empty org found — may already be fixed';
  END IF;

  -- Also delete any remaining org_members for Bruce (the self-healing will recreate)
  DELETE FROM org_members WHERE user_id = v_admin_id;
  RAISE NOTICE 'Cleared all org_members for admin — self-healing will reconnect on next request';
END $$;
