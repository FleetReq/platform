import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createRouteHandlerClient(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const carId = params.id

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
      return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/cars/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
