/**
 * API route middleware for FleetReq.
 * Eliminates repeated auth/org/rate-limit boilerplate across all API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders, RateLimitConfig } from '@/lib/rate-limit'
import { getUserOrg, OrgMembership } from '@/lib/org'
import { isAdmin } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthContext {
  supabase: SupabaseClient
  user: User
  activeOrgId: string | null
}

export interface OrgContext extends AuthContext {
  membership: OrgMembership
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function rateLimitResponse(result: { success: boolean; limit: number; remaining: number; reset: number }): NextResponse {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: getRateLimitHeaders(result) }
  )
}

// ---------------------------------------------------------------------------
// withAuth — resolves supabase client + authenticated user
// ---------------------------------------------------------------------------

export async function withAuth(
  request: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>,
  options?: { rateLimitConfig?: RateLimitConfig }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return errorResponse('Database not configured', 503)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Rate limiting (optional)
    if (options?.rateLimitConfig) {
      const result = rateLimit(user.id, options.rateLimitConfig)
      if (!result.success) {
        return rateLimitResponse(result)
      }
    }

    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null

    return await handler({ supabase, user, activeOrgId })
  } catch (error) {
    console.error('API error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ---------------------------------------------------------------------------
// withOrg — withAuth + resolves org membership
// ---------------------------------------------------------------------------

export async function withOrg(
  request: NextRequest,
  handler: (ctx: OrgContext) => Promise<NextResponse>,
  options?: {
    rateLimitConfig?: RateLimitConfig
    requireRole?: 'editor' | 'owner'
    /** If true, return empty array instead of 401 for unauthenticated requests */
    emptyOnUnauth?: string
  }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return errorResponse('Database not configured', 503)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      if (options?.emptyOnUnauth) {
        return NextResponse.json({ [options.emptyOnUnauth]: [] })
      }
      return errorResponse('Unauthorized', 401)
    }

    // Rate limiting
    if (options?.rateLimitConfig) {
      const result = rateLimit(user.id, options.rateLimitConfig)
      if (!result.success) {
        return rateLimitResponse(result)
      }
    }

    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null

    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      if (options?.emptyOnUnauth) {
        return NextResponse.json({ [options.emptyOnUnauth]: [] })
      }
      return errorResponse('No organization found', 403)
    }

    // Role checks (admins bypass)
    if (options?.requireRole && !isAdmin(user.id)) {
      if (options.requireRole === 'owner' && membership.role !== 'owner') {
        return errorResponse('Only org owners can perform this action', 403)
      }
      if (options.requireRole === 'editor' && membership.role === 'viewer') {
        return errorResponse('Viewers cannot perform this action', 403)
      }
    }

    return await handler({ supabase, user, activeOrgId, membership })
  } catch (error) {
    console.error('API error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ---------------------------------------------------------------------------
// Common rate limit presets for routes
// ---------------------------------------------------------------------------

export const READ_RATE_LIMIT = { rateLimitConfig: RATE_LIMITS.READ }
export const WRITE_RATE_LIMIT = { rateLimitConfig: RATE_LIMITS.WRITE }
