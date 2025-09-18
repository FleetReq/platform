import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, isOwner } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow owner to delete maintenance records
    if (!isOwner(user.id)) {
      return NextResponse.json({
        error: 'Read-only access: Only the owner can delete maintenance records',
        isReadOnly: true
      }, { status: 403 })
    }

    const { id: maintenanceId } = await params

    // Verify the maintenance record belongs to the user's car
    const { data: maintenance, error: fetchError } = await supabase
      .from('maintenance_records')
      .select(`
        id,
        cars!inner(user_id)
      `)
      .eq('id', maintenanceId)
      .eq('cars.user_id', user.id)
      .single()

    if (fetchError || !maintenance) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    // Delete the maintenance record
    const { error: deleteError } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', maintenanceId)

    if (deleteError) {
      console.error('Error deleting maintenance record:', deleteError)
      return NextResponse.json({ error: 'Failed to delete maintenance record' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Maintenance record deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}