import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for system operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials for keep-alive')
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const operationResults = {
      read: 0,
      write: 0,
      delete: 0,
      errors: [] as string[]
    }

    // CRITICAL: Perform WRITE operations to ensure Supabase recognizes activity
    // Research shows SELECT-only queries may not be sufficient to prevent pausing

    // 1. INSERT: Write a heartbeat record (proves write activity)
    const { data: insertData, error: insertError } = await supabase
      .from('heartbeat')
      .insert({
        source: 'github-actions',
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          operations: ['insert', 'delete', 'select']
        }
      })
      .select()

    if (insertError) {
      operationResults.errors.push(`Insert failed: ${insertError.message}`)
    } else {
      operationResults.write++
    }

    // 2. DELETE: Clean up old heartbeat records (keeps table small + proves write activity)
    // Keep only last 100 records
    const { data: oldRecords, error: selectError } = await supabase
      .from('heartbeat')
      .select('id')
      .order('pinged_at', { ascending: false })
      .range(100, 1000) // Get records beyond the 100 most recent

    if (selectError) {
      operationResults.errors.push(`Select old records failed: ${selectError.message}`)
    } else if (oldRecords && oldRecords.length > 0) {
      const idsToDelete = oldRecords.map(r => r.id)
      const { error: deleteError } = await supabase
        .from('heartbeat')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        operationResults.errors.push(`Delete failed: ${deleteError.message}`)
      } else {
        operationResults.delete += oldRecords.length
      }
    }

    // 3. READ: Query multiple tables to verify database accessibility
    const readOperations = [
      supabase.from('user_profiles').select('id').limit(1),
      supabase.from('cars').select('id').limit(1),
      supabase.from('fill_ups').select('id').limit(1),
      supabase.from('maintenance_records').select('id').limit(1)
    ]

    const readResults = await Promise.allSettled(readOperations)
    operationResults.read = readResults.filter(r => r.status === 'fulfilled').length

    // Log errors from read operations (but don't fail - tables might be empty)
    readResults
      .filter(r => r.status === 'rejected')
      .forEach(r => {
        operationResults.errors.push(`Read failed: ${(r as PromiseRejectedResult).reason}`)
      })

    // Log success for monitoring
    console.log(`[Keep-Alive] Success - Read: ${operationResults.read}, Write: ${operationResults.write}, Delete: ${operationResults.delete}, Errors: ${operationResults.errors.length}`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase keep-alive ping successful with write activity',
      operations: operationResults,
      nextPing: 'Expected in 6 hours'
    })
  } catch (error) {
    console.error('Keep-alive cron failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
