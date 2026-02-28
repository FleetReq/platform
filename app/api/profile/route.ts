import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { withAuth, errorResponse } from '@/lib/api-middleware'

// PATCH /api/profile — Update user profile preferences (e.g. default_car_id)
export async function PATCH(request: NextRequest) {
  return withAuth(request, async ({ supabase, user }) => {
    const body = await request.json()
    const default_car_id = body.default_car_id ?? null

    if (
      default_car_id !== null &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(default_car_id)
    ) {
      return errorResponse('Invalid car ID', 400)
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ default_car_id })
      .eq('id', user.id)

    if (error) {
      console.error('[Profile] Error updating profile:', error)
      return errorResponse('Failed to update profile', 500)
    }

    return NextResponse.json({ ok: true })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
