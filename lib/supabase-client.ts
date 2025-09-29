import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true
      }
    })
  : null

// Database types (shared between client and server)
export interface Car {
  id: string
  owner_id: string  // Updated to match new schema
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

// Team management types
export interface UserProfile {
  user_id: string
  subscription_plan: 'personal' | 'business' | 'fleet'
  max_vehicles: number
  max_invited_users: number
  is_primary_user: boolean
  created_at: string
}

export interface InvitedUser {
  id: string
  primary_user_id: string
  invited_email: string
  can_edit: boolean
  invited_at: string
  accepted_at?: string
  auth_user_id?: string
  created_at: string
}

export interface TeamMember {
  user_id: string
  email: string
  primary_user_id: string
  can_edit: boolean
  role: 'owner' | 'team_member' | 'none'
}

export interface SubscriptionLimits {
  current_vehicles: number
  max_vehicles: number
  current_users: number
  max_users: number
  can_add_vehicle: boolean
  can_add_user: boolean
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
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface MaintenanceRecord {
  id: string
  car_id: string
  date: string
  type: 'oil_change' | 'tire_rotation' | 'brake_inspection' | 'air_filter' | 'transmission_service' | 'coolant_flush' | 'wipers' | 'registration'
  oil_type?: string
  description?: string
  cost?: number
  mileage?: number
  service_provider?: string
  location?: string
  next_service_date?: string
  next_service_mileage?: number
  notes?: string
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
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

// Helper function to check if user is the owner (client-side)
export const isOwner = (userId: string): boolean => {
  return userId === OWNER_USER_ID
}

// Team management helper functions
export const getTeamMembers = async (primaryUserId: string): Promise<TeamMember[]> => {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('primary_user_id', primaryUserId)

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }

  return data || []
}

export const inviteTeamMember = async (email: string, canEdit: boolean): Promise<{ success: boolean, error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not initialized' }

  const { error } = await supabase
    .from('invited_users')
    .insert({
      invited_email: email,
      can_edit: canEdit
    })
    .select()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export const checkSubscriptionLimits = async (primaryUserId: string): Promise<SubscriptionLimits | null> => {
  if (!supabase) return null

  const { data, error } = await supabase
    .rpc('check_subscription_limits', { primary_user_id: primaryUserId })

  if (error) {
    console.error('Error checking subscription limits:', error)
    return null
  }

  return data?.[0] || null
}

// Subscription plan checking functions
export const getUserSubscriptionPlan = async (userId: string): Promise<'personal' | 'business' | 'fleet'> => {
  if (!supabase) return 'personal'

  const { data, error } = await supabase
    .from('user_profiles')
    .select('subscription_plan')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching subscription plan:', error)
    return 'personal'
  }

  return data?.subscription_plan || 'personal'
}

export const hasFeatureAccess = (plan: 'personal' | 'business' | 'fleet', feature: string): boolean => {
  const features = {
    personal: ['fuel_tracking', 'basic_analytics'],
    business: ['fuel_tracking', 'basic_analytics', 'maintenance_tracking', 'team_collaboration', 'professional_reporting', 'unlimited_history'],
    fleet: ['fuel_tracking', 'basic_analytics', 'maintenance_tracking', 'team_collaboration', 'professional_reporting', 'unlimited_history', 'advanced_analytics', 'api_access']
  }

  return features[plan]?.includes(feature) || false
}

export const getUpgradeMessage = (feature: string): string => {
  const messages = {
    maintenance_tracking: "Upgrade to Business to unlock maintenance scheduling and compliance tracking",
    team_collaboration: "Upgrade to Business to invite team members and collaborate",
    professional_reporting: "Upgrade to Business for professional reports and data export",
    unlimited_history: "Upgrade to Business for unlimited data history (free plan limited to 90 days)"
  }

  return messages[feature as keyof typeof messages] || "Upgrade to unlock this feature"
}