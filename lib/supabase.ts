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
        const cookie = cookieStore.get(name)
        console.log('Server: Getting cookie', name, cookie ? 'found' : 'not found')
        return cookie?.value
      },
      set(name: string, value: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          console.log('Server: Setting cookie', name)
          cookieStore.set(name, value, {
            ...options,
            sameSite: 'lax',
            secure: true, // Always use secure in production
            httpOnly: false,
            path: '/'
          })
        } catch (error) {
          console.error('Server: Error setting cookie', name, error)
        }
      },
      remove(name: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          console.log('Server: Removing cookie', name)
          cookieStore.set(name, '', {
            ...options,
            maxAge: 0,
            sameSite: 'lax',
            secure: true,
            path: '/'
          })
        } catch (error) {
          console.error('Server: Error removing cookie', name, error)
        }
      },
    },
  })
}

// Owner user ID for read-only access control
const OWNER_USER_ID = 'b73a07b2-ed72-41b1-943f-e119afc9eddb'

// Helper function to check if user is the owner
export const isOwner = (userId: string): boolean => {
  return userId === OWNER_USER_ID
}

// Get owner's user ID for read-only access
export const getOwnerUserId = (): string => {
  return OWNER_USER_ID
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