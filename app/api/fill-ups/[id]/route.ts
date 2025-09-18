import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, isOwner } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only allow owner to delete fill-ups
    if (!isOwner(user.id)) {
      return NextResponse.json({
        error: 'Read-only access: Only the owner can delete fill-ups',
        isReadOnly: true
      }, { status: 403 })
    }

    const fillUpId = params.id

    // Verify the fill-up belongs to the user's car
    const { data: fillUp, error: fetchError } = await supabase
      .from('fill_ups')
      .select(`
        id,
        cars!inner(user_id)
      `)
      .eq('id', fillUpId)
      .eq('cars.user_id', user.id)
      .single()

    if (fetchError || !fillUp) {
      return NextResponse.json({ error: 'Fill-up not found' }, { status: 404 })
    }

    // Delete the fill-up
    const { error: deleteError } = await supabase
      .from('fill_ups')
      .delete()
      .eq('id', fillUpId)

    if (deleteError) {
      console.error('Error deleting fill-up:', deleteError)
      return NextResponse.json({ error: 'Failed to delete fill-up' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Fill-up deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}