import { SupabaseClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/supabase-client'

export type OrgRole = 'owner' | 'editor' | 'viewer'

export interface OrgMembership {
  org_id: string
  role: OrgRole
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
 * Get the user's organization membership (org_id + role).
 * Returns null if user has no membership.
 */
export async function getUserOrg(
  supabase: SupabaseClient,
  userId: string
): Promise<OrgMembership | null> {
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
  userId: string
): Promise<'free' | 'personal' | 'business'> {
  if (isAdmin(userId)) return 'business'

  const membership = await getUserOrg(supabase, userId)
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
  userId: string
): Promise<number> {
  if (isAdmin(userId)) return 999

  const membership = await getUserOrg(supabase, userId)
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
  userId: string
): Promise<boolean> {
  if (isAdmin(userId)) return true

  const membership = await getUserOrg(supabase, userId)
  if (!membership) return false
  return membership.role === 'owner' || membership.role === 'editor'
}

/**
 * Check if user is the org owner.
 * Admins always return true.
 */
export async function isOrgOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (isAdmin(userId)) return true

  const membership = await getUserOrg(supabase, userId)
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
  carId: string
): Promise<{ hasAccess: boolean; canEdit: boolean; isOwner: boolean; orgId: string | null }> {
  if (isAdmin(userId)) {
    // Admin bypass: just check the car exists
    const { data: car } = await supabase.from('cars').select('org_id').eq('id', carId).single()
    return { hasAccess: !!car, canEdit: true, isOwner: true, orgId: car?.org_id || null }
  }

  const membership = await getUserOrg(supabase, userId)
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
