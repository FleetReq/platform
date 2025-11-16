# Supabase Keep-Alive Setup Instructions

## Overview
This setup prevents Supabase free-tier projects from auto-pausing due to inactivity by:
1. Running write operations (INSERT/DELETE) every 6 hours
2. Using a dedicated `heartbeat` table to track activity
3. Performing read operations across multiple tables

## Step 1: Create the Heartbeat Table

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `migrations/20250116_create_heartbeat_table.sql`
5. Click **Run** to execute the migration
6. Verify the table was created: Go to **Table Editor** → you should see `heartbeat` table

### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## Step 2: Verify Environment Variables

Ensure your Vercel deployment has the required environment variable:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (found in Supabase → Settings → API)

**Where to add:**
- Vercel Dashboard → Your Project → Settings → Environment Variables

## Step 3: Deploy the Updated Code

```bash
git add .
git commit -m "🔧 FIX: Improve Supabase keep-alive with write operations + 6hr frequency"
git push
```

This will:
- Deploy the updated keep-alive endpoint to Vercel
- Activate the GitHub Actions workflow (runs every 6 hours)

## Step 4: Test the Keep-Alive Endpoint

### Manual Test (Immediate)
```bash
# Test locally (if dev server is running)
curl http://localhost:3000/api/cron/keep-alive

# Test production
curl https://fleetreq.vercel.app/api/cron/keep-alive
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-01-16T...",
  "message": "Supabase keep-alive ping successful with write activity",
  "operations": {
    "read": 4,
    "write": 1,
    "delete": 0,
    "errors": []
  },
  "nextPing": "Expected in 6 hours"
}
```

### Verify in Supabase
1. Go to Supabase Dashboard → **Table Editor** → `heartbeat`
2. You should see a new record with:
   - `source`: "github-actions"
   - `pinged_at`: Recent timestamp
   - `metadata`: Contains operation details

## Step 5: Monitor GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. Look for "Supabase Keep-Alive" workflow
4. Verify it runs every 6 hours (check the schedule)

**Next scheduled runs:**
- 00:00 UTC (4:00 PM PST / 5:00 PM PDT)
- 06:00 UTC (10:00 PM PST / 11:00 PM PDT)
- 12:00 UTC (4:00 AM PST / 5:00 AM PDT)
- 18:00 UTC (10:00 AM PST / 11:00 AM PDT)

## Troubleshooting

### Error: "Missing Supabase credentials"
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables
- Redeploy after adding the environment variable

### Error: "relation 'heartbeat' does not exist"
- Run the migration SQL in Supabase Dashboard (Step 1)

### Heartbeat table keeps growing
- The endpoint automatically deletes records older than the 100 most recent
- This happens on each ping, keeping the table size manageable

### Still getting pause warnings
If you still receive pause warnings after 7 days:
1. Check GitHub Actions logs to verify the workflow is running
2. Check Vercel logs to verify the endpoint is being called
3. Check Supabase `heartbeat` table to verify records are being inserted
4. Consider upgrading to Supabase Pro ($25/month) for guaranteed uptime

## How It Works

**Every 6 hours:**
1. GitHub Actions triggers the workflow
2. Workflow calls `https://fleetreq.vercel.app/api/cron/keep-alive`
3. Endpoint performs:
   - **INSERT**: Adds new heartbeat record (write activity)
   - **DELETE**: Removes old heartbeat records (write activity)
   - **SELECT**: Reads from 4 tables (read activity)
4. Supabase recognizes activity → project stays active

**Why this prevents pausing:**
- Write operations (INSERT/DELETE) ensure "meaningful" database activity
- Running every 6 hours ensures activity within 7-day window
- Multiple operation types maximize recognition by Supabase's activity detection

## Additional Resources

- [Supabase Pricing & Pausing](https://supabase.com/pricing)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Community Solutions](https://github.com/travisvn/supabase-pause-prevention)
