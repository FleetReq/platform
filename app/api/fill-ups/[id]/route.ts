import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, isOwner } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateFuelType } from '@/lib/validation'

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

    const { id: fillUpId } = await params
    const validId = validateUUID(fillUpId)
    if (!validId) {
      return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 })
    }

    // Verify record belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('fill_ups')
      .select('id, receipt_urls, cars!inner(user_id)')
      .eq('id', validId)
      .eq('cars.user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Fill-up not found' }, { status: 404 })
    }

    const body = await request.json()

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (body.date !== undefined) {
      const date = validateDate(body.date, { allowFuture: false })
      if (date) updateData.date = date
    }
    if (body.odometer_reading !== undefined) updateData.odometer_reading = validateInteger(body.odometer_reading, { min: 0, max: 999999 })
    if (body.gallons !== undefined) updateData.gallons = validateFloat(body.gallons, { min: 0.1, max: 100, precision: 3 })
    if (body.price_per_gallon !== undefined) updateData.price_per_gallon = validateFloat(body.price_per_gallon, { min: 0, max: 20, precision: 3 })
    if (body.fuel_type !== undefined) updateData.fuel_type = validateFuelType(body.fuel_type)
    if (body.gas_station !== undefined) updateData.gas_station = sanitizeString(body.gas_station, { maxLength: 100 })
    if (body.location !== undefined) updateData.location = sanitizeString(body.location, { maxLength: 200 })
    if (body.notes !== undefined) updateData.notes = sanitizeString(body.notes, { maxLength: 500 })

    // Recalculate total_cost if both values are present
    if (updateData.price_per_gallon !== undefined && updateData.gallons !== undefined) {
      updateData.total_cost = parseFloat((updateData.gallons * updateData.price_per_gallon).toFixed(2))
    } else if (updateData.price_per_gallon !== undefined || updateData.gallons !== undefined) {
      // If only one changed, we'd need the other to recalculate — skip
    }

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
      .from('fill_ups')
      .update(updateData)
      .eq('id', validId)
      .select('*, cars(*)')
      .single()

    if (updateError) {
      console.error('Error updating fill-up:', updateError)
      return NextResponse.json({ error: 'Failed to update fill-up' }, { status: 500 })
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

    return NextResponse.json({ fillUp: updated })
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

    // Only allow owner to delete fill-ups
    if (!isOwner(user.id)) {
      return NextResponse.json({
        error: 'Read-only access: Only the owner can delete fill-ups',
        isReadOnly: true
      }, { status: 403 })
    }

    const { id: fillUpId } = await params

    // Verify the fill-up belongs to the user's car and get receipt_urls
    const { data: fillUp, error: fetchError } = await supabase
      .from('fill_ups')
      .select(`
        id,
        receipt_urls,
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

    // Clean up storage files (non-blocking)
    const receiptUrls: string[] = (fillUp as any).receipt_urls || [] // eslint-disable-line @typescript-eslint/no-explicit-any
    if (receiptUrls.length > 0) {
      supabase.storage.from('receipts').remove(receiptUrls).catch((err: unknown) => {
        console.error('Error cleaning up receipt storage:', err)
      })
    }

    return NextResponse.json({ message: 'Fill-up deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
