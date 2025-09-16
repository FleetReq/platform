import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side Supabase client with proper session management
export const createServerSupabaseClient = async () => {
  if (!supabaseUrl || !supabaseAnonKey) return null

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Handle cookie setting errors (e.g., in middleware)
        }
      },
      remove(name: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch {
          // Handle cookie removal errors
        }
      },
    },
  })
}

// Re-export types and helpers from client module for server-side use
export type {
  Car,
  FillUp,
  MaintenanceRecord,
  UserProfile
} from './supabase-client'

export {
  calculateMPG,
  getMilesDriven
} from './supabase-client'