import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { updateStripeSubscriptionQuantity } from '@/lib/stripe-helpers'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'
import { validateUUID } from '@/lib/validation'
import { getUserOrg, getOrgSubscriptionPlan, isOrgOwner } from '@/lib/org'

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

    // Check org membership and owner role (only owners can delete cars)
    const activeOrgId = request.cookies.get('fleetreq-active-org')?.value || null
    const membership = await getUserOrg(supabase, user.id, activeOrgId)
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    if (!(await isOrgOwner(supabase, user.id, activeOrgId))) {
      return NextResponse.json({ error: 'Only org owners can delete vehicles' }, { status: 403 })
    }

    // Verify the car belongs to the user's org
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, org_id')
      .eq('id', carId)
      .eq('org_id', membership.org_id)
      .single()

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // Collect receipt storage paths before cascade delete
    const receiptPaths: string[] = []
    const { data: fillUpsWithReceipts } = await supabase
      .from('fill_ups')
      .select('receipt_urls')
      .eq('car_id', carId)
      .neq('receipt_urls', '{}')
    if (fillUpsWithReceipts) {
      for (const row of fillUpsWithReceipts) {
        if (row.receipt_urls?.length) receiptPaths.push(...row.receipt_urls)
      }
    }
    const { data: maintenanceWithReceipts } = await supabase
      .from('maintenance_records')
      .select('receipt_urls')
      .eq('car_id', carId)
      .neq('receipt_urls', '{}')
    if (maintenanceWithReceipts) {
      for (const row of maintenanceWithReceipts) {
        if (row.receipt_urls?.length) receiptPaths.push(...row.receipt_urls)
      }
    }

    // Delete the car (CASCADE will delete associated fill-ups and maintenance records)
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)
      .eq('org_id', membership.org_id)

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

    // Clean up receipt storage files (non-blocking)
    if (receiptPaths.length > 0) {
      supabase.storage.from('receipts').remove(receiptPaths).catch((err: unknown) => {
        console.error('Error cleaning up receipt storage for car delete:', err)
      })
    }

    // Handle Stripe subscription update for Business tier users
    let prorationInfo = null
    const userPlan = await getOrgSubscriptionPlan(supabase, user.id, activeOrgId)

    if (userPlan === 'business') {
      // Get new vehicle count (after deletion)
      const { count: vehicleCount } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', membership.org_id)

      // Update Stripe subscription quantity (vehicleCount could be 0 if last vehicle deleted)
      const newCount = vehicleCount || 0
      if (newCount >= 0) {
        const result = await updateStripeSubscriptionQuantity(user.id, Math.max(1, newCount))

        if (result.success) {
          prorationInfo = {
            prorationAmount: result.prorationAmount,
            isCredit: result.isCredit,
            message: result.message
          }
        } else {
          console.error('Failed to update Stripe subscription:', result.error)
          return NextResponse.json({
            message: 'Car deleted successfully, but billing could not be updated. Please contact support to ensure your subscription reflects the correct vehicle count.',
            billingError: true,
            proration: null
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Car deleted successfully',
      proration: prorationInfo
    })
  } catch (error) {
    console.error('Error in DELETE /api/cars/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
