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

### **6. Always Verify Against SCHEMA.md Before Database Operations**
**Before writing ANY database INSERT/UPDATE code, check SCHEMA.md for exact column names.**
- **Read SCHEMA.md first**: Verify table structure, column names, constraints, and triggers
- **Don't assume**: Column names like `user_id` vs `owner_id` vs `created_by_user_id` are critical
- **Check for auto-calculated fields**: Never manually insert fields calculated by triggers (e.g., `mpg`)
- **Update SCHEMA.md**: If you modify database schema in Supabase, update SCHEMA.md immediately
- **Rationale**: Prevents "column does not exist" errors and ensures data integrity. SCHEMA.md is the single source of truth for database structure.

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

## 📝 Recent Session Summary (2025-10-01)

### **Completed This Session**
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
1. **Update browser tab icon (favicon)** - Currently shows Vercel default icon instead of custom FleetReq branding
2. **First-time UX improvements** - Better onboarding flow for new users
3. **Data retention enforcement** - 90-day limit for free tier
4. **Bug fixes from testing** - Address any issues found during manual testing

### **📅 Short-term (Next Month)**
- **Stripe billing integration** - Subscription management, payment processing
- **Professional reporting (Business)** - Tax-compliant mileage reports, export to CSV/PDF
- **Team invitation system (Business)** - Invite users by email, role-based permissions
- **Excel import tools** - Migration wizard for contractors

### **🔮 Medium-term (3-6 Months)**
- **PWA/Mobile app** - Progressive Web App for mobile experience
- **Advanced analytics** - Cost per mile, predictive maintenance
- **Custom branding (Business)** - Company logo, custom colors, branded reports
- **Domain purchase** - Register fleetreq.com when ready

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

**RLS Policies**: All tables use `auth.uid() = user_id` pattern for data isolation

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
- Domain: fleetreq.com (available, not registered yet)
- Concept: Fleet Requests + Fleet Records (dual meaning)
- Appeals to: Contractors (work orders) + Admins (compliance)
- Status: Hold registration until ready for launch

### **Other Options Researched**
- fleetix.com, vehiclx.com, recordfleet.com, fleetrek.com
- All available if rebrand needed for consumer market

---

*Last Updated: 2025-10-01*
*Session: CLAUDE.md consolidation & refactoring*
*Status: Production-ready, testing in progress*
*Next: Manual browser testing with all test accounts*
