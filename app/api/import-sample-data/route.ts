import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getOwnerUserId } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const targetUserId = getOwnerUserId()

    // Sample car data
    const carData = {
      user_id: targetUserId,
      make: 'Toyota',
      model: 'Camry',
      year: 2006,
      color: 'Red',
      license_plate: '06-CDX',
      nickname: 'My Camry'
    }

    // Insert the car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .insert([carData])
      .select()
      .single()

    if (carError) {
      return NextResponse.json({
        error: 'Failed to insert car',
        details: carError
      }, { status: 500 })
    }

    // Add some sample fill-ups
    const fillUpData = [
      {
        car_id: car.id,
        date: '2025-01-01',
        odometer_reading: 150000,
        gallons: 12.5,
        price_per_gallon: 3.50,
        total_cost: 43.75,
        gas_station: 'Shell',
        location: 'Local Station',
        mpg: 28.0
      },
      {
        car_id: car.id,
        date: '2025-01-15',
        odometer_reading: 150350,
        gallons: 11.8,
        price_per_gallon: 3.45,
        total_cost: 40.71,
        gas_station: 'Chevron',
        location: 'Highway Station',
        mpg: 29.7
      }
    ]

    const { data: fillUps, error: fillUpError } = await supabase
      .from('fill_ups')
      .insert(fillUpData)
      .select()

    // Add sample maintenance record
    const maintenanceData = {
      car_id: car.id,
      date: '2025-01-10',
      type: 'oil_change',
      description: 'Regular oil change and filter replacement',
      cost: 45.00,
      mileage: 150200,
      service_provider: 'Quick Lube',
      location: 'Local Service Center'
    }

    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .insert([maintenanceData])
      .select()

    return NextResponse.json({
      success: true,
      message: 'Sample data imported successfully!',
      data: {
        car,
        fillUps: fillUps?.length || 0,
        maintenance: maintenance?.length || 0
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Import error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}