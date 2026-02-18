-- Fix: Reconnect ALL accounts to their correct orgs.
-- For each user that has cars, ensures they have an org_members row
-- as owner of the org containing their cars.
-- Deletes any empty orgs created by self-healing.
--
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
  v_user RECORD;
  v_car_org_id uuid;
  v_fixed int := 0;
  v_deleted int := 0;
BEGIN
  -- Process every user that has at least one car
  FOR v_user IN
    SELECT DISTINCT user_id FROM cars WHERE user_id IS NOT NULL
  LOOP
    -- Find the org that has this user's cars
    SELECT DISTINCT org_id INTO v_car_org_id
    FROM cars
    WHERE user_id = v_user.user_id
    LIMIT 1;

    IF v_car_org_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Delete any empty orgs this user owns (orgs with zero cars, not the car org)
    DELETE FROM organizations
    WHERE id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = v_user.user_id
        AND om.org_id != v_car_org_id
    )
    AND id NOT IN (SELECT DISTINCT org_id FROM cars WHERE org_id IS NOT NULL);

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    -- Check if user already has membership in the correct org
    IF NOT EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = v_user.user_id AND org_id = v_car_org_id
    ) THEN
      -- Remove any stale memberships
      DELETE FROM org_members WHERE user_id = v_user.user_id;

      -- Insert correct membership
      INSERT INTO org_members (org_id, user_id, role, accepted_at)
      VALUES (v_car_org_id, v_user.user_id, 'owner', now());

      v_fixed := v_fixed + 1;
      RAISE NOTICE 'Fixed user % → org %', v_user.user_id, v_car_org_id;
    ELSE
      RAISE NOTICE 'User % already OK in org %', v_user.user_id, v_car_org_id;
    END IF;

    IF v_deleted > 0 THEN
      RAISE NOTICE '  Deleted % empty org(s)', v_deleted;
    END IF;
  END LOOP;

  RAISE NOTICE 'Done — fixed % user(s)', v_fixed;
END $$;
