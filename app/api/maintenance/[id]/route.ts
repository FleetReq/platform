import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeString, validateInteger, validateFloat, validateUUID, validateDate, validateMaintenanceType } from '@/lib/validation'
import { withOrg, errorResponse } from '@/lib/api-middleware'
import { canEdit, isOrgOwner, getOrgSubscriptionPlan } from '@/lib/org'
import { MAX_ODOMETER_MILES, STORAGE_BUCKET_RECEIPTS } from '@/lib/constants'

type MaintenanceWithReceipts = { id: string; car_id: string; receipt_urls: string[] }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    const { id: maintenanceId } = await params
    const validId = validateUUID(maintenanceId)
    if (!validId) return errorResponse('Invalid record ID', 400)

    if (!(await canEdit(supabase, user.id, activeOrgId))) {
      return errorResponse('Viewers cannot edit maintenance records', 403)
    }

    const { data: existing, error: fetchError } = await supabase
      .from('maintenance_records')
      .select('id, receipt_urls, cars!inner(org_id)')
      .eq('id', validId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (fetchError || !existing) return errorResponse('Maintenance record not found', 404)

    const body = await request.json()

    const userPlan = await getOrgSubscriptionPlan(supabase, user.id, activeOrgId)

    if (userPlan === 'free') {
      if (body.next_service_date !== undefined || body.next_service_mileage !== undefined) {
        return errorResponse('Next service scheduling requires Family plan or higher', 403)
      }
      if (body.receipt_urls !== undefined) {
        return errorResponse('Receipt uploads require Family plan or higher', 403)
      }
    }

    const updateData: Record<string, unknown> = {}

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
    if (body.mileage !== undefined) updateData.mileage = validateInteger(body.mileage, { min: 0, max: MAX_ODOMETER_MILES })
    if (body.service_provider !== undefined) updateData.service_provider = sanitizeString(body.service_provider, { maxLength: 100 })
    if (body.location !== undefined) updateData.location = sanitizeString(body.location, { maxLength: 200 })
    if (body.next_service_date !== undefined) updateData.next_service_date = validateDate(body.next_service_date, { allowPast: false }) || null
    if (body.next_service_mileage !== undefined) updateData.next_service_mileage = validateInteger(body.next_service_mileage, { min: 0, max: MAX_ODOMETER_MILES }) || null
    if (body.notes !== undefined) updateData.notes = sanitizeString(body.notes, { maxLength: 500 })

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
      .from('maintenance_records')
      .update(updateData)
      .eq('id', validId)
      .select('*, cars(*)')
      .single()

    if (updateError) {
      console.error('Error updating maintenance record:', updateError)
      return errorResponse('Failed to update maintenance record', 500)
    }

    // Clean up removed receipt photos from storage
    if (body.receipt_urls !== undefined) {
      const oldPaths: string[] = (existing as { receipt_urls?: string[] | null }).receipt_urls ?? []
      const newPaths: string[] = (updateData.receipt_urls as string[]) || []
      const removedPaths = oldPaths.filter((p: string) => !newPaths.includes(p))
      if (removedPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET_RECEIPTS).remove(removedPaths)
      }
    }

    return NextResponse.json({ maintenanceRecord: updated })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOrg(request, async ({ supabase, user, activeOrgId, membership }) => {
    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can delete maintenance records', isReadOnly: true }, { status: 403 })
    }

    const { id: maintenanceId } = await params

    const { data: maintenance, error: fetchError } = await supabase
      .from('maintenance_records')
      .select('id, car_id, receipt_urls, cars!inner(org_id)')
      .eq('id', maintenanceId)
      .eq('cars.org_id', membership.org_id)
      .single()

    if (fetchError || !maintenance) return errorResponse('Maintenance record not found', 404)

    const { error: deleteError } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', maintenanceId)
      .eq('car_id', (maintenance as MaintenanceWithReceipts).car_id)

    if (deleteError) {
      console.error('Error deleting maintenance record:', deleteError)
      return errorResponse('Failed to delete maintenance record', 500)
    }

    // Clean up storage files (non-blocking)
    const receiptUrls: string[] = (maintenance as MaintenanceWithReceipts).receipt_urls || []
    if (receiptUrls.length > 0) {
      supabase.storage.from(STORAGE_BUCKET_RECEIPTS).remove(receiptUrls).catch((err: unknown) => {
        console.error('Error cleaning up receipt storage:', err)
      })
    }

    return NextResponse.json({ message: 'Maintenance record deleted successfully' })
  }, { rateLimitConfig: RATE_LIMITS.WRITE })
}
