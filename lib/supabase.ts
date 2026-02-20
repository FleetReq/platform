import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side Supabase client for Route Handlers (needs request object)
// Uses getAll/setAll interface required by @supabase/ssr v0.7+
export const createRouteHandlerClient = async (request: NextRequest) => {
  if (!supabaseUrl || !supabaseAnonKey) return null

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        } catch (e) {
          // setAll may be called from Server Component — safe to ignore
          console.warn('[supabase] Route handler cookie write failed:', e)
        }
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
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (e) {
          // setAll may be called from Server Component — safe to ignore
          console.warn('[supabase] Server component cookie write failed:', e)
        }
      },
    },
  })
}

// Re-export auth helpers from centralized constants
export { isOwner, isAdmin, OWNER_USER_ID } from '@/lib/constants'

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