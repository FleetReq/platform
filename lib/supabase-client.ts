import { createBrowserClient } from '@supabase/ssr'

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

// Owner user ID for read-only access control
const OWNER_USER_ID = 'b73a07b2-ed72-41b1-943f-e119afc9eddb'

// Admin user IDs - these users have full access to all features regardless of subscription
const ADMIN_USER_IDS = ['b73a07b2-ed72-41b1-943f-e119afc9eddb'] // deeahtee@live.com

// Helper function to check if user is the owner (client-side)
export const isOwner = (userId: string): boolean => {
  return userId === OWNER_USER_ID
}

// Helper function to check if user is an admin
export const isAdmin = (userId: string): boolean => {
  return ADMIN_USER_IDS.includes(userId)
}

// Subscription plan checking functions — query through org_members → organizations
export const getUserSubscriptionPlan = async (userId: string): Promise<'free' | 'personal' | 'business'> => {
  if (!supabase) return 'free'

  // Admins always get 'business' plan access
  if (isAdmin(userId)) return 'business'

  // Get user's org membership
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (membershipError || !membership) {
    console.error('Error fetching org membership:', membershipError)
    return 'free'
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', membership.org_id)
    .single()

  if (orgError || !org) {
    console.error('Error fetching org subscription plan:', orgError)
    return 'free'
  }

  return (org.subscription_plan as 'free' | 'personal' | 'business') || 'free'
}

export const getUserMaxVehicles = async (userId: string): Promise<number> => {
  if (!supabase) return 1

  // Admins get unlimited vehicles
  if (isAdmin(userId)) return 999

  // Get user's org membership
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (membershipError || !membership) {
    console.error('Error fetching org membership:', membershipError)
    return 1
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('max_vehicles')
    .eq('id', membership.org_id)
    .single()

  if (orgError || !org) {
    console.error('Error fetching org max vehicles:', orgError)
    return 1
  }

  return org.max_vehicles || 1
}

export const hasFeatureAccess = (userId: string, plan: 'free' | 'personal' | 'business', feature: string): boolean => {
  // Admins have access to all features
  if (isAdmin(userId)) return true

  const features = {
    free: ['fuel_tracking', 'basic_analytics', 'unlimited_history'],
    personal: ['fuel_tracking', 'basic_analytics', 'maintenance_tracking', 'mobile_app', 'unlimited_history', 'receipt_upload'],
    business: ['fuel_tracking', 'basic_analytics', 'maintenance_tracking', 'mobile_app', 'unlimited_history', 'receipt_upload', 'team_collaboration', 'tax_mileage_tracking', 'professional_reporting', 'advanced_mobile_features']
  }

  return features[plan]?.includes(feature) || false
}

export const getUpgradeMessage = (feature: string): string => {
  const messages = {
    maintenance_tracking: "Upgrade to Personal ($4/month) to unlock maintenance scheduling and tracking",
    mobile_app: "Upgrade to Personal ($4/month) for mobile app access and detailed notifications",
    unlimited_history: "All plans include unlimited data history",
    team_collaboration: "Upgrade to Business ($12/vehicle/month) to invite team members and collaborate",
    tax_mileage_tracking: "Upgrade to Business ($12/vehicle/month) for IRS-compliant business mileage tracking",
    professional_reporting: "Upgrade to Business ($12/vehicle/month) for professional reports and tax compliance",
    receipt_upload: "Upgrade to Personal ($4/month) to upload receipt photos"
  }

  return messages[feature as keyof typeof messages] || "Upgrade to unlock this feature"
}