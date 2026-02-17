import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateFuelType } from '@/lib/validation'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { canEdit, isOrgOwner } from '@/lib/org'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    const { id: fillUpId } = await params
    const validId = validateUUID(fillUpId)
    if (!validId) return errorResponse('Invalid record ID', 400)

    if (!(await canEdit(supabase, user.id, activeOrgId))) {
      return errorResponse('Viewers cannot edit fill-ups', 403)
    }

    // Verify record belongs to user's org
    const { data: existing, error: fetchError } = await supabase
      .from('fill_ups')
      .select('id, receipt_urls, cars!inner(org_id)')
      .eq('id', validId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (fetchError || !existing) return errorResponse('Fill-up not found', 404)

    const body = await request.json()

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

    if (updateData.price_per_gallon !== undefined && updateData.gallons !== undefined) {
      updateData.total_cost = parseFloat((updateData.gallons * updateData.price_per_gallon).toFixed(2))
    }

    if (body.receipt_urls !== undefined) {
      if (!Array.isArray(body.receipt_urls) || body.receipt_urls.length > 5) {
        return errorResponse('receipt_urls must be an array with max 5 entries', 400)
      }
      updateData.receipt_urls = body.receipt_urls.filter(
        (url: unknown) => typeof url === 'string' && url.length < 500
      )
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields to update', 400)
    }

    const { data: updated, error: updateError } = await supabase
      .from('fill_ups')
      .update(updateData)
      .eq('id', validId)
      .select('*, cars(*)')
      .single()

    if (updateError) {
      console.error('Error updating fill-up:', updateError)
      return errorResponse('Failed to update fill-up', 500)
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
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can delete fill-ups', isReadOnly: true }, { status: 403 })
    }

    const { id: fillUpId } = await params

    const { data: fillUp, error: fetchError } = await supabase
      .from('fill_ups')
      .select('id, receipt_urls, cars!inner(org_id)')
      .eq('id', fillUpId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (fetchError || !fillUp) return errorResponse('Fill-up not found', 404)

    const { error: deleteError } = await supabase
      .from('fill_ups')
      .delete()
      .eq('id', fillUpId)

    if (deleteError) {
      console.error('Error deleting fill-up:', deleteError)
      return errorResponse('Failed to delete fill-up', 500)
    }

    // Clean up storage files (non-blocking)
    const receiptUrls: string[] = (fillUp as any).receipt_urls || [] // eslint-disable-line @typescript-eslint/no-explicit-any
    if (receiptUrls.length > 0) {
      supabase.storage.from('receipts').remove(receiptUrls).catch((err: unknown) => {
        console.error('Error cleaning up receipt storage:', err)
      })
    }

    return NextResponse.json({ message: 'Fill-up deleted successfully' })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
