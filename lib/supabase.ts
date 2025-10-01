import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side Supabase client for Route Handlers (needs request object)
export const createRouteHandlerClient = async (request: NextRequest) => {
  if (!supabaseUrl || !supabaseAnonKey) return null

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // Can't set cookies in route handlers response directly
        // This will be handled by the response headers
      },
      remove(name: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // Can't remove cookies in route handlers response directly
      },
    },
  })
}

// Server-side Supabase client for Server Components (uses cookies() helper)
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
          cookieStore.set(name, value, {
            ...options,
            sameSite: 'lax',
            secure: true,
            httpOnly: false,
            path: '/'
          })
        } catch {
          // Handle cookie setting errors
        }
      },
      remove(name: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          cookieStore.set(name, '', {
            ...options,
            maxAge: 0,
            sameSite: 'lax',
            secure: true,
            path: '/'
          })
        } catch {
          // Handle cookie removal errors
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