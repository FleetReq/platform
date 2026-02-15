# Manual Testing Checklist for FleetReq Platform

## Test Environment
- **URL**: http://localhost:3000
- **Server Status**: Running on port 3000
- **Date**: 2025-10-01

---

## Test Account Credentials

### Free Tier Account
- **Email**: `test-free@fleetreq.com`
- **Password**: See `CLAUDE.md` (not stored in version control)
- **Expected Limits**: 1 vehicle max, view-only maintenance

### Personal Tier Account
- **Email**: `test-personal@fleetreq.com`
- **Password**: See `CLAUDE.md` (not stored in version control)
- **Expected Limits**: 3 vehicles max, full maintenance access

### Business Tier Account
- **Email**: `test-business@fleetreq.com`
- **Password**: See `CLAUDE.md` (not stored in version control)
- **Expected Limits**: 999 vehicles (unlimited), all features

### Admin Account
- **Email**: `deeahtee@live.com`
- **Password**: [Your password]
- **Expected**: Bypass all limits, purple ADMIN badge

---

## Test 1: Free Tier - Vehicle Limit & Data Isolation

### Steps:
1. ✅ Navigate to http://localhost:3000/mileage
2. ✅ Click "Sign In" and login with `test-free@fleetreq.com`
3. ✅ Verify default tab is "Add Car"
4. ✅ Check tab shows **"Add Car (0/1)"**
5. ✅ Add a test vehicle:
   - Make: Toyota
   - Model: Camry
   - Year: 2020
6. ✅ After adding, verify:
   - Tab now shows **"Add Car (1/1)"**
   - Tab is **grayed out/disabled**
   - Hover shows tooltip: "Vehicle limit reached - Upgrade to add more"
7. ✅ Click disabled "Add Car" tab
8. ✅ Verify upgrade prompt is shown with vehicle limit message
9. ✅ Switch to "Graph" tab
10. ✅ Verify empty state: "No Fuel Data Yet"
11. ✅ Add a fill-up for the Toyota:
    - Date: Today
    - Odometer: 50000
    - Gallons: 12
    - Price: $3.50/gallon
12. ✅ Verify graph now shows data point
13. ✅ **CRITICAL**: Sign out and sign in with `test-personal@fleetreq.com`
14. ✅ **VERIFY DATA ISOLATION**: Should see 0 vehicles (not Toyota from free account)

**Expected Results:**
- ✅ Can only add 1 vehicle
- ✅ Tab disables at limit
- ✅ No data leakage between accounts

---

## Test 2: Free Tier - Maintenance Paywall

### Steps:
1. ✅ Login as `test-free@fleetreq.com` (should have 1 Toyota)
2. ✅ Click "Maintenance" tab
3. ✅ **VERIFY**: See maintenance status grid (read-only view)
4. ✅ **VERIFY**: Below grid, see **grayed out form preview**
5. ✅ **VERIFY**: See **centered paywall overlay** with:
   - Lock icon
   - "Maintenance Tracking Locked" heading
   - "Upgrade to Personal or Business" message
   - "View Pricing" button (blue/purple gradient)
6. ✅ Click "View Pricing" button
7. ✅ Verify redirect to `/pricing` page

**Expected Results:**
- ✅ Can VIEW maintenance status (grid visible)
- ✅ CANNOT add/edit maintenance (paywall shown)
- ✅ Overlay is centered and professional

---

## Test 3: Personal Tier - Vehicle Limit & Full Maintenance

### Steps:
1. ✅ Sign out and login as `test-personal@fleetreq.com`
2. ✅ Verify tab shows **"Add Car (0/3)"**
3. ✅ Add first vehicle:
   - Make: Honda
   - Model: Accord
   - Year: 2021
4. ✅ Verify tab shows **"Add Car (1/3)"** and is **enabled**
5. ✅ Add second vehicle:
   - Make: Ford
   - Model: F-150
   - Year: 2019
6. ✅ Verify tab shows **"Add Car (2/3)"** and is **enabled**
7. ✅ Add third vehicle:
   - Make: Tesla
   - Model: Model 3
   - Year: 2023
8. ✅ Verify tab shows **"Add Car (3/3)"** and is **disabled**
9. ✅ Try clicking "Add Car" tab - should show upgrade prompt
10. ✅ Click "Maintenance" tab
11. ✅ **VERIFY**: See maintenance status grid
12. ✅ **VERIFY**: See **actual Add Maintenance form** (NO paywall)
13. ✅ Add maintenance record for Honda:
    - Type: Oil Change
    - Oil Type: Synthetic
    - Cost: $50
    - Next service: 5000 miles
14. ✅ **VERIFY**: Maintenance record appears in grid
15. ✅ **VERIFY**: Status shows in maintenance grid (green/yellow/red indicator)

**Expected Results:**
- ✅ Can add up to 3 vehicles
- ✅ Full maintenance access (no paywall)
- ✅ Can add and view maintenance records

---

## Test 4: Business Tier - Unlimited Vehicles

### Steps:
1. ✅ Sign out and login as `test-business@fleetreq.com`
2. ✅ Verify tab shows **"Add Car (0/999)"**
3. ✅ Add 5 test vehicles (any make/model)
4. ✅ Verify tab shows **"Add Car (5/999)"** and is **enabled**
5. ✅ Verify all features accessible:
   - Graph tab works
   - Fill-up tab works
   - Maintenance tab works (full access, no paywall)
   - Records tab works
6. ✅ Add maintenance for one vehicle
7. ✅ Verify maintenance appears correctly

**Expected Results:**
- ✅ Effectively unlimited vehicles (999 max)
- ✅ All features unlocked
- ✅ No paywalls anywhere

---

## Test 5: Data Isolation Verification

### Steps:
1. ✅ Login as `test-free@fleetreq.com`
2. ✅ Count vehicles (should be 1 Toyota)
3. ✅ Count fill-ups (should be 1)
4. ✅ Count maintenance records (should be 0)
5. ✅ Sign out, login as `test-personal@fleetreq.com`
6. ✅ Count vehicles (should be 3: Honda, Ford, Tesla)
7. ✅ Count fill-ups (should be 0 or whatever you added)
8. ✅ Count maintenance records (should be 1 for Honda)
9. ✅ Sign out, login as `test-business@fleetreq.com`
10. ✅ Count vehicles (should be 5 or however many you added)
11. ✅ **CRITICAL**: Verify NO vehicles from other accounts appear

**Expected Results:**
- ✅ Each account sees ONLY their own data
- ✅ No cross-contamination
- ✅ Switching accounts shows different data sets

---

## Test 6: Delete Car Functionality

### Steps:
1. ✅ Login as `test-personal@fleetreq.com` (should have 3 vehicles)
2. ✅ Click "Settings" tab
3. ✅ Verify "Delete Vehicles" section shows list of 3 vehicles
4. ✅ Click "Delete" on Tesla Model 3
5. ✅ Verify shows **"Confirm Delete"** button
6. ✅ Click "Confirm Delete"
7. ✅ Verify:
   - Success message shown
   - Tesla disappears from list
   - Now shows 2 vehicles remaining
8. ✅ Navigate to "Graph" tab
9. ✅ Verify Tesla no longer appears in vehicle selector
10. ✅ Verify vehicle count: **"Add Car (2/3)"** (was 3/3, now 2/3)
11. ✅ Verify "Add Car" tab is now **enabled** (was disabled)

**Expected Results:**
- ✅ Can delete vehicles
- ✅ Cascade deletes fill-ups and maintenance
- ✅ Vehicle limit frees up after deletion
- ✅ Add Car tab re-enables

---

## Test 7: First-Time User Experience

### Steps:
1. ✅ Create a NEW test account (or clear data for existing one)
2. ✅ Login with account that has 0 vehicles
3. ✅ Verify default tab is **"Add Car"**
4. ✅ Verify these tabs are **grayed out/disabled**:
   - Graph
   - Add Fill-up
   - Maintenance
   - Records
5. ✅ Hover over disabled tabs
6. ✅ Verify tooltip: **"Add a vehicle first"**
7. ✅ Add your first vehicle
8. ✅ Verify:
   - Auto-switches to **Graph tab**
   - All tabs now **enabled**
   - Graph shows empty state: "No Fuel Data Yet"

**Expected Results:**
- ✅ Clear onboarding flow
- ✅ Guided to add vehicle first
- ✅ Tabs enable after first vehicle

---

## Test 8: Light Mode vs Dark Mode

### Steps:
1. ✅ Login with any account
2. ✅ Click theme toggle (top-right)
3. ✅ Switch to **Light Mode** (☀️ icon)
4. ✅ Verify:
   - Cards have solid white backgrounds
   - Strong borders for definition
   - Good contrast and readability
   - Professional appearance
5. ✅ Switch to **Dark Mode** (🌙 icon)
6. ✅ Verify:
   - Dark backgrounds
   - Good contrast
   - Professional appearance
7. ✅ Test both themes on:
   - Graph tab
   - Add Car form
   - Maintenance grid
   - Paywall overlays

**Expected Results:**
- ✅ Both themes look professional
- ✅ No visual glitches
- ✅ Good contrast in both modes

---

## Test 9: Admin Override

### Steps:
1. ✅ Login as `deeahtee@live.com`
2. ✅ Verify purple **"ADMIN"** badge in top navigation
3. ✅ Verify tab shows **"Add Car (X/999)"** (unlimited)
4. ✅ Verify all features accessible (no paywalls)
5. ✅ Try adding multiple vehicles
6. ✅ Try adding maintenance (should work without paywall)

**Expected Results:**
- ✅ Admin badge visible
- ✅ Bypasses all subscription limits
- ✅ Full access to everything

---

## Critical Issues to Watch For

### 🔴 CRITICAL
- [ ] Data leakage between accounts (see other users' vehicles/data)
- [ ] Free users can add maintenance (should be view-only)
- [ ] Vehicle limits not enforced (can exceed max)
- [ ] Delete car doesn't work or causes errors

### 🟡 MEDIUM
- [ ] Paywall overlay not centered
- [ ] Theme toggle issues (broken appearance)
- [ ] Tooltips not showing
- [ ] Tab counts incorrect

### 🟢 LOW
- [ ] Visual inconsistencies
- [ ] Slow loading
- [ ] Minor UI glitches

---

## Post-Testing

After completing all tests, document any issues found in this format:

```
## Issue #1: [Title]
**Severity**: Critical/Medium/Low
**Account**: test-free@fleetreq.com
**Steps to Reproduce**:
1. ...
2. ...
**Expected**: ...
**Actual**: ...
**Screenshot**: [if applicable]
```

---

**Testing Status**: ⏳ Pending Manual Testing
**Automated Tests**: ✅ 46/46 Passing
**Code Coverage**: 35% on subscription logic
**Last Updated**: 2025-10-01
