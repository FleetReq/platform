# FleetReq Platform - Complete Development Context

> **IMPORTANT**: This is the single source of truth for FleetReq development.
> All strategic decisions, technical architecture, and development priorities are documented here.

---

## 🚨 CRITICAL DEVELOPMENT PRINCIPLES

### **0. CLAUDE.md is Auto-Loaded (Verify Context)**
**This CLAUDE.md file is automatically loaded by Claude Code at session start.**
- If starting a session, verify I have context by referencing recent work
- Review all 7 Critical Development Principles before any work
- Check Recent Session Summary for latest context
- Review Current Tasks & Priorities for active work
- Verify Pre-Session Setup Checklist is complete
- **Rationale**: Claude Code automatically loads CLAUDE.md as project instructions. User should not need to ask me to read it - it's provided automatically. I should reference it to show I have context.

### **1. Root Cause Solutions - NO Workarounds**
**ALWAYS solve problems at the source, never use band-aids or workarounds.**
- Identify the actual root configuration or architectural issue
- Fix the underlying problem properly
- Avoid temporary patches that mask issues
- Document the proper solution for future reference

### **2. Consider All Options**
**Always evaluate my request but present better alternatives if they exist.**
- Understand the goal behind the request
- Research best practices and industry standards
- Present multiple solutions with pros/cons
- Recommend the best approach with clear reasoning
- Let me make the final decision with full context

### **3. Professional & Consistent Design**
**Maintain visual consistency and professional appearance across all pages.**
- Follow established design patterns (card styles, spacing, colors)
- Ensure light mode looks as polished as dark mode
- Use consistent component patterns (buttons, forms, modals)
- Test in both themes before committing
- Maintain accessibility standards (WCAG 2.1 AA)

### **4. Maintain CLAUDE.md Carefully**
**When updating CLAUDE.md, carefully find the correct place and prevent duplicates.**
- **Before adding**: Search CLAUDE.md to check if content already exists
- **When adding**: Find the logical section, don't append to end
- **Document rationale**: Include WHY, not just WHAT
- **Consider reorganization**: If adding content makes a section too long, reorganize
- **Keep compact**: Merge duplicates, archive low-priority content to reference sections
- **Rationale**: Prevents CLAUDE.md from bloating with duplicates. Keeps it efficient and maintainable. Each session should leave it better organized, not longer.

### **5. Apply Fixes Systematically Across Codebase**
**When fixing a bug, ALWAYS check if the same issue exists in similar files.**
- **Don't fix in isolation**: If you fix a bug in one API endpoint, check ALL other endpoints
- **Search for patterns**: Use grep/glob to find similar code that might have the same issue
- **Apply consistently**: Make the same fix everywhere it's needed in a single session
- **Example**: If `created_by_user_id` doesn't exist in fill_ups, check maintenance_records, cars, etc.
- **Rationale**: Prevents users from hitting the same bug in multiple places. One fix session should solve the problem completely, not create a whack-a-mole situation.

### **6. Always Verify Against SCHEMA.md and FUNCTIONS.md Before Database Operations**
**Before writing ANY database INSERT/UPDATE code, check both SCHEMA.md and FUNCTIONS.md.**
- **Read SCHEMA.md first**: Verify table structure, column names, constraints, and indexes
- **Read FUNCTIONS.md**: Check for triggers that auto-calculate fields or auto-create records
- **Don't assume**: Column names like `user_id` vs `owner_id` vs `created_by_user_id` are critical
- **Never set auto-calculated fields**: Don't manually set `mpg`, `updated_at`, or other trigger-managed fields
- **Provide required fields for triggers**: E.g., `miles_driven` is needed for `calculate_mpg()` trigger
- **Update both files**: If you modify schema or functions in Supabase, update SCHEMA.md and FUNCTIONS.md
- **Rationale**: Prevents "column does not exist" errors, avoids conflicts with triggers, and ensures data integrity. These files are the single source of truth.

---

## 🎯 Repository Information

**Repository**: `/d/Documents/coding/fleetreq-platform`
- **GitHub**: `git@github.com:FleetReq/platform.git`
- **Live Site**: https://fleetreq.vercel.app
- **Deployment**: Vercel (auto-deploys from main branch)
- **Status**: ✅ Active Development

---

## 🚨 PRE-SESSION SETUP CHECKLIST

**CRITICAL: Complete these steps BEFORE starting any development work**

### **0. Read This Entire CLAUDE.md File First**
**⚠️ MANDATORY: I do this proactively at the start of EVERY session (see Principle #0)**
- Read all 7 Critical Development Principles
- Check Recent Session Summary for latest context
- Review Current Tasks & Priorities
- Verify this Pre-Session Setup Checklist is complete

### **1. Verify Working Directory**
```bash
pwd  # Must be: /d/Documents/coding/fleetreq-platform
```

### **2. Check Environment Variables**
```bash
ls -la .env.local  # MUST exist with Supabase credentials
```

**If `.env.local` is missing:**
```bash
cp /d/Documents/coding/my-resume-site/.env.local .
```

**Required variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GA_ID` (optional, for analytics)

### **3. Ensure Port 3000 is Available**
```bash
# Check if port 3000 is in use
netstat -ano | grep :3000 | grep LISTENING

# If port is in use, kill the process:
taskkill //PID [PID_NUMBER] //F
```

**🚨 WHY PORT 3000 IS CRITICAL:**
- Google OAuth is configured to redirect to `http://localhost:3000/auth/callback`
- Running on ANY other port will break authentication
- Must ALWAYS run on port 3000, never 3001, 3002, etc.

### **4. Start Development Server**
```bash
npm run dev  # MUST show: http://localhost:3000
```

**Verify startup output shows:**
- ✅ `- Local: http://localhost:3000`
- ✅ `- Environments: .env.local`
- ✅ `✓ Ready in [time]ms`

### **5. Verify Supabase Connection**
- Navigate to `http://localhost:3000` in browser
- Should NOT see: "Your project's URL and Key are required"
- Should see landing page or app interface

---

## 📝 Recent Session Summary

### **Latest Session (2025-12-18) - Route Rename, Loading Fix & Branding**
1. ✅ **Next.js 16 proxy migration** - Fixed middleware deprecation warning
   - Migrated `middleware.ts` → `proxy.ts` (Next.js 16 requirement)
   - Updated function name: `middleware()` → `proxy()`
   - Runtime change: Now uses Node.js runtime (edge runtime no longer supported in proxy)
   - Researched official Next.js docs to ensure proper migration
   - Eliminated Vercel build warning: "middleware file convention is deprecated"
2. ✅ **Favicon and branding update** - Replaced template with FleetReq branding
   - Removed dynamic icon generation (`icon.tsx`, `apple-icon.tsx`)
   - Created static SVG icons (`icon.svg`, `apple-icon.svg`) - Next.js recommended approach
   - Designed FR logo: White F overlapping with blue R, no background shape
   - Follows modern icon patterns (shape-based, not geometric backgrounds)
3. ✅ **Metadata cleanup** - Removed Bruce Truong template content
   - Updated title: "FleetReq - Fleet Management & Mileage Tracking"
   - Updated description, keywords for fleet management focus
   - Fixed OpenGraph and Twitter card metadata
   - Changed structured data from Person schema to SoftwareApplication schema
   - Updated footer branding from "Bruce Truong" to "FleetReq"
4. ✅ **Route rename** - /mileage → /dashboard for consistency
   - Renamed `app/mileage/` directory to `app/dashboard/`
   - Updated navigation: "App" → "Dashboard"
   - Updated all internal links throughout codebase (25+ files)
   - Rationale: `/app` would be redundant with domain, `/dashboard` is professional SaaS convention
5. ✅ **Loading state fix** - Eliminated "Loading..." flash for logged-in users
   - Implemented optimistic auth state in AuthComponent
   - Synchronously checks for Supabase auth cookies before async session call
   - Only shows loading state if no auth cookies found
   - Fixes UX issue where logged-in users saw brief "Loading..." on /dashboard and /pricing
   - Rationale: Instant auth state recognition instead of loading flicker
6. ✅ **Keep-alive verification** - Confirmed system is working
   - Verified endpoint responds successfully (8 operations per 4-hour cycle)
   - GitHub Actions cron: 230+ runs completed, running every 4 hours
   - Decision: Wait 7+ days to verify Supabase auto-pause prevention
7. 📋 **Low priority future todo** - Icon refinement
   - Polish FR logo or create custom branded icon
   - May coincide with potential rebrand away from "FleetReq" (if/when)

### **Previous Session (2025-12-17) - Enhanced Keep-Alive & Next.js 16 Migration**
1. ✅ **Enhanced keep-alive system** - Triple-approach strategy to prevent Supabase auto-pause
   - Added direct PostgreSQL connection using `pg` library (native SQL)
   - Added anon key client approach (simulates authenticated user activity)
   - Maintained service role client approach (backward compatibility)
   - Result: 2/3 approaches working (8 database operations every 4 hours)
   - Direct DB approach failed due to DNS (not critical, 2/3 sufficient)
   - Research-based solution from March 2025 community reports
2. ✅ **Next.js security update** - Fixed critical vulnerability
   - Updated Next.js 15.5.3 → 16.0.10
   - Patched CVE-2025-66478 (critical security vulnerability)
   - Installed `pg` library and TypeScript types
   - Reduced vulnerabilities from 3 to 2
3. ✅ **Next.js 16 Turbopack migration** - Fixed build error
   - Replaced webpack config with Turbopack (Next.js 16 default bundler)
   - Error: "This build is using Turbopack, with a webpack config"
   - Solution: Added `turbopack: {}` to next.config.ts
   - Turbopack handles optimization automatically (removed custom webpack config)
4. ✅ **DATABASE_URL configuration** - Enabled direct PostgreSQL connections
   - Constructed DATABASE_URL from Supabase project reference
   - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - Added to `.env.local` for local development
   - Added to Vercel environment variables for production
5. ✅ **Keep-alive endpoint testing** - Verified production deployment
   - Tested `/api/cron/keep-alive` endpoint in production
   - Service role approach: 5 operations successful
   - Anon key approach: 3 operations successful
   - Total: 8 operations per 4-hour cycle (2x previous activity)

### **Previous Session (2025-11-17) - Subscription Cancellation & Account Cleanup**
1. ✅ **Pricing page improvements** - Prevented downgrades and aligned button styling
   - Added subscription plan detection on page load
   - Created `getButtonText()` to show "Current Plan", "Downgrade to X", or default text
   - Created `isButtonDisabled()` to disable current plan and downgrades
   - Created `getButtonStyle()` to apply muted gray for disabled states
   - All downgrade/current plan buttons now use `bg-gray-500 text-gray-300`
2. ✅ **Database migration** - Added cancellation and deletion tracking
   - Migration: `20250117_add_cancellation_tracking.sql`
   - Added 4 new columns to `user_profiles`:
     - `subscription_end_date` - Date when subscription ends/renews
     - `cancellation_requested_at` - Timestamp when user requested cancellation
     - `scheduled_deletion_date` - Date when data will be deleted (subscription_end + 30 days)
     - `cancellation_reason` - Optional reason provided by user
   - Created index for cleanup cron job lookups
3. ✅ **Subscription cancellation flow** - Account Settings UI + backend API
   - Added subscription management section in Settings
   - Shows current plan with color coding and renewal date
   - Created `/api/subscription/cancel` route with Stripe integration
   - Handles `cancel_at_period_end` for Stripe subscriptions
   - Calculates 30-day grace period after subscription ends
   - Updates user_profiles with cancellation tracking data
4. ✅ **Account deletion UX improvements** - Scary modal with confirmation
   - Removed persistent yellow warning box from Settings
   - Changed to simple "Delete Account" red button
   - Redesigned modal to be SCARY with red header and warnings
   - Required confirmation text input: user must type "Confirm Deletion"
   - Button only enables when text matches exactly
5. ✅ **Automated cleanup cron job** - Daily deletion of expired accounts
   - Created `/api/cron/cleanup-expired-accounts` route
   - GET endpoint: Preview accounts ready for deletion (read-only)
   - POST endpoint: Delete accounts where `scheduled_deletion_date < NOW()`
   - Uses service role to bypass RLS for system operations
   - Deletes data in proper order: cars → profiles → auth users
   - Created GitHub Actions workflow running daily at midnight
   - Returns detailed report of deleted accounts and errors
6. ✅ **Documentation updates** - Updated SCHEMA.md
   - Added cancellation columns to user_profiles schema
   - Documented purpose of each column in Key Columns section
   - Updated Last Updated date to 2025-11-17

### **Previous Session (2025-01-17) - Stripe Integration & Tax Tracking**
1. ✅ **Tax Tracking improvements** - Added Business % metric
   - Fixed incorrect `cost_per_mile` display in Tax Tracking panel
   - Added `business_percentage` calculation to stats API
   - Changed title to "Tax Tracking 2025" for year context
   - Replaced "$/Mile" with "Business %" metric (shows % of miles that are business)
   - Formula: `(business_miles / total_miles) * 100`
2. ✅ **ESLint warnings fixed** - Clean build with zero warnings
   - Fixed unused `request` parameter in keep-alive route
   - Removed unused `insertData` variable
3. ✅ **Complete Stripe integration** - Full payment processing system
   - Set up Stripe account (test mode sandbox)
   - Added API keys to `.env.local` and Vercel environment variables
   - Installed Stripe SDK package
   - Created checkout session API route (`/api/checkout/session`)
   - Built success/cancel pages (`/checkout/success`, `/checkout/cancel`)
   - Implemented webhook handler (`/api/webhooks/stripe`)
   - Added `stripe_customer_id` column to `user_profiles` table
   - Connected pricing page buttons to Stripe checkout flow
   - Automatic subscription status updates via webhooks
4. ✅ **Database migration** - Added Stripe customer linking
   - Migration: `20250117_add_stripe_customer_id.sql`
   - Links Supabase users to Stripe customers for billing
   - Indexed for fast lookups
5. 📋 **Pricing tiers configured**
   - Personal: $4/month flat rate
   - Business: $12/vehicle/month (4+ vehicles recommended)
   - Free: Redirects to /mileage (no checkout needed)

### **Previous Session (2025-01-16) - Keep-Alive, Security, Navigation, Performance Metrics**
1. ✅ **Supabase keep-alive system** - Prevents free-tier auto-pause
   - Created `heartbeat` table with auto-cleanup (keeps last 100 records)
   - Added write operations (INSERT + DELETE + SELECT, not just SELECT-only)
   - Increased frequency from daily to every 4 hours (6x per day)
   - Added `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
   - Tested in production - all operations successful
2. ✅ **Critical security fix** - Fixed data leak vulnerability
   - Removed "Allow public read for demo" policies on `fill_ups` and `maintenance_records`
   - Users can now only see their own data (proper RLS enforcement)
   - Cleaned up duplicate SELECT policies (one clean policy per table)
3. ✅ **Database security audit** - Verified database isolation
   - Confirmed all tables have RLS enabled
   - Verified all database roles are legitimate Supabase system roles
   - Verified `profiles` table is unused (can be safely dropped)
4. ✅ **Documentation updates**
   - Updated SCHEMA.md with RLS policies for all tables
   - Added `heartbeat` table documentation to SCHEMA.md
   - Removed legacy `profiles` table from documentation
   - Updated CLAUDE.md with complete session summary
5. ✅ **Navigation bug fix** - AuthComponent stuck in loading state
   - Fixed infinite "Loading..." when Supabase client is null
   - Now shows clear error message if environment variables are missing
   - Clicking "App" while logged in now goes directly to the app (not login page)
6. ✅ **Naming options research** - Documented comprehensive naming alternatives
   - Added FleetSync, KarDock, AutoDock, CarDock, VehicleDock analysis
   - Market fit comparison table for B2B vs consumer appeal
   - Selected fleetreq.app as primary domain (available on Namecheap)
7. ✅ **PWA strategy planning** - Mobile app vs PWA decision
   - Decided: PWA first (Phase 1), native apps later (Phase 2 after PMF)
   - PWA promoted to high priority (quick win, 80% of native app benefits)
8. 📋 **Performance overview redesign planned** - Tax metrics for contractors
   - Identified "Spent" metric confusion (fuel only, no YTD, no tax value)
   - Planned Cost Per Mile, YTD calculations, Tax Deduction display
   - Promoted to #1 priority (core value prop for contractor market)

### **Previous Session (2025-10-10) - Security Hardening**
1. ✅ **Security analysis completed** - Comprehensive review of application security
2. ✅ **Security headers configured** - Added vercel.json with CSP, HSTS, X-Frame-Options, etc.
3. ✅ **Rate limiting library created** - lib/rate-limit.ts with multiple tier limits
4. ✅ **Input validation library created** - lib/validation.ts with comprehensive sanitization
5. ✅ **Security documentation** - Created SECURITY.md with vulnerabilities, mitigations, best practices
6. ✅ **CLAUDE.md updated** - Added security reference section with new libraries

### **Previous Session (2025-10-01)**
1. ✅ **Fixed `subscriptionPlan` variable bug** - Was referencing undefined variable, now uses `userSubscriptionPlan`
2. ✅ **Consolidated all CLAUDE.md files** - Single source of truth in fleetreq-platform folder
3. ✅ **Added Principle #4: Document WITH Rationale** - Prevents circular debates
4. ✅ **Environment setup** - Copied .env.local, ensured port 3000, fixed Supabase connection
5. ✅ **Testing infrastructure** - 46 automated tests passing, created TESTING_CHECKLIST.md

### **Previous Major Fixes (2025-10-01)**
1. ✅ **Data Isolation** - Fixed API routes to filter by `user_id`, prevented data leakage
2. ✅ **Free Tier Permissions** - View-only maintenance with paywall overlay
3. ✅ **Vehicle Limit Enforcement** - Shows count (0/1, 1/3, etc), disables at limit
4. ✅ **Delete Car Functionality** - Two-step confirmation, cascade deletes
5. ✅ **First-Time UX** - Guided onboarding, disabled tabs until first car added

---

## 📋 Current Tasks & Priorities

### **🔄 Active Now**
- [ ] **Manual browser testing** - Test all 3 subscription tiers with test accounts
  - Use TESTING_CHECKLIST.md for comprehensive scenarios
  - Verify data isolation, feature gating, vehicle limits
  - Test in both light and dark mode

### **🆕 Next Immediate (This Week)**
1. **Redesign Performance Overview with Tax Metrics** (HIGHEST PRIORITY - Core Value Prop)
   - **Problem**: Current "Spent" metric is confusing (fuel only, no YTD, no tax value)
   - **Solution**: Add critical tax/business metrics for contractor market
   - **Implementation**:
     - Add **Cost Per Mile** calculation: `(fuel + maintenance) / total miles`
     - Add **YTD Total Cost**: Fuel + Maintenance year-to-date
     - Add **YTD Business Miles**: For tax deduction calculation
     - Add **Standard Mileage Deduction**: Business miles × $0.67 (IRS rate)
     - Add **This Month** spending: Current month fuel + maintenance
     - Split display by tier: Business (tax focus) vs Personal (budgeting focus)
   - **Phase 1 Metrics** (This Week):
     - Cost Per Mile, YTD Fuel, YTD Maintenance, This Month, Tax Deduction (Business only)
   - **Phase 2** (Next Month):
     - Business vs Personal mileage split, Monthly trends, Projected annual costs
   - **Why #1 Priority**: Core value proposition for contractors ("Save $8,000+ on taxes")
   - **Files to modify**:
     - `app/api/stats/route.ts` - Add YTD/monthly calculations
     - `app/mileage/page.tsx` - Redesign performance overview UI
     - Add business/personal trip categorization (future)
2. **Integrate security improvements** (HIGH PRIORITY)
   - Add rate limiting to all API routes (lib/rate-limit.ts)
   - Add input validation to all API routes (lib/validation.ts)
   - Remove debug info from production responses (app/api/cars/route.ts)
   - Test security headers at securityheaders.com
3. **Add PWA (Progressive Web App) support** (HIGH PRIORITY - Quick Win)
   - Install next-pwa package
   - Configure manifest.json (app name, icons, colors)
   - Add service worker for offline support
   - Enable "Install App" prompt for mobile users
   - Test on iOS Safari + Android Chrome
   - **Effort**: 2-3 days | **Impact**: 80% of native app benefits with 20% of effort
   - **Why now**: Users can add fill-ups/maintenance on-the-go, works offline, installable on home screen
4. **Update browser tab icon (favicon)** - Currently shows Vercel default icon instead of custom FleetReq branding
5. **First-time UX improvements** - Better onboarding flow for new users
6. **Data retention enforcement** - 90-day limit for free tier
7. **Bug fixes from testing** - Address any issues found during manual testing

### **📅 Short-term (Next Month)**
- **Stripe billing integration** - Subscription management, payment processing
- **Professional reporting (Business)** - Tax-compliant mileage reports, export to CSV/PDF
- **Team invitation system (Business)** - Invite users by email, role-based permissions
- **Excel import tools** - Migration wizard for contractors
- **Custom autocomplete component** - Replace native `<datalist>` with mobile-friendly autocomplete for gas stations and locations (current implementation works on desktop + Android, but poor iOS support)

### **🔮 Medium-term (3-6 Months)**
- **Native mobile apps (iOS + Android)** - After PWA proves product-market fit
  - Build when: >60% mobile usage, $10k+ MRR, App Store visibility becomes critical
  - Use React Native or Flutter for shared codebase
  - Cost: ~$30k, 3 months dev time
  - Features PWA can't handle: GPS background tracking, advanced offline sync
- **Advanced analytics** - Cost per mile, predictive maintenance
- **Custom branding (Business)** - Company logo, custom colors, branded reports
- **Domain purchase** - Register fleetreq.app when ready for launch

---

## 🔐 Test Accounts & Admin Access

### **Admin User**
- **Email**: `deeahtee@live.com`
- **User ID**: `b73a07b2-ed72-41b1-943f-e119afc9eddb`
- **Privileges**: Bypass all limits, 999 vehicles, purple "ADMIN" badge

### **Test Accounts**

**1. Free Tier:**
- **Email**: `test-free@fleetreq.com`
- **Password**: `TestFree123!`
- **Limits**: 1 vehicle, view-only maintenance, 90-day history

**2. Personal Tier:**
- **Email**: `test-personal@fleetreq.com`
- **Password**: `TestPersonal123!`
- **Limits**: 3 vehicles, full maintenance access, unlimited history

**3. Business Tier:**
- **Email**: `test-business@fleetreq.com`
- **Password**: `TestBusiness123!`
- **Limits**: 999 vehicles (unlimited), all features, team collaboration

---

## 📚 Technical Reference

### **Tech Stack**
- **Framework**: Next.js 15 with App Router, TypeScript
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Chart.js with react-chartjs-2
- **Hosting**: Vercel (auto-deploy from main branch)

### **Database Schema**
- `auth.users` → Supabase managed authentication
- `user_profiles` → Subscription plans (pk: `id` links to `auth.users.id`)
- `cars` → Vehicles (fk: `user_id` → `auth.users.id`) ⚠️ Uses `user_id` NOT `owner_id`
- `fill_ups` → Fuel records (fk: `car_id` → `cars.id`)
- `maintenance_records` → Maintenance (fk: `car_id` → `cars.id`)
- `heartbeat` → Keep-alive activity tracking (system table, service_role only)

**RLS Policies**: User tables use `auth.uid() = user_id` pattern. System tables (heartbeat) use service_role only.

### **Authentication Architecture**

**Client-Side:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(url, key)
// Stores session in cookies (NOT localStorage)
```

**Server-Side API Routes:**
```typescript
import { createRouteHandlerClient } from '@/lib/supabase'
const supabase = await createRouteHandlerClient(request)
// Reads session from request.cookies (NOT cookies() helper)
// Must accept request: NextRequest parameter
```

**Key Rules:**
- ❌ Don't use `@supabase/supabase-js` `createClient()` - breaks SSR
- ❌ Don't use `cookies()` helper in Route Handlers
- ✅ Always use `createBrowserClient()` for client-side
- ✅ Always use `createRouteHandlerClient(request)` for API routes

### **Supabase RLS Policy Pattern**
```sql
-- SELECT (View)
CREATE POLICY "users_select_own_data"
  ON table_name FOR SELECT TO public
  USING (auth.uid() = user_id);

-- INSERT (Create)
CREATE POLICY "users_insert_own_data"
  ON table_name FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

-- UPDATE (Edit)
CREATE POLICY "users_update_own_data"
  ON table_name FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE (Remove)
CREATE POLICY "users_delete_own_data"
  ON table_name FOR DELETE TO public
  USING (auth.uid() = user_id);
```

### **Feature Access Pattern**
```typescript
import { hasFeatureAccess, getUpgradeMessage } from '@/lib/supabase-client'

const hasAccess = hasFeatureAccess(user.id, userSubscriptionPlan, 'maintenance_tracking')

if (!hasAccess) {
  const message = getUpgradeMessage('maintenance_tracking')
  // Display paywall overlay
}
```

### **Supabase Keep-Alive (Auto-Pause Prevention)**

**Problem**: Supabase free-tier pauses projects after 7 days of inactivity.

**Solution**: Automated keep-alive system with write operations every 4 hours.

**Components**:
- `.github/workflows/keep-alive.yml` - GitHub Actions cron (runs every 4 hours)
- `app/api/cron/keep-alive/route.ts` - API endpoint that performs database operations
- `supabase/migrations/20250116_create_heartbeat_table.sql` - Heartbeat table migration
- `public.heartbeat` table - Tracks all keep-alive pings with auto-cleanup

**Schedule**: Runs 6 times per day at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC

**Operations per ping**:
1. **INSERT** - Adds heartbeat record (proves write activity)
2. **DELETE** - Removes old records beyond last 100 (proves write activity + keeps table small)
3. **SELECT** - Reads from 4 tables (verifies database accessibility)

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS for system operations)

**Why this works**:
- **Frequency**: 4-hour intervals match proven community solutions (Chrome extensions)
- **Write operations**: INSERT + DELETE ensure "meaningful" activity beyond SELECT-only queries
- **Research-based**: Community reports indicate SELECT-only queries may not prevent pausing

**Monitoring**:
- Check GitHub Actions logs: Verify workflow runs every 4 hours
- Check Supabase heartbeat table: Verify records are being inserted
- Endpoint test: `curl https://fleetreq.vercel.app/api/cron/keep-alive`

**Rationale**: Root cause solution based on community research. Combines frequent pings (4hrs) with write operations (INSERT/DELETE) to maximize activity recognition by Supabase's auto-pause detection system.

---

### **Automated Account Cleanup (GDPR Compliance)**

**Problem**: Need to permanently delete user data after subscription cancellation grace period.

**Solution**: Automated daily cleanup system that deletes accounts past their scheduled deletion date.

**Components**:
- `.github/workflows/cleanup-expired-accounts.yml` - GitHub Actions cron (runs daily)
- `app/api/cron/cleanup-expired-accounts/route.ts` - API endpoint that deletes expired accounts
- `supabase/migrations/20250117_add_cancellation_tracking.sql` - Cancellation tracking migration
- `user_profiles.scheduled_deletion_date` - Date when account should be deleted

**Schedule**: Runs daily at 00:00 UTC (midnight)

**Cancellation Flow**:
1. User clicks "Delete Account" in Settings
2. User confirms by typing "Confirm Deletion" in scary modal
3. Backend calls `/api/subscription/cancel`:
   - Cancels Stripe subscription with `cancel_at_period_end: true`
   - Sets `cancellation_requested_at` to NOW()
   - Sets `subscription_end_date` to current period end
   - Sets `scheduled_deletion_date` to subscription_end + 30 days
4. Account remains active until `subscription_end_date`
5. 30-day grace period for reactivation
6. Daily cron job deletes all data after `scheduled_deletion_date` passes

**Deletion Order** (cleanup cron job):
1. Delete all cars (cascades to fill_ups and maintenance_records)
2. Delete user_profiles record
3. Delete from auth.users (Supabase Admin API)

**API Endpoints**:
- `GET /api/cron/cleanup-expired-accounts` - Preview accounts ready for deletion (read-only)
- `POST /api/cron/cleanup-expired-accounts` - Execute deletion (returns detailed report)

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS for system operations)
- `CRON_SECRET` - Optional authorization token for cron endpoints

**Monitoring**:
- Check GitHub Actions logs: Verify workflow runs daily
- Check user_profiles table: Monitor `scheduled_deletion_date` column
- Endpoint test: `curl -X POST https://fleetreq.vercel.app/api/cron/cleanup-expired-accounts`

**Rationale**: GDPR compliance requires permanent deletion of user data upon request. 30-day grace period balances user protection (accidental cancellation) with legal requirements (right to be forgotten).

---

## 📁 Key Files & Structure

### **Application Core**
- `app/mileage/page.tsx` - Main dashboard (2500+ lines)
- `app/page.tsx` - Landing page
- `app/pricing/page.tsx` - Pricing table

### **Components**
- `components/AuthComponent.tsx` - Auth UI & session management
- `components/UpgradePrompt.tsx` - Paywall overlays
- `app/theme-toggle.tsx` - Light/dark toggle

### **API Routes**
- `app/api/cars/route.ts` - GET/POST/PATCH vehicles
- `app/api/cars/[id]/route.ts` - DELETE vehicle
- `app/api/fill-ups/route.ts` - GET/POST fuel records
- `app/api/maintenance/route.ts` - GET/POST maintenance

### **Library Files**
- `lib/supabase.ts` - Server-side clients
- `lib/supabase-client.ts` - Client-side + helpers:
  - `isAdmin()`, `getUserSubscriptionPlan()`, `getUserMaxVehicles()`
  - `hasFeatureAccess()`, `getUpgradeMessage()`

### **Documentation (Critical - Always Check Before DB Operations)**
- `SCHEMA.md` - Complete database schema (tables, columns, constraints, indexes)
- `FUNCTIONS.md` - Database functions and triggers (auto-calculated fields, auto-created records)
- `CLAUDE.md` - Development context and principles (this file)
- `SECURITY.md` - Security documentation, vulnerabilities, and best practices (NEW 2025-10-10)

### **Security Libraries (NEW - 2025-10-10)**
- `lib/rate-limit.ts` - Rate limiting middleware for API protection
  - `rateLimit()` - Check rate limits by identifier
  - `RATE_LIMITS` - Predefined limits (AUTH, READ, WRITE, EXPENSIVE, ANONYMOUS)
  - `getRateLimitHeaders()` - Standard rate limit response headers
- `lib/validation.ts` - Input validation and sanitization
  - `sanitizeString()`, `validateEmail()`, `validateUUID()`, `validateDate()`
  - `validateInteger()`, `validateFloat()`, `validateYear()`
  - `validateMaintenanceType()`, `validateFuelType()`, `validateSubscriptionPlan()`
  - `ValidationError` - Custom error class for validation failures
- `vercel.json` - Security headers configuration (CSP, HSTS, X-Frame-Options, etc.)

### **Styling**
- `app/globals.css` - Custom classes:
  - `.card-professional` - Main card style
  - `.glass-morphism` - Tab navigation
  - `.shadow-elegant` - Shadow system

---

## 🔄 Development Workflow

### **Daily Development**
```bash
cd /d/Documents/coding/fleetreq-platform
npm run dev  # MUST run on http://localhost:3000
```

### **Git Workflow**
```bash
git status
git add [files]
git commit -m "emoji TYPE: description"  # e.g., ✨ FEATURE: Add delete car
git push  # Auto-deploys to fleetreq.vercel.app
```

**Commit Emoji Prefixes:**
- ✨ `FEATURE:` New feature
- 🐛 `FIX:` Bug fix
- ♻️ `REFACTOR:` Code refactoring
- 🎨 `DESIGN:` UI/UX improvements
- 📝 `DOCS:` Documentation
- 🔐 `SECURITY:` Security fixes

**IMPORTANT**: NO mentions of Claude, AI tools, or "Co-Authored-By"

### **Testing Strategy**
1. Test with admin account first
2. Test with test-free, test-personal, test-business accounts
3. Test in both light and dark mode
4. Test responsive design (mobile, tablet, desktop)

---

## 💰 Pricing Strategy - Volume Optimized

### **Free Tier (Lead Generation)**
- 1 vehicle maximum
- Basic fuel tracking & MPG
- **View-only** maintenance status
- 90-day data history
- **Rationale**: Trial for individuals, prevents account sharing through feature limitations

### **Personal Tier - $4/month**
- Up to 3 vehicles
- **Full maintenance tracking** (add/edit)
- Unlimited history
- Mobile app access (future)
- Export capabilities
- **Target**: Families (2-3 cars), hobbyists
- **Rationale**: $4 = "coffee money" impulse purchase (was $8). Targets 10x larger market through family segment. Conversion psychology: easier recommendations, viral growth.

### **Business Tier - $12/vehicle/month**
- Unlimited vehicles (4+ recommended)
- Up to 6 team members
- Tax mileage tracking (IRS-compliant)
- Professional reporting
- Priority support
- **Target**: Small contractors (5-15 vehicles)
- **Rationale**: $12/vehicle = 65% below market average ($35/vehicle). Essential contractor features without enterprise complexity.

---

## 🔒 Freemium Conversion Strategy

### **Problem**: Account Sharing Prevention
Users could share free accounts to avoid paid plan costs.

### **Solution**: Progressive Feature Tiers

**Free Tier - Basic Tracking (Lead Magnet):**
- ✅ **Fuel tracking**: Full add/view/edit fuel records
- ✅ **Basic maintenance tracking**: Add maintenance records (date, mileage, cost, notes)
- ✅ **View maintenance status**: 🟢 Good / 🔴 Overdue indicators only
- ✅ **Default intervals**: Uses standard maintenance schedules (can't customize)
- ❌ **No yellow warnings**: Warning status suppressed (80% threshold hidden)
- ❌ **No custom schedules**: Can't set "next service date" or "next service mileage"
- ❌ **90-day history limit**: Only last 3 months of data (not yet enforced)
- ❌ **No data export**: Can't download records
- ❌ **No receipt photos**: Can't upload documentation

**Personal Tier - Smart Alerts ($4/month):**
- ✅ Everything in Free
- ✅ **Yellow warning alerts**: 🟡 Status when approaching due (80% threshold)
- ✅ **Custom next service**: Set specific "next service date" and "next service mileage"
- ✅ **Detailed countdowns**: "2 weeks left", "500 miles remaining" (future)
- ✅ **Unlimited history**: Access all historical data
- ✅ **Data export**: CSV + PDF reports
- ✅ **Basic receipt storage**: 50MB photo storage
- ❌ **No team features**: Single user only
- ❌ **No custom intervals**: Can't change default maintenance schedules

**Business Tier - Full Control ($12/vehicle/month):**
- ✅ Everything in Personal
- ✅ **Custom maintenance intervals**: Change 6-month oil to 3-month, etc. (future)
- ✅ **Team collaboration**: Multi-user access with roles (future)
- ✅ **Unlimited receipt storage**: Full documentation with photos
- ✅ **Advanced reporting**: IRS-compliant tax reports, fleet analytics
- ✅ **OCR auto-extract**: Auto-fill maintenance from receipt photos (future)
- ✅ **Priority support**: Dedicated support channels

**Why This Prevents Sharing:**
- Free tier is useful (basic tracking) but limited (no warnings, no custom schedules)
- Families need yellow warnings to prevent missed maintenance → Personal tier
- Contractors need receipt storage for taxes + team access → Business tier
- Tax/fleet data contains sensitive business info (can't be shared)

**Rationale**: Free tier provides real value (basic tracking) but Personal tier adds convenience (yellow warnings, custom schedules) that families need. Business tier adds essential features (receipts, team access, tax reports) that contractors can't operate without.

---

## 🚀 Strategic Direction

### **Target Market - DUAL FUNNEL**

**Primary Market (Volume)**: Families & Individual Consumers
- Mass App Store downloads for brand awareness
- Free app → Personal tier ($4/month)
- Market Size: 100M+ potential users in US

**Secondary Market (Revenue)**: Small Contractors (5-15 vehicles)
- High-value B2B conversions
- Free trial → Business tier ($12/vehicle/month)
- Market Size: 6M small businesses with commercial vehicles

**Rationale**: Dual market strategy maximizes both volume (families) and revenue (contractors). Families provide App Store rankings and brand awareness. Contractors provide sustainable revenue at 65% below market pricing.

### **Mobile Strategy (Phase 2: 6-12 months)**

**Free Mobile App**:
- Basic maintenance reminders
- Fuel logging
- Status indicators
- **Limitations**: No full maintenance logging, no detailed notifications, no team features

**Personal Tier Mobile**:
- Full maintenance logging
- Detailed notifications
- Customizable alerts
- Unlimited history

**Business Tier Mobile**:
- Team notifications
- GPS mileage tracking
- Field data entry
- Offline sync

**Rationale**: Free app drives massive downloads → App Store rankings → organic discovery. Convenience limitations create upgrade pressure.

### **Naming Challenge (Deprioritized)**
**Current**: FleetReq (Fleet Requirements / Fleet Records)
- ✅ Works for B2B contractors
- ❌ Alienates consumer market (families don't have "fleets")
- **Status**: Not critical for launch, consider rebrand if mobile strategy requires consumer appeal

---

## ✅ Completed Features

### **Authentication & Security**
- Cookie-based auth with `@supabase/ssr`
- Email/Password + Google OAuth
- Row Level Security (RLS) for data isolation
- User profiles with subscription plans

### **Core Features**
- Fuel efficiency tracking with MPG charts
- Maintenance system (8 types, time + mileage alerts)
- Color-coded status (🟢/🟡/🔴)
- Records management (search, filter, pagination)
- Vehicle limit enforcement
- Paywall overlays for free tier

### **UX/Design**
- Professional card-based layout
- Light/dark mode toggle
- Responsive design
- First-time user onboarding
- Admin badge system

---

## 📱 REFERENCE: Detailed Mobile App Strategy

### **Phase 2 (6-12 months): Free Mobile App**

**Why This Matters:**
```
More downloads → App Store rankings → Organic discovery → More users → Higher conversion
```

**🆓 FREE App (Hook Users):**
- View vehicle list
- See maintenance status (green/yellow/red)
- Basic notifications (3-day warning)
- View fuel history (last 5 fill-ups)
- Add fuel

**Strategic Limitations:**
- No maintenance logging on mobile
- No detailed notifications
- No customizable alerts
- Limited history (30 days)

**💰 PERSONAL Tier (Mobile Convenience):**
- Full maintenance logging on mobile
- Detailed notifications
- Customizable alerts
- Complete history
- Photo attachments
- Fuel efficiency charts

**🏢 BUSINESS Tier (Team & Pro Features):**
- Team notifications
- GPS mileage tracking
- Field data entry
- Offline sync
- Role-based permissions
- Professional reporting

**Strategic Benefits:**
- Maximum App Store visibility through free downloads
- Brand awareness at scale
- Daily engagement through notifications
- Natural upgrade path from free → paid
- Competitive moat (most competitors charge $25+)

---

## 🎯 REFERENCE: Competitive Analysis

### **Our Core Strengths**
- Fuel & efficiency tracking with MPG charts
- Preventive maintenance scheduling (8 types)
- Tax mileage tracking (IRS-compliant)
- Team collaboration
- User audit tracking
- 65% below market pricing

### **Missing (Future Pipeline)**

**High Priority (Next 3-6 months):**
- **Photo/Receipt Upload**: Store maintenance receipts and documentation
  - Free: None
  - Personal: 50MB storage, basic photo gallery
  - Business: Unlimited storage, organized by vehicle/service type
- **Data Export/Backup**: Download complete vehicle history
  - Free: None (view-only)
  - Personal: CSV export with date range filters
  - Business: CSV + PDF + JSON, scheduled exports, automated backups
- **OCR Auto-Extract** (Business only): Auto-fill maintenance records from receipt photos
  - Scan date, mileage, cost, service type from shop receipts
  - AI-powered extraction with manual review/edit
  - Reduces data entry time for fleet managers

**Medium Priority (6-12 months):**
- GPS/Real-time vehicle tracking
- Route optimization
- Driver behavior monitoring
- Fuel card integration
- Digital work orders
- QuickBooks integration
- Predictive maintenance (AI)

### **Market Positioning**
"Maintenance + Tax Specialist" vs Full-Featured Platforms
- Our Position: 65% cheaper with 40% of features
- Competitor Pricing: $25-45/vehicle/month
- Our Pricing: $12/vehicle/month
- Value Prop: Essential contractor features without enterprise complexity

---

## 🌐 REFERENCE: Domain & Branding

### **Selected: FleetReq**
- **Primary Domain**: fleetreq.app (available on Namecheap)
  - Perfect for web/mobile app
  - Modern, trusted extension
  - Appeals to both consumers and businesses
- **Alternative**: fleetreq.com (available, not registered yet)
- Concept: Fleet Requests + Fleet Records (dual meaning)
- Appeals to: Contractors (work orders) + Admins (compliance)
- Status: Hold registration until ready for launch

### **Other Options Researched**

**Original List:**
- **FleetSync** - Emphasizes synchronization and real-time updates
- fleetix.com, vehiclx.com, recordfleet.com, fleetrek.com
- All available if rebrand needed for consumer market

**"Dock" Concept (Storage/Organization Focus):**
- **KarDock** - Car Dock or Car Documents
  - Pros: Short, memorable, modern/tech sound, consumer-friendly
  - Cons: "K" spelling seems gimmicky, confusion with car phone mounts, less professional for B2B
  - Target: Families/consumers (1-3 vehicles)
  - Perception: Slightly Germanic/Nordic feel, not strongly tied to any language
- **CarDock** - Normal spelling, more professional than KarDock
  - Pros: Clear concept, professional, no gimmicks
  - Cons: Still risk of confusion with phone mounts
  - Target: Balanced consumer/B2B
- **AutoDock** - Broader appeal than "Car"
  - Pros: Professional, "Auto" includes trucks/commercial vehicles, avoids phone mount confusion
  - Cons: Less personal/friendly than "Car"
  - Target: Broader market (consumers + light commercial)
- **VehicleDock** - Most professional option
  - Pros: Professional, clear, B2B-friendly
  - Cons: Longer, less catchy, more corporate
  - Target: B2B-first

**"Keep/Log/Vault" Concepts (Record-Keeping Focus):**
- **KarKeep** - Emphasizes record-keeping
  - Pros: Rhymes (catchy), clear purpose
  - Cons: "K" spelling issue, less tech-sounding
  - Target: Families/personal use
- **KarLog** - Simple, clear logging concept
  - Pros: Short, clear, developer-friendly
  - Cons: "K" spelling, sounds technical/boring
  - Target: DIY enthusiasts, hobbyists
- **KarVault** - Security/storage focus
  - Pros: Implies security, professional
  - Cons: "K" spelling, might seem too serious
  - Target: Document storage, compliance-focused

**Market Fit Analysis:**
| Name | B2B Contractors | Families/Consumers | Professional | Tech-Savvy |
|------|----------------|--------------------|--------------| ------------|
| FleetReq | ✅ Strong | ⚠️ Weak | ✅ Yes | ✅ Neutral |
| FleetSync | ✅ Strong | ✅ Good | ✅ Yes | ✅ Strong |
| KarDock | ⚠️ Weak | ✅ Strong | 🤷 Casual | ✅ Strong |
| CarDock | 🤷 Neutral | ✅ Strong | ✅ Good | ✅ Good |
| AutoDock | ✅ Good | ✅ Good | ✅ Yes | ✅ Good |
| VehicleDock | ✅ Strong | ⚠️ Weak | ✅ Yes | 🤷 Neutral |

**Recommendation by Strategy:**
- **B2B-first, expand to consumers**: FleetReq.app or VehicleDock
- **Consumer-first, expand to B2B**: AutoDock or CarDock
- **Pure consumer focus**: KarDock or KarKeep
- **Balanced dual-market**: AutoDock or FleetSync

**Domain Priority Check:**
- fleetreq.app - ✅ Available on Namecheap
- Other domains - Not yet checked

---

*Last Updated: 2025-11-17*
*Session: Subscription cancellation & account cleanup automation*
*Status: Complete subscription management system with GDPR-compliant data deletion*
*Next: Manual browser testing of subscription cancellation flow and account deletion*
