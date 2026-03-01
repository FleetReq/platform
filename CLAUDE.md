# FleetReq Platform - Development Context

> Single source of truth for FleetReq development.

---

## 🚨 CRITICAL DEVELOPMENT PRINCIPLES

### 0. CLAUDE.md is Auto-Loaded
This file loads automatically at session start. Review principles, recent summary, and tasks before starting work.

### 1. Root Cause Solutions - NO Workarounds
Fix underlying problems properly. No band-aids or temporary patches.

### 2. Consider All Options
Evaluate requests but present better alternatives with pros/cons if they exist. Let user decide.

### 3. Professional & Consistent Design
Follow established patterns (card styles, spacing, colors). Test both light/dark modes. Maintain WCAG 2.1 AA.

### 4. Maintain CLAUDE.md Carefully
Search before adding. Find the logical section. Merge duplicates. Keep compact.

### 5. Apply Fixes Systematically
When fixing a bug, grep for the same pattern across ALL similar files. Fix everywhere in one session.

### 6. Verify SCHEMA.md and FUNCTIONS.md Before DB Operations
Check column names, constraints, triggers before any INSERT/UPDATE code. Don't assume names (`user_id` vs `owner_id` vs `created_by_user_id`). Don't set auto-calculated fields (`mpg`, `updated_at`). Update both files if schema changes.

### 7. Save Context Continuously
Update CLAUDE.md immediately after completing work or making strategic decisions — don't wait until end of session. Sessions can hit limits unexpectedly, and anything not written to a file is lost.

---

## 🎯 Repository Information

- **Path**: `/d/Documents/coding/fleetreq-platform`
- **GitHub**: `git@github.com:FleetReq/platform.git`
- **Live**: https://fleetreq.vercel.app
- **Deploy**: Vercel (auto-deploys from main)

---

## 🚨 PRE-SESSION SETUP CHECKLIST

1. **Working directory**: `pwd` → must be `/d/Documents/coding/fleetreq-platform`
2. **Environment**: `ls -la .env.local` must exist (copy from `/d/Documents/coding/my-resume-site/.env.local` if missing)
   - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Port 3000**: `netstat -ano | grep :3000 | grep LISTENING` — kill if in use
   - Google OAuth redirects to `localhost:3000` — any other port breaks auth
4. **Dev server**: `npm run dev` → verify `http://localhost:3000`
5. **Supabase**: Navigate to localhost:3000 — should NOT show "URL and Key required" error

---

## 📝 Recent Session Summary

### Latest (2026-02-16) - Multi-Org Switching Support
- **Users can now belong to multiple orgs simultaneously** and switch between them
- `lib/org.ts`: Added `getUserOrgs()`, modified `getUserOrg()` + 5 helpers to accept optional `activeOrgId`
- `lib/supabase-client.ts`: Added `getActiveOrgId()` cookie helper, updated client-side plan/vehicle queries
- All 16 API routes updated to read `fleetreq-active-org` cookie and pass to org helpers
- New `POST /api/org/switch` endpoint sets cookie to switch active org
- `GET /api/org?all=true` lists all user's orgs (for switcher dropdown)
- `POST /api/org/accept-invite` is now **non-destructive** — keeps existing memberships, just adds new one
- Org switcher in `app/components/navigation.tsx` (hidden for single-org users)
- Dashboard `handleOrgSwitch` reloads plan, role, and all data; resets selectedCarId
- Cookie: `fleetreq-active-org` (not httpOnly, sameSite lax, 1yr maxAge)

### Previous (2026-02-16) - Multi-Tenancy / Organizations
- **Full org-based multi-tenancy implementation** (4 phases complete)
- Phase 1-4: organizations, org_members, RLS, 16 API routes, OrgManagement component, invite flow

### Previous (2026-02-16) - Login/Dashboard Separation & Maintenance Update
- Separated `/login` and `/dashboard` into distinct routes
- Server-side auth redirects in `proxy.ts`
- Added `differential_fluid` maintenance type

> Full session history: `docs/SESSION_HISTORY.md`

---

## 📋 Current Tasks & Priorities

### 🔄 Active
- [x] **Run org migration SQL** — Executed `database/org_multi_tenancy.sql` against Supabase (2026-02-16)
- [ ] Manual browser testing (all 3 tiers + org roles, light/dark, TESTING_CHECKLIST.md)

### 🆕 Next Up
1. **Performance Overview redesign** — Tax metrics for contractors (Cost Per Mile, YTD costs, IRS deduction). Core value prop. Files: `app/api/stats/route.ts`, `app/dashboard/page.tsx`
2. ~~**Security integration**~~ ✅ Done (2026-02-28) — All 21 user-facing routes use middleware with rate limiting; all data-mutating routes use `lib/validation.ts`
3. **PWA support** — `next-pwa`, manifest, service worker, install prompt
4. **First-time UX improvements** — Better onboarding flow

### 📅 Short-term
- Professional reporting (CSV/PDF export)
- Excel import wizard
- Custom autocomplete (replace `<datalist>` for iOS)
- ~~**Remember last-used vehicle (ISSUE-16)**~~ ✅ Done (2026-02-28)
- ~~**DashboardClient.tsx split (ISSUE-17)**~~ ✅ Done (2026-02-28) — extracted `UserSettings` + `FuelChartPanel`; DashboardClient is now ~2250 lines

### 🔮 Medium-term (3-6 months)
- Native mobile apps (after PWA proves PMF)
- Advanced analytics, predictive maintenance
- Domain purchase (fleetreq.app)
- **B2B shop model** — White-label for repair shops (`<company>.fleetreq.com`). Shop logs services, customers get reminders. Track ROI: email open/click rates, overdue→completed conversions, "Book Now" clicks. Validate with 2-3 shops before building. See Option C (shop-only, no customer login) as MVP.

### 🧊 Shelved (revisit when revenue justifies API costs)
- Odometer photo OCR (AI Vision, ~$0.01-0.03/photo)
- Receipt scanning (AI Vision, ~$0.02-0.05/scan, auto-fill fuel log)
- Both share same pipeline — building one gets most of the other

---

## 🔐 Test Accounts

| Tier | Email | Password | Limits |
|------|-------|----------|--------|
| **Admin** | `deeahtee@live.com` | (Google OAuth) | 999 vehicles, purple badge |
| **Free** | `test-free@fleetreq.com` | `FR-GcD9zG40Ldde1orQ` | 1 vehicle, view-only maintenance |
| **Personal** | `test-personal@fleetreq.com` | `FR-ECDUmv9YPDGHpWyP` | 3 vehicles, full maintenance |
| **Business** | `test-business@fleetreq.com` | `FR-HPJs8GpeK9gpYixL` | 999 vehicles, all features |

Admin User ID: `b73a07b2-ed72-41b1-943f-e119afc9eddb`

---

## 📚 Technical Reference

### Tech Stack
Next.js 16 (App Router, TypeScript) · Supabase PostgreSQL (RLS) · Supabase Auth (Email + Google OAuth) · Tailwind CSS · Chart.js · Vercel

### Database Schema

| Table | Purpose | Key FK |
|-------|---------|--------|
| `auth.users` | Authentication (Supabase managed) | — |
| `user_profiles` | User preferences (email, name, admin) | `id` → `auth.users.id` |
| `organizations` | Orgs with billing/subscription | — |
| `org_members` | Org membership + roles | `org_id` → `organizations.id`, `user_id` → `auth.users.id` |
| `cars` | Vehicles | `org_id` → `organizations.id`, `user_id` → `auth.users.id` |
| `fill_ups` | Fuel records | `car_id` → `cars.id` |
| `maintenance_records` | Maintenance | `car_id` → `cars.id` |
**Access control**: Org-based via `org_members`. Roles: Owner / Editor / Viewer. RLS uses `user_org_ids()` helper functions.
**Multi-org**: Users can belong to multiple orgs. Active org selected via `fleetreq-active-org` cookie. All API routes respect it.
**Billing**: Lives on `organizations` table (stripe_customer_id, subscription_plan, etc). Each org has independent billing.
**Key library**: `lib/org.ts` — `getUserOrg()`, `getUserOrgs()`, `canEdit()`, `isOrgOwner()`, `verifyCarAccess()`

### Authentication Architecture

**Client-side**: `createBrowserClient()` from `@supabase/ssr` (cookies, NOT localStorage)
**Server-side API routes**: `createRouteHandlerClient(request)` from `@/lib/supabase` (reads `request.cookies`)

- ❌ Don't use `@supabase/supabase-js` `createClient()` — breaks SSR
- ❌ Don't use `cookies()` helper in Route Handlers
- ✅ `createBrowserClient()` for client, `createRouteHandlerClient(request)` for API

### Cron Systems

| System | Schedule | Key Files |
|--------|----------|-----------|
| **Account cleanup** (GDPR deletion) | Daily midnight | `.github/workflows/cleanup-expired-accounts.yml`, `app/api/cron/cleanup-expired-accounts/route.ts` |
| **Maintenance emails** (Resend digest) | Mondays 8AM UTC | `.github/workflows/maintenance-notifications.yml`, `app/api/cron/maintenance-notifications/route.ts` |

All require `SUPABASE_SERVICE_ROLE_KEY`. Emails also need `RESEND_API_KEY`. Auth: `CRON_SECRET`.

---

## 📁 Key Files

### Application
- `app/dashboard/DashboardClient.tsx` — Main dashboard client (~2250 lines, split from 3700)
- `app/page.tsx` — Landing page
- `app/pricing/page.tsx` — Pricing table

### Components
- `components/AuthComponent.tsx` — Auth UI & session + pending invite check
- `components/OrgManagement.tsx` — Team management (members, invites, roles)
- `app/components/navigation.tsx` — Nav bar with org switcher (multi-org dropdown, hidden for single-org users)
- `components/UserSettings.tsx` — Account settings (extracted from DashboardClient)
- `components/FuelChartPanel.tsx` — Fuel efficiency chart (extracted from DashboardClient)
- `components/UpgradePrompt.tsx` — Paywall overlays
- `app/theme-toggle.tsx` — Light/dark toggle

### API Routes
- `app/api/cars/route.ts` — GET/POST/PATCH vehicles (org-scoped)
- `app/api/cars/[id]/route.ts` — DELETE vehicle (owner only)
- `app/api/fill-ups/route.ts` — GET/POST fuel records (org-scoped)
- `app/api/maintenance/route.ts` — GET/POST maintenance (org-scoped)
- `app/api/org/route.ts` — GET/PATCH org details
- `app/api/org/members/route.ts` — GET/POST/DELETE members
- `app/api/org/members/[id]/route.ts` — PATCH member role
- `app/api/org/accept-invite/route.ts` — POST accept invitation (non-destructive)
- `app/api/org/switch/route.ts` — POST switch active org (sets cookie)
- `app/api/profile/route.ts` — PATCH user profile preferences (default_car_id)

### Libraries
- `lib/supabase.ts` — Server-side clients
- `lib/supabase-client.ts` — Client-side + helpers (`isAdmin`, `getUserSubscriptionPlan`, `getActiveOrgId`, etc.)
- `lib/org.ts` — Org helpers (`getUserOrg`, `getUserOrgs`, `canEdit`, `isOrgOwner`, `verifyCarAccess`)
- `lib/maintenance.ts` — Shared maintenance logic (`MAINTENANCE_INTERVALS`, `getMaintenanceStatus`)
- `lib/rate-limit.ts` — Rate limiting (integrated via `withAuth`/`withOrg` middleware in all user-facing routes)
- `lib/validation.ts` — Input validation/sanitization (integrated in all data-mutating routes)

### Documentation
- `SCHEMA.md` — Database schema, constraints, RLS policies
- `FUNCTIONS.md` — Triggers, auto-calculated fields
- `SECURITY.md` — Security analysis and best practices

### Styling
- `app/globals.css` — `.card-professional`, `.glass-morphism`, `.shadow-elegant`

---

## 🔄 Development Workflow

```bash
npm run dev  # MUST be localhost:3000
```

### Git
```bash
git commit -m "emoji TYPE: description"
git push  # Auto-deploys to Vercel
```
Prefixes: ✨ FEATURE · 🐛 FIX · ♻️ REFACTOR · 🎨 DESIGN · 📝 DOCS · 🔐 SECURITY

**IMPORTANT**: No mentions of Claude, AI tools, or "Co-Authored-By"

### Testing
1. Admin account → test-free → test-personal → test-business
2. Both light and dark mode
3. Responsive: mobile, tablet, desktop

---

## 💰 Pricing & Feature Tiers

| | Free | Family ($4/mo) | Business ($12/vehicle/mo) |
|---|---|---|---|
| **Vehicles** | 1 | 3 | Unlimited (4+ recommended) |
| **Members** | 1 | 3 | 6 |
| **Fuel tracking** | Full | Full | Full |
| **Maintenance** | Full (🟢/🔴, log records) | + 🟡 warnings + email alerts | + custom intervals |
| **Custom schedules** | ❌ | Next service date/mileage | Custom intervals |
| **Data export** | ❌ | CSV + PDF | CSV + PDF + JSON |
| **Receipt storage** | ❌ | 50MB | Unlimited |
| **Team management** | Hidden | Invite family | Full team management |
| **Tax reports** | ❌ | ❌ | IRS-compliant |
| **Target** | Trial users | Families (2-3 cars) | Contractors (5-15 vehicles) |

**DB value**: 'personal' (UI displays as "Family"). Roles: Owner / Editor / Viewer.
Market position: 65% below competitors ($25-45/vehicle). Dual funnel: families (volume) + contractors (revenue).

> Full strategy, competitive analysis, and branding research: `docs/STRATEGY.md`

---

*Last Updated: 2026-02-15*
