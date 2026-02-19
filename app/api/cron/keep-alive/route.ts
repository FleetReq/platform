import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (GitHub Actions or Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const databaseUrl = process.env.DATABASE_URL

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing Supabase credentials for keep-alive')
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 })
    }


    const operationResults = {
      directDb: { success: false, operations: 0, error: null as string | null },
      serviceRole: { success: false, operations: 0, error: null as string | null },
      anonKey: { success: false, operations: 0, error: null as string | null }
    }

    // ============================================================================
    // APPROACH 1: Direct PostgreSQL Connection (Native SQL)
    // ============================================================================
    // Theory: Supabase may only count direct database connections, not API calls

    if (databaseUrl) {
      try {
        const pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        })

        // 1. INSERT heartbeat record
        await pool.query(
          `INSERT INTO heartbeat (source, metadata) VALUES ($1, $2)`,
          ['github-actions-direct-db', {
            timestamp: new Date().toISOString(),
            method: 'native-sql',
            version: '3.0'
          }]
        )
        operationResults.directDb.operations++

        // 2. UPDATE a recent heartbeat (adds operation diversity)
        await pool.query(
          `UPDATE heartbeat SET metadata = $1 WHERE id IN (SELECT id FROM heartbeat ORDER BY pinged_at DESC LIMIT 1)`,
          [{ updated: true, timestamp: new Date().toISOString() }]
        )
        operationResults.directDb.operations++

        // 3. DELETE old records (cleanup + write activity)
        const deleteResult = await pool.query(
          `DELETE FROM heartbeat WHERE id IN (
            SELECT id FROM heartbeat ORDER BY pinged_at DESC OFFSET 100
          )`
        )
        operationResults.directDb.operations += deleteResult.rowCount || 0

        // 4. SELECT from multiple tables (verify accessibility)
        await pool.query('SELECT id FROM user_profiles LIMIT 1')
        await pool.query('SELECT id FROM cars LIMIT 1')
        operationResults.directDb.operations += 2

        await pool.end()
        operationResults.directDb.success = true
        console.log('[Keep-Alive] Direct DB connection: SUCCESS')
      } catch (error) {
        operationResults.directDb.error = String(error)
        console.error('[Keep-Alive] Direct DB connection failed:', error)
      }
    } else {
      operationResults.directDb.error = 'DATABASE_URL not configured'
    }

    // ============================================================================
    // APPROACH 2: Service Role Client (Current Approach)
    // ============================================================================
    // Theory: Maintains backward compatibility with current system

    try {
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

      // 1. INSERT heartbeat
      const { error: insertError } = await supabaseService
        .from('heartbeat')
        .insert({
          source: 'github-actions-service-role',
          metadata: {
            timestamp: new Date().toISOString(),
            method: 'supabase-client-service',
            version: '3.0'
          }
        })

      if (!insertError) operationResults.serviceRole.operations++

      // 2. DELETE old records (keep last 100)
      const { data: oldRecords } = await supabaseService
        .from('heartbeat')
        .select('id')
        .order('pinged_at', { ascending: false })
        .range(100, 1000)

      if (oldRecords && oldRecords.length > 0) {
        const { error: deleteError } = await supabaseService
          .from('heartbeat')
          .delete()
          .in('id', oldRecords.map(r => r.id))

        if (!deleteError) operationResults.serviceRole.operations += oldRecords.length
      }

      // 3. READ from multiple tables
      const readOps = await Promise.allSettled([
        supabaseService.from('user_profiles').select('id').limit(1),
        supabaseService.from('cars').select('id').limit(1),
        supabaseService.from('fill_ups').select('id').limit(1),
        supabaseService.from('maintenance_records').select('id').limit(1)
      ])

      operationResults.serviceRole.operations += readOps.filter(r => r.status === 'fulfilled').length
      operationResults.serviceRole.success = true
      console.log('[Keep-Alive] Service role client: SUCCESS')
    } catch (error) {
      operationResults.serviceRole.error = String(error)
      console.error('[Keep-Alive] Service role client failed:', error)
    }

    // ============================================================================
    // APPROACH 3: Anon Key Client (Authenticated User Simulation)
    // ============================================================================
    // Theory: Supabase may only count authenticated user activity, not service_role

    try {
      const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

      // 1. INSERT heartbeat (triggers RLS = simulates real user)
      const { error: insertError } = await supabaseAnon
        .from('heartbeat')
        .insert({
          source: 'github-actions-anon-key',
          metadata: {
            timestamp: new Date().toISOString(),
            method: 'supabase-client-anon',
            version: '3.0'
          }
        })

      if (!insertError) operationResults.anonKey.operations++

      // 2. READ operations (simulates user browsing)
      const readOps = await Promise.allSettled([
        supabaseAnon.from('heartbeat').select('id').limit(5),
        supabaseAnon.from('user_profiles').select('id').limit(1),
        supabaseAnon.from('cars').select('id').limit(1)
      ])

      operationResults.anonKey.operations += readOps.filter(r => r.status === 'fulfilled').length
      operationResults.anonKey.success = true
      console.log('[Keep-Alive] Anon key client: SUCCESS')
    } catch (error) {
      operationResults.anonKey.error = String(error)
      console.error('[Keep-Alive] Anon key client failed:', error)
    }

    // ============================================================================
    // Summary & Response
    // ============================================================================

    const totalOperations =
      operationResults.directDb.operations +
      operationResults.serviceRole.operations +
      operationResults.anonKey.operations

    const successfulApproaches = [
      operationResults.directDb.success,
      operationResults.serviceRole.success,
      operationResults.anonKey.success
    ].filter(Boolean).length

    console.log(`[Keep-Alive] COMPLETE - ${successfulApproaches}/3 approaches successful, ${totalOperations} total operations`)

    return NextResponse.json({
      success: successfulApproaches > 0,
      timestamp: new Date().toISOString(),
      message: `Enhanced keep-alive: ${successfulApproaches}/3 approaches successful`,
      summary: {
        totalOperations,
        successfulApproaches,
        approachesAttempted: 3
      },
      details: operationResults,
      nextPing: 'Expected in 4 hours',
      version: '3.0-enhanced'
    })
  } catch (error) {
    console.error('Keep-alive cron failed:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
