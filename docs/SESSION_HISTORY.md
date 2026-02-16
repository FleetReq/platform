# FleetReq - Session History Archive

> Older session summaries moved from CLAUDE.md to keep it compact.
> Only the latest 1-2 sessions are kept in CLAUDE.md.

---

## Session (2025-11-17) - Subscription Cancellation & Account Cleanup
1. **Pricing page improvements** - Prevented downgrades and aligned button styling
   - Added subscription plan detection on page load
   - Created `getButtonText()`, `isButtonDisabled()`, `getButtonStyle()`
   - All downgrade/current plan buttons now use muted gray
2. **Database migration** - Added cancellation and deletion tracking
   - Migration: `20250117_add_cancellation_tracking.sql`
   - Added 4 columns to `user_profiles`: `subscription_end_date`, `cancellation_requested_at`, `scheduled_deletion_date`, `cancellation_reason`
3. **Subscription cancellation flow** - Account Settings UI + `/api/subscription/cancel` route
   - Stripe `cancel_at_period_end`, 30-day grace period
4. **Account deletion UX** - Scary modal requiring "Confirm Deletion" text input
5. **Automated cleanup cron job** - `/api/cron/cleanup-expired-accounts`
   - Daily deletion of expired accounts (cars → profiles → auth.users)
   - GitHub Actions workflow running daily at midnight
6. **SCHEMA.md updated** with cancellation columns

## Session (2025-01-17) - Stripe Integration & Tax Tracking
1. **Tax Tracking improvements** - Added Business % metric, fixed cost_per_mile
2. **ESLint warnings fixed** - Clean build with zero warnings
3. **Complete Stripe integration** - Full payment processing
   - Checkout session API, success/cancel pages, webhook handler
   - `stripe_customer_id` column, automatic subscription updates
4. **Database migration** - `20250117_add_stripe_customer_id.sql`
5. **Pricing tiers**: Free (→ dashboard), Personal ($4/mo), Business ($12/vehicle/mo)

## Session (2025-01-16) - Keep-Alive, Security, Navigation, Performance Metrics
1. **Supabase keep-alive system** - heartbeat table, INSERT+DELETE+SELECT every 4 hours
2. **Critical security fix** - Removed public read policies, enforced RLS
3. **Database security audit** - Verified RLS, roles, confirmed `profiles` table unused
4. **Documentation updates** - SCHEMA.md RLS policies, heartbeat table
5. **Navigation bug fix** - AuthComponent loading state
6. **Naming research** - FleetSync, KarDock, AutoDock, etc. → selected fleetreq.app
7. **PWA strategy** - PWA first (Phase 1), native apps later
8. **Performance overview redesign planned** - Tax metrics for contractors

## Session (2025-10-10) - Security Hardening
1. Security analysis completed
2. Security headers in vercel.json (CSP, HSTS, X-Frame-Options)
3. Rate limiting library (`lib/rate-limit.ts`)
4. Input validation library (`lib/validation.ts`)
5. Created SECURITY.md

## Session (2025-10-01) - Initial Fixes
1. Fixed `subscriptionPlan` variable bug
2. Consolidated CLAUDE.md files
3. Environment setup, testing infrastructure (46 tests)
4. Data isolation fix, free tier permissions, vehicle limits
5. Delete car functionality, first-time UX
