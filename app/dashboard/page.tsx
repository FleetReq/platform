import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserOrg, getOrgDetails, ensureUserHasOrg } from '@/lib/org'
import { isAdmin, PLAN_LIMITS } from '@/lib/constants'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) redirect('/login')

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get('fleetreq-active-org')?.value ?? null

  // Get org membership, with self-healing fallback if no membership found
  let membership = await getUserOrg(supabase, user.id, activeOrgId)
  if (!membership) membership = await ensureUserHasOrg(user.id)

  const orgId = membership?.org_id ?? null

  // Get full org details (plan, max_vehicles, name) — getUserOrg only returns role
  let orgName: string | null = null
  let subscriptionPlan: 'free' | 'personal' | 'business' = 'free'
  let maxVehicles = PLAN_LIMITS.free.maxVehicles

  if (isAdmin(user.id)) {
    subscriptionPlan = 'business'
    maxVehicles = PLAN_LIMITS.business.maxVehicles
  } else if (orgId) {
    const orgDetails = await getOrgDetails(supabase, orgId)
    if (orgDetails) {
      orgName = orgDetails.name
      subscriptionPlan = orgDetails.subscription_plan
      maxVehicles = orgDetails.max_vehicles
    }
  }

  // Fetch initial data server-side (cars, fill-ups, maintenance)
  const { data: cars } = orgId
    ? await supabase.from('cars').select('*').eq('org_id', orgId).order('created_at')
    : { data: [] }

  const carIds = (cars ?? []).map((c: { id: string }) => c.id)

  const [fillUpsRes, maintenanceRes] = carIds.length > 0
    ? await Promise.all([
        supabase.from('fill_ups').select('*').in('car_id', carIds).order('date', { ascending: false }).limit(50),
        supabase.from('maintenance_records').select('*').in('car_id', carIds).order('date', { ascending: false }).limit(50),
      ])
    : [{ data: [] }, { data: [] }]

  return (
    <DashboardClient
      initialUser={user}
      initialOrgId={orgId}
      initialOrgName={orgName}
      initialOrgRole={membership?.role ?? 'viewer'}
      initialSubscriptionPlan={subscriptionPlan}
      initialMaxVehicles={maxVehicles}
      initialCars={cars ?? []}
      initialFillUps={fillUpsRes.data ?? []}
      initialMaintenanceRecords={maintenanceRes.data ?? []}
    />
  )
}
