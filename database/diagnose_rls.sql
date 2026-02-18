-- Diagnostic: figure out why org_members RLS is blocking authenticated users
-- Run in Supabase SQL Editor

-- 1. Is RLS enabled on org_members?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'org_members';

-- 2. What SELECT policies exist on org_members?
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'org_members' AND cmd = 'SELECT';

-- 3. Does the user_org_ids() function exist and what's its owner/security?
SELECT p.proname AS function_name,
       r.rolname AS owner,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'user_org_ids';

-- 4. Test: does user_org_ids() work for the admin user?
-- (This runs as service role, so we need to SET the JWT claim to simulate)
SET request.jwt.claims = '{"sub": "b73a07b2-ed72-41b1-943f-e119afc9eddb"}';
SELECT * FROM user_org_ids();
RESET request.jwt.claims;

-- 5. Verify the org_members rows actually exist
SELECT id, org_id, user_id, role, accepted_at
FROM org_members
WHERE user_id = 'b73a07b2-ed72-41b1-943f-e119afc9eddb';

-- 6. Check if auth.uid() function exists and works
SELECT auth.uid();
