import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { validateUUID } from '@/lib/validation'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createRouteHandlerClient(request)

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.WRITE)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Validate UUID
    const carId = validateUUID(params.id)
    if (!carId) {
      return NextResponse.json({ error: 'Invalid car ID' }, { status: 400 })
    }

    // Verify the car belongs to the user before deleting
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, user_id')
      .eq('id', carId)
      .single()

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    if (car.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the car (CASCADE will delete associated fill-ups and maintenance records)
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)

    if (deleteError) {
      console.error('Error deleting car:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete car',
        // Only expose details in development
        ...(process.env.NODE_ENV !== 'production' && {
          details: deleteError.message
        })
      }, { status: 500 })
    }

    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/cars/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
