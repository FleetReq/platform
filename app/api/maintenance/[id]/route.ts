import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, isOwner } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateMaintenanceType } from '@/lib/validation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient(request)
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.WRITE)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const { id: maintenanceId } = await params
    const validId = validateUUID(maintenanceId)
    if (!validId) {
      return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 })
    }

    // Verify record belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('maintenance_records')
      .select('id, receipt_urls, cars!inner(user_id)')
      .eq('id', validId)
      .eq('cars.user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    const body = await request.json()

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (body.date !== undefined) {
      const date = validateDate(body.date, { allowFuture: false })
      if (date) updateData.date = date
    }
    if (body.type !== undefined) {
      const type = validateMaintenanceType(body.type)
      if (type) updateData.type = type
    }
    if (body.oil_type !== undefined) updateData.oil_type = sanitizeString(body.oil_type, { maxLength: 20 })
    if (body.cost !== undefined) updateData.cost = validateFloat(body.cost, { min: 0, max: 10000, precision: 2 })
    if (body.mileage !== undefined) updateData.mileage = validateInteger(body.mileage, { min: 0, max: 999999 })
    if (body.service_provider !== undefined) updateData.service_provider = sanitizeString(body.service_provider, { maxLength: 100 })
    if (body.location !== undefined) updateData.location = sanitizeString(body.location, { maxLength: 200 })
    if (body.next_service_date !== undefined) updateData.next_service_date = validateDate(body.next_service_date, { allowPast: false }) || null
    if (body.next_service_mileage !== undefined) updateData.next_service_mileage = validateInteger(body.next_service_mileage, { min: 0, max: 999999 }) || null
    if (body.notes !== undefined) updateData.notes = sanitizeString(body.notes, { maxLength: 500 })

    if (body.receipt_urls !== undefined) {
      if (!Array.isArray(body.receipt_urls) || body.receipt_urls.length > 5) {
        return NextResponse.json({ error: 'receipt_urls must be an array with max 5 entries' }, { status: 400 })
      }
      updateData.receipt_urls = body.receipt_urls.filter(
        (url: unknown) => typeof url === 'string' && url.length < 500
      )
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('maintenance_records')
      .update(updateData)
      .eq('id', validId)
      .select('*, cars(*)')
      .single()

    if (updateError) {
      console.error('Error updating maintenance record:', updateError)
      return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 })
    }

    // Clean up removed receipt photos from storage
    if (body.receipt_urls !== undefined) {
      const oldPaths: string[] = (existing as any).receipt_urls || [] // eslint-disable-line @typescript-eslint/no-explicit-any
      const newPaths: string[] = updateData.receipt_urls || []
      const removedPaths = oldPaths.filter((p: string) => !newPaths.includes(p))
      if (removedPaths.length > 0) {
        await supabase.storage.from('receipts').remove(removedPaths)
      }
    }

    return NextResponse.json({ maintenanceRecord: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient(request)
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

    // Verify the maintenance record belongs to the user's car and get receipt_urls
    const { data: maintenance, error: fetchError } = await supabase
      .from('maintenance_records')
      .select(`
        id,
        receipt_urls,
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

    // Clean up storage files (non-blocking)
    const receiptUrls: string[] = (maintenance as any).receipt_urls || [] // eslint-disable-line @typescript-eslint/no-explicit-any
    if (receiptUrls.length > 0) {
      supabase.storage.from('receipts').remove(receiptUrls).catch((err: unknown) => {
        console.error('Error cleaning up receipt storage:', err)
      })
    }

    return NextResponse.json({ message: 'Maintenance record deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
