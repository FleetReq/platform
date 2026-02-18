-- Fix: Directly reconnect Bruce to his original org (the one with his cars).
-- Deletes any empty orgs created by self-healing, then inserts the correct membership.
--
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
  v_admin_id uuid := 'b73a07b2-ed72-41b1-943f-e119afc9eddb';
  v_car_org_id uuid;
BEGIN
  -- Step 1: Find the org that has Bruce's cars
  SELECT DISTINCT org_id INTO v_car_org_id
  FROM cars
  WHERE user_id = v_admin_id
  LIMIT 1;

  RAISE NOTICE 'Org with cars: %', v_car_org_id;

  IF v_car_org_id IS NULL THEN
    RAISE NOTICE 'No cars found for admin user — nothing to reconnect';
    RETURN;
  END IF;

  -- Step 2: Delete any empty orgs (orgs Bruce owns that have zero cars)
  DELETE FROM organizations
  WHERE id IN (
    SELECT om.org_id FROM org_members om
    WHERE om.user_id = v_admin_id
      AND om.org_id != v_car_org_id
  )
  AND id NOT IN (SELECT DISTINCT org_id FROM cars WHERE org_id IS NOT NULL);

  -- Step 3: Remove all of Bruce's org_members rows
  DELETE FROM org_members WHERE user_id = v_admin_id;

  -- Step 4: Insert Bruce as owner of the correct org
  INSERT INTO org_members (org_id, user_id, role, accepted_at)
  VALUES (v_car_org_id, v_admin_id, 'owner', now());

  -- Step 5: Ensure the org has business-tier settings
  UPDATE organizations
  SET subscription_plan = 'business', max_vehicles = 999, max_members = 6
  WHERE id = v_car_org_id;

  RAISE NOTICE 'Done — Bruce is now owner of org % with business tier', v_car_org_id;
END $$;
