import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types (shared between client and server)
export interface Car {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  color?: string
  license_plate?: string
  nickname?: string
  created_at: string
  updated_at: string
}

export interface FillUp {
  id: string
  car_id: string
  date: string
  odometer_reading: number
  gallons: number
  price_per_gallon: number
  total_cost: number
  gas_station?: string
  location?: string
  notes?: string
  mpg?: number
  created_at: string
  updated_at: string
}

export interface MaintenanceRecord {
  id: string
  car_id: string
  date: string
  type: 'oil_change' | 'tire_rotation' | 'brake_service' | 'tune_up' | 'repair' | 'other'
  description: string
  cost: number
  mileage: number
  service_provider?: string
  location?: string
  next_service_date?: string
  next_service_mileage?: number
  notes?: string
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