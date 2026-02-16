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

### Latest (2025-12-18) - Route Rename, Loading Fix & Branding
- Next.js 16 proxy migration (`middleware.ts` → `proxy.ts`)
- Favicon/branding update (static SVG icons, FR logo)
- Metadata cleanup (removed template content, updated to FleetReq)
- Route rename `/mileage` → `/dashboard`
- Loading state fix (optimistic auth state, no flash for logged-in users)
- Keep-alive verified working (8 ops per 4-hour cycle)

### Previous (2025-12-17) - Enhanced Keep-Alive & Next.js 16
- Enhanced keep-alive (triple-approach: service role + anon key + direct DB)
- Next.js 15.5.3 → 16.0.10 (security patch CVE-2025-66478)
- Turbopack migration (replaced webpack config)

> Full session history: `docs/SESSION_HISTORY.md`

---

## 📋 Current Tasks & Priorities

### 🔄 Active
- [ ] Manual browser testing (all 3 tiers, light/dark, TESTING_CHECKLIST.md)

### 🆕 Next Up
1. **Performance Overview redesign** — Tax metrics for contractors (Cost Per Mile, YTD costs, IRS deduction). Core value prop. Files: `app/api/stats/route.ts`, `app/dashboard/page.tsx`
2. **Security integration** — Apply `lib/rate-limit.ts` and `lib/validation.ts` to all API routes
3. **PWA support** — `next-pwa`, manifest, service worker, install prompt
4. **First-time UX improvements** — Better onboarding flow

### 📅 Short-term
- Professional reporting (CSV/PDF export)
- Team invitation system (Business tier)
- Excel import wizard
- Custom autocomplete (replace `<datalist>` for iOS)

### 🔮 Medium-term (3-6 months)
- Native mobile apps (after PWA proves PMF)
- Advanced analytics, predictive maintenance
- Domain purchase (fleetreq.app)

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
| `user_profiles` | Subscription plans | `id` → `auth.users.id` |
| `cars` | Vehicles | `user_id` → `auth.users.id` ⚠️ NOT `owner_id` |
| `fill_ups` | Fuel records | `car_id` → `cars.id` |
| `maintenance_records` | Maintenance | `car_id` → `cars.id` |
| `heartbeat` | Keep-alive (service_role only) | — |

RLS: User tables use `auth.uid() = user_id`. System tables use service_role only.

### Authentication Architecture

**Client-side**: `createBrowserClient()` from `@supabase/ssr` (cookies, NOT localStorage)
**Server-side API routes**: `createRouteHandlerClient(request)` from `@/lib/supabase` (reads `request.cookies`)

- ❌ Don't use `@supabase/supabase-js` `createClient()` — breaks SSR
- ❌ Don't use `cookies()` helper in Route Handlers
- ✅ `createBrowserClient()` for client, `createRouteHandlerClient(request)` for API

### Cron Systems

| System | Schedule | Key Files |
|--------|----------|-----------|
| **Keep-alive** (prevents Supabase pause) | Every 4hrs | `.github/workflows/keep-alive.yml`, `app/api/cron/keep-alive/route.ts` |
| **Account cleanup** (GDPR deletion) | Daily midnight | `.github/workflows/cleanup-expired-accounts.yml`, `app/api/cron/cleanup-expired-accounts/route.ts` |
| **Maintenance emails** (Resend digest) | Mondays 8AM UTC | `.github/workflows/maintenance-notifications.yml`, `app/api/cron/maintenance-notifications/route.ts` |

All require `SUPABASE_SERVICE_ROLE_KEY`. Emails also need `RESEND_API_KEY`. Auth: `CRON_SECRET`.

---

## 📁 Key Files

### Application
- `app/dashboard/page.tsx` — Main dashboard (~3700 lines)
- `app/page.tsx` — Landing page
- `app/pricing/page.tsx` — Pricing table

### Components
- `components/AuthComponent.tsx` — Auth UI & session
- `components/UpgradePrompt.tsx` — Paywall overlays
- `app/theme-toggle.tsx` — Light/dark toggle

### API Routes
- `app/api/cars/route.ts` — GET/POST/PATCH vehicles
- `app/api/cars/[id]/route.ts` — DELETE vehicle
- `app/api/fill-ups/route.ts` — GET/POST fuel records
- `app/api/maintenance/route.ts` — GET/POST maintenance

### Libraries
- `lib/supabase.ts` — Server-side clients
- `lib/supabase-client.ts` — Client-side + helpers (`isAdmin`, `getUserSubscriptionPlan`, `hasFeatureAccess`, etc.)
- `lib/maintenance.ts` — Shared maintenance logic (`MAINTENANCE_INTERVALS`, `getMaintenanceStatus`)
- `lib/rate-limit.ts` — Rate limiting (not yet integrated into routes)
- `lib/validation.ts` — Input validation/sanitization (not yet integrated into routes)

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

| | Free | Personal ($4/mo) | Business ($12/vehicle/mo) |
|---|---|---|---|
| **Vehicles** | 1 | 3 | Unlimited (4+ recommended) |
| **Fuel tracking** | Full | Full | Full |
| **Maintenance** | View-only (🟢/🔴) | Full + 🟡 warnings | Full + custom intervals |
| **Custom schedules** | ❌ | Next service date/mileage | Custom intervals |
| **Data export** | ❌ | CSV + PDF | CSV + PDF + JSON |
| **Receipt storage** | ❌ | 50MB | Unlimited |
| **Team** | ❌ | ❌ | Up to 6 members |
| **Tax reports** | ❌ | ❌ | IRS-compliant |
| **Target** | Trial users | Families (2-3 cars) | Contractors (5-15 vehicles) |

Market position: 65% below competitors ($25-45/vehicle). Dual funnel: families (volume) + contractors (revenue).

> Full strategy, competitive analysis, and branding research: `docs/STRATEGY.md`

---

*Last Updated: 2026-02-15*
