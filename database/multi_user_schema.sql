-- FleetSync Multi-User Team Schema Design
-- Simple model: primary_user (owner) + invited_users (team members)
-- Designed for small contractors: owner + office staff + drivers

-- 1. Extend existing user profiles for team management
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'personal';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS max_vehicles INTEGER DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS max_invited_users INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_primary_user BOOLEAN DEFAULT true;

-- 2. Create invited users table (team members)
CREATE TABLE IF NOT EXISTS invited_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    can_edit BOOLEAN DEFAULT false,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    auth_user_id UUID REFERENCES auth.users(id), -- Set when they accept invite
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(primary_user_id, invited_email)
);

-- 3. Create team permissions view for easy access control
CREATE OR REPLACE VIEW team_members AS
SELECT
    u.id as user_id,
    u.email,
    p.id as primary_user_id,
    CASE
        WHEN u.id = p.id THEN true  -- Primary user is always owner
        ELSE COALESCE(iu.can_edit, false)  -- Invited user permissions
    END as can_edit,
    CASE
        WHEN u.id = p.id THEN 'owner'
        WHEN iu.id IS NOT NULL THEN 'team_member'
        ELSE 'none'
    END as role
FROM auth.users u
CROSS JOIN user_profiles p
LEFT JOIN invited_users iu ON iu.auth_user_id = u.id AND iu.primary_user_id = p.user_id
WHERE u.id = p.user_id OR iu.id IS NOT NULL;

-- 4. Update RLS policies to support team access
-- Cars: Team members can view, only editors can modify
DROP POLICY IF EXISTS "Users can view cars in their team" ON cars;
CREATE POLICY "Users can view cars in their team" ON cars
    FOR SELECT USING (
        owner_id IN (
            SELECT primary_user_id FROM team_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team editors can insert cars" ON cars;
CREATE POLICY "Team editors can insert cars" ON cars
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT primary_user_id FROM team_members
            WHERE user_id = auth.uid() AND can_edit = true
        )
    );

DROP POLICY IF EXISTS "Team editors can update cars" ON cars;
CREATE POLICY "Team editors can update cars" ON cars
    FOR UPDATE USING (
        owner_id IN (
            SELECT primary_user_id FROM team_members
            WHERE user_id = auth.uid() AND can_edit = true
        )
    );

-- 5. Similar RLS updates for fill_ups (via car ownership)
DROP POLICY IF EXISTS "Team members can view fill ups" ON fill_ups;
CREATE POLICY "Team members can view fill ups" ON fill_ups
    FOR SELECT USING (
        car_id IN (
            SELECT c.id FROM cars c
            WHERE c.owner_id IN (
                SELECT primary_user_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Team editors can insert fill ups" ON fill_ups;
CREATE POLICY "Team editors can insert fill ups" ON fill_ups
    FOR INSERT WITH CHECK (
        car_id IN (
            SELECT c.id FROM cars c
            WHERE c.owner_id IN (
                SELECT primary_user_id FROM team_members
                WHERE user_id = auth.uid() AND can_edit = true
            )
        )
    );

-- 6. Similar RLS updates for maintenance_records
DROP POLICY IF EXISTS "Team members can view maintenance records" ON maintenance_records;
CREATE POLICY "Team members can view maintenance records" ON maintenance_records
    FOR SELECT USING (
        car_id IN (
            SELECT c.id FROM cars c
            WHERE c.owner_id IN (
                SELECT primary_user_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Team editors can insert maintenance records" ON maintenance_records;
CREATE POLICY "Team editors can insert maintenance records" ON maintenance_records
    FOR INSERT WITH CHECK (
        car_id IN (
            SELECT c.id FROM cars c
            WHERE c.owner_id IN (
                SELECT primary_user_id FROM team_members
                WHERE user_id = auth.uid() AND can_edit = true
            )
        )
    );

-- 7. Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(primary_user_id UUID)
RETURNS TABLE(
    current_vehicles INTEGER,
    max_vehicles INTEGER,
    current_users INTEGER,
    max_users INTEGER,
    can_add_vehicle BOOLEAN,
    can_add_user BOOLEAN
) AS $$
DECLARE
    profile user_profiles%ROWTYPE;
    vehicle_count INTEGER;
    user_count INTEGER;
BEGIN
    -- Get user profile with limits
    SELECT * INTO profile FROM user_profiles WHERE user_id = primary_user_id;

    -- Count current vehicles
    SELECT COUNT(*) INTO vehicle_count FROM cars WHERE owner_id = primary_user_id;

    -- Count current team members (including primary user)
    SELECT COUNT(*) INTO user_count
    FROM (
        SELECT 1 WHERE primary_user_id IS NOT NULL  -- Primary user
        UNION
        SELECT 1 FROM invited_users WHERE primary_user_id = check_subscription_limits.primary_user_id
    ) AS team_count;

    RETURN QUERY SELECT
        vehicle_count,
        profile.max_vehicles,
        user_count,
        profile.max_invited_users + 1, -- +1 for primary user
        vehicle_count < profile.max_vehicles,
        user_count <= profile.max_invited_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Set subscription plans for existing users (migration)
UPDATE user_profiles SET
    subscription_plan = 'personal',
    max_vehicles = 1,
    max_invited_users = 0
WHERE subscription_plan IS NULL;

-- 9. Grant permissions
GRANT SELECT ON invited_users TO anon, authenticated;
GRANT INSERT, UPDATE ON invited_users TO authenticated;
GRANT SELECT ON team_members TO authenticated;

-- Enable RLS
ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;

-- RLS for invited_users table
CREATE POLICY "Users can manage their team invitations" ON invited_users
    FOR ALL USING (
        primary_user_id = auth.uid() OR
        auth_user_id = auth.uid()
    );

-- Comments for documentation
COMMENT ON TABLE invited_users IS 'Team members invited by primary users (business owners)';
COMMENT ON VIEW team_members IS 'Unified view of all team members with their permissions';
COMMENT ON FUNCTION check_subscription_limits IS 'Validates subscription limits for vehicles and users';