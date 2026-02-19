import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { isAdmin, PLAN_LIMITS } from '@/lib/constants'

export type OrgRole = 'owner' | 'editor' | 'viewer'

export interface OrgMembership {
  org_id: string
  role: OrgRole
}

export interface OrgMembershipWithDetails extends OrgMembership {
  org_name: string
  subscription_plan: 'free' | 'personal' | 'business'
}

export interface OrgDetails {
  id: string
  name: string
  slug: string | null
  subscription_plan: 'free' | 'personal' | 'business'
  max_vehicles: number
  max_members: number
  stripe_customer_id: string | null
  subscription_end_date: string | null
  cancellation_requested_at: string | null
  scheduled_deletion_date: string | null
  pending_downgrade_tier: string | null
  downgrade_effective_date: string | null
  downgrade_requested_at: string | null
}

/**
 * Get ALL org memberships for a user (for the org switcher).
 */
export async function getUserOrgs(
  supabase: SupabaseClient,
  userId: string
): Promise<OrgMembershipWithDetails[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(name, subscription_plan)')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const org = row.organizations as { name: string; subscription_plan: string } | null
    return {
      org_id: row.org_id as string,
      role: row.role as OrgRole,
      org_name: org?.name || 'Unknown',
      subscription_plan: (org?.subscription_plan as 'free' | 'personal' | 'business') || 'free',
    }
  })
}

/**
 * Get the user's organization membership (org_id + role).
 * If activeOrgId is provided, verifies membership in that specific org.
 * Falls back to first membership if no activeOrgId or membership not found.
 */
export async function getUserOrg(
  supabase: SupabaseClient,
  userId: string,
  activeOrgId?: string | null
): Promise<OrgMembership | null> {
  // If activeOrgId specified, try to get that specific membership
  if (activeOrgId) {
    const { data, error } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .eq('org_id', activeOrgId)
      .limit(1)
      .single()

    if (!error && data) {
      return { org_id: data.org_id, role: data.role as OrgRole }
    }
    // Fall through to default if membership not found for that org
  }

  // Default: return first membership
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (error || !data) return null
  return { org_id: data.org_id, role: data.role as OrgRole }
}

/**
 * Get full organization details by org ID.
 */
export async function getOrgDetails(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgDetails | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error || !data) return null
  return data as OrgDetails
}

/**
 * Get the subscription plan for a user's organization.
 * Admins always return 'business'.
 */
export async function getOrgSubscriptionPlan(
  supabase: SupabaseClient,
  userId: string,
  activeOrgId?: string | null
): Promise<'free' | 'personal' | 'business'> {
  if (isAdmin(userId)) return 'business'

  const membership = await getUserOrg(supabase, userId, activeOrgId)
  if (!membership) return 'free'

  const { data, error } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', membership.org_id)
    .single()

  if (error || !data) return 'free'
  return (data.subscription_plan as 'free' | 'personal' | 'business') || 'free'
}

/**
 * Get max vehicles allowed for a user's organization.
 * Admins always return 999.
 */
export async function getOrgMaxVehicles(
  supabase: SupabaseClient,
  userId: string,
  activeOrgId?: string | null
): Promise<number> {
  if (isAdmin(userId)) return 999

  const membership = await getUserOrg(supabase, userId, activeOrgId)
  if (!membership) return 1

  const { data, error } = await supabase
    .from('organizations')
    .select('max_vehicles')
    .eq('id', membership.org_id)
    .single()

  if (error || !data) return 1
  return data.max_vehicles || 1
}

/**
 * Check if user can edit (editor or owner role).
 * Admins always return true.
 */
export async function canEdit(
  supabase: SupabaseClient,
  userId: string,
  activeOrgId?: string | null
): Promise<boolean> {
  if (isAdmin(userId)) return true

  const membership = await getUserOrg(supabase, userId, activeOrgId)
  if (!membership) return false
  return membership.role === 'owner' || membership.role === 'editor'
}

/**
 * Check if user is the org owner.
 * Admins always return true.
 */
export async function isOrgOwner(
  supabase: SupabaseClient,
  userId: string,
  activeOrgId?: string | null
): Promise<boolean> {
  if (isAdmin(userId)) return true

  const membership = await getUserOrg(supabase, userId, activeOrgId)
  if (!membership) return false
  return membership.role === 'owner'
}

/**
 * Verify a user has access to a specific car through their org membership.
 * Returns org membership info and access flags.
 */
export async function verifyCarAccess(
  supabase: SupabaseClient,
  userId: string,
  carId: string,
  activeOrgId?: string | null
): Promise<{ hasAccess: boolean; canEdit: boolean; isOwner: boolean; orgId: string | null }> {
  if (isAdmin(userId)) {
    // Admin bypass: just check the car exists
    const { data: car } = await supabase.from('cars').select('org_id').eq('id', carId).single()
    return { hasAccess: !!car, canEdit: true, isOwner: true, orgId: car?.org_id || null }
  }

  const membership = await getUserOrg(supabase, userId, activeOrgId)
  if (!membership) return { hasAccess: false, canEdit: false, isOwner: false, orgId: null }

  // Check if the car belongs to the user's org
  const { data: car, error } = await supabase
    .from('cars')
    .select('id')
    .eq('id', carId)
    .eq('org_id', membership.org_id)
    .single()

  if (error || !car) return { hasAccess: false, canEdit: false, isOwner: false, orgId: membership.org_id }

  return {
    hasAccess: true,
    canEdit: membership.role === 'owner' || membership.role === 'editor',
    isOwner: membership.role === 'owner',
    orgId: membership.org_id,
  }
}

/**
 * Self-healing: reconnect a user to their existing org, or create a new one.
 * Uses service role client to bypass RLS.
 *
 * Priority:
 * 1. Find an existing org that already has this user's cars (reconnect)
 * 2. If no existing org found, create a new one
 */
export async function ensureUserHasOrg(userId: string): Promise<OrgMembership | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('ensureUserHasOrg: missing SUPABASE_SERVICE_ROLE_KEY')
    return null
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // --- Priority 1: Reconnect to existing org that has this user's cars ---
  const { data: existingCar } = await adminClient
    .from('cars')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (existingCar?.org_id) {
    // Found an existing org with the user's data — just add membership
    const { error: memberError } = await adminClient
      .from('org_members')
      .insert({
        org_id: existingCar.org_id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      })

    if (!memberError) {
      console.error(`ensureUserHasOrg: reconnected user ${userId} to existing org ${existingCar.org_id} (missing membership record)`)
      return { org_id: existingCar.org_id, role: 'owner' }
    }
    // If insert failed (e.g. duplicate), try to read existing membership
    const { data: existing } = await adminClient
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .eq('org_id', existingCar.org_id)
      .single()
    if (existing) {
      return { org_id: existing.org_id, role: existing.role as OrgRole }
    }
  }

  // --- Priority 2: Create a new org ---
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  let orgName = 'My Organization'
  if (profile?.full_name) {
    const parts = profile.full_name.trim().split(/\s+/)
    if (parts.length >= 2) {
      orgName = `${parts[0]} ${parts[parts.length - 1][0]}.'s Organization`
    } else {
      orgName = `${parts[0]}'s Organization`
    }
  } else if (profile?.email) {
    const local = profile.email.split('@')[0]
    orgName = `${local}'s Organization`
  }

  const admin = isAdmin(userId)
  const plan = admin ? 'business' : 'free'
  const { maxVehicles, maxMembers } = PLAN_LIMITS[plan]

  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name: orgName,
      subscription_plan: plan,
      max_vehicles: maxVehicles,
      max_members: maxMembers,
    })
    .select('id')
    .single()

  if (orgError || !org) {
    console.error('ensureUserHasOrg: failed to create org', orgError)
    return null
  }

  const { error: memberError } = await adminClient
    .from('org_members')
    .insert({
      org_id: org.id,
      user_id: userId,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    })

  if (memberError) {
    console.error('ensureUserHasOrg: failed to create membership', memberError)
    await adminClient.from('organizations').delete().eq('id', org.id)
    return null
  }

  return { org_id: org.id, role: 'owner' }
}
