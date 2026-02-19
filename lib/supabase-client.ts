import { createBrowserClient } from '@supabase/ssr'
import { isAdmin as _isAdmin, isOwner as _isOwner } from '@/lib/constants'

// Create a new Supabase client for browser use
// Call this function in each component instead of using a singleton
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Legacy export for backward compatibility (deprecated)
export const supabase = createClient()

// Database types (shared between client and server)
export interface Car {
  id: string
  user_id: string  // User who created this car
  org_id: string   // Organization this car belongs to
  make: string
  model: string
  year: number
  color?: string
  license_plate?: string
  nickname?: string
  current_mileage?: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  is_admin?: boolean
  email_notifications_enabled?: boolean
  last_notification_sent_at?: string
  created_at: string
  updated_at?: string
}

export interface FillUp {
  id: string
  car_id: string
  date: string
  odometer_reading: number
  gallons: number
  price_per_gallon?: number
  total_cost?: number
  fuel_type?: string
  gas_station?: string
  location?: string
  notes?: string
  mpg?: number
  receipt_urls?: string[]
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceRecord {
  id: string
  car_id: string
  date: string
  type: 'oil_change' | 'tire_rotation' | 'tire_change' | 'brake_pads' | 'rotors' | 'air_filter' | 'transmission_service' | 'coolant_flush' | 'wipers' | 'registration'
  oil_type?: string
  description?: string
  cost?: number
  mileage?: number
  service_provider?: string
  location?: string
  next_service_date?: string
  next_service_mileage?: number
  notes?: string
  receipt_urls?: string[]
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

// Helper functions for MPG calculation
export const calculateMPG = (miles: number, gallons: number): number => {
  return Math.round((miles / gallons) * 100) / 100
}

export const getMilesDriven = (currentOdometer: number, previousOdometer: number): number => {
  return currentOdometer - previousOdometer
}

// Read the active org ID from the cookie (client-side only)
export const getActiveOrgId = (): string | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)fleetreq-active-org=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

// Re-export from constants for backward compatibility
export const isOwner = _isOwner
export const isAdmin = _isAdmin

// ---------------------------------------------------------------------------
// Consolidated org value lookup (eliminates duplicated query pattern)
// ---------------------------------------------------------------------------

/** Columns queried from the organizations table via getOrgValue. */
interface OrgRow {
  subscription_plan: string
  max_vehicles: number
  max_members: number
}

async function getOrgValue<T>(
  userId: string,
  field: keyof OrgRow,
  defaultValue: T
): Promise<T> {
  if (!supabase) return defaultValue

  const activeOrgId = getActiveOrgId()

  // If active org cookie is set, query that specific membership
  if (activeOrgId) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .eq('org_id', activeOrgId)
      .limit(1)
      .maybeSingle()

    if (membership) {
      const { data: org } = await supabase
        .from('organizations')
        .select(field)
        .eq('id', membership.org_id)
        .maybeSingle()

      const record = org as OrgRow | null
      if (record && record[field] !== undefined) {
        return record[field] as T
      }
    }
  }

  // Fallback: first membership
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (membershipError || !membership) {
    return defaultValue
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select(field)
    .eq('id', membership.org_id)
    .maybeSingle()

  if (orgError || !org) {
    return defaultValue
  }

  return ((org as OrgRow)[field] as T) ?? defaultValue
}

// Subscription plan checking functions — query through org_members -> organizations
// Respects the active org cookie for multi-org users
export const getUserSubscriptionPlan = async (userId: string): Promise<'free' | 'personal' | 'business'> => {
  if (_isAdmin(userId)) return 'business'
  return getOrgValue(userId, 'subscription_plan', 'free' as const) as Promise<'free' | 'personal' | 'business'>
}

export const getUserMaxVehicles = async (userId: string): Promise<number> => {
  if (_isAdmin(userId)) return 999
  return getOrgValue(userId, 'max_vehicles', 1)
}

export const hasFeatureAccess = (userId: string, plan: 'free' | 'personal' | 'business', feature: string): boolean => {
  if (_isAdmin(userId)) return true

  const features = {
    free: ['fuel_tracking', 'basic_analytics', 'unlimited_history'],
    personal: ['fuel_tracking', 'basic_analytics', 'maintenance_tracking', 'mobile_app', 'unlimited_history', 'receipt_upload'],
    business: ['fuel_tracking', 'basic_analytics', 'maintenance_tracking', 'mobile_app', 'unlimited_history', 'receipt_upload', 'team_collaboration', 'tax_mileage_tracking', 'professional_reporting', 'advanced_mobile_features']
  }

  return features[plan]?.includes(feature) || false
}

export const getUpgradeMessage = (feature: string): string => {
  const messages = {
    maintenance_tracking: "Upgrade to Family ($4/month) to unlock maintenance scheduling and tracking",
    mobile_app: "Upgrade to Family ($4/month) for mobile app access and detailed notifications",
    unlimited_history: "All plans include unlimited data history",
    team_collaboration: "Upgrade to Business ($12/vehicle/month) to invite team members and collaborate",
    tax_mileage_tracking: "Upgrade to Business ($12/vehicle/month) for IRS-compliant business mileage tracking",
    professional_reporting: "Upgrade to Business ($12/vehicle/month) for professional reports and tax compliance",
    receipt_upload: "Upgrade to Family ($4/month) to upload receipt photos"
  }

  return messages[feature as keyof typeof messages] || "Upgrade to unlock this feature"
}
