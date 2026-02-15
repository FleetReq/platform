# Subscription Downgrade Testing Guide

> **Purpose**: Comprehensive manual testing checklist for the subscription downgrade system

---

## 🎯 Test Scenarios

### **Scenario 1: Business → Personal (No Vehicle Removal Needed)**

**Prerequisites:**
- User has Business tier subscription
- User has 3 or fewer vehicles

**Steps:**
1. Navigate to http://localhost:3000/mileage
2. Log in with Business tier account
3. Click "Settings" tab
4. Scroll to bottom of Settings section
5. Verify "Downgrade Subscription" button appears (yellow, left of Delete Account)
6. Click "Downgrade Subscription"

**Expected Results:**
- ✅ Modal appears with title "Downgrade Subscription"
- ✅ Shows message: "You'll keep your current business tier access until the end of your billing period"
- ✅ Shows "Personal Tier - $4/month" option
- ✅ Shows "Free Tier" option
- ✅ Downgrade button is disabled until tier is selected
- ✅ Clicking Personal tier highlights it with blue border
- ✅ Downgrade button becomes enabled
- ✅ Clicking Downgrade shows success message
- ✅ User remains on Business tier (immediate downgrade doesn't happen)
- ✅ Database shows `pending_downgrade_tier = 'personal'`
- ✅ Database shows `downgrade_effective_date` (end of billing period)

---

### **Scenario 2: Business → Personal (Vehicle Removal Required)**

**Prerequisites:**
- User has Business tier subscription
- User has 4+ vehicles (exceeds Personal tier limit of 3)

**Steps:**
1. Navigate to Settings
2. Click "Downgrade Subscription"
3. Select "Personal Tier - $4/month"
4. Click "Downgrade"

**Expected Results:**
- ✅ First modal closes
- ✅ Vehicle Selection Modal appears
- ✅ Shows message: "You have X vehicles but the personal tier allows 3. Please select Y vehicle(s) to remove:"
- ✅ All vehicles are listed with year, make, model, nickname, license plate
- ✅ Clicking a vehicle selects it (red border, checkmark icon)
- ✅ Can only select the exact number needed (can't select more)
- ✅ Clicking selected vehicle deselects it
- ✅ "Remove X/Y & Downgrade" button is disabled until correct number selected
- ✅ "Back" button returns to tier selection modal
- ✅ Clicking Downgrade after correct selection:
  - Shows success message
  - Selected vehicles are deleted
  - User remains on Business tier until period end
  - Database shows pending downgrade

---

### **Scenario 3: Business → Free (Vehicle Removal Required)**

**Prerequisites:**
- User has Business tier subscription
- User has 2+ vehicles (exceeds Free tier limit of 1)

**Steps:**
1. Navigate to Settings
2. Click "Downgrade Subscription"
3. Select "Free Tier"

**Expected Results:**
- ✅ Clicking Downgrade triggers vehicle selection modal
- ✅ Shows "personal tier allows 1" (only 1 vehicle allowed)
- ✅ Must select all vehicles except 1
- ✅ After selection and downgrade:
  - Success message appears
  - Excess vehicles are deleted
  - User remains on Business tier until period end
  - Database shows `pending_downgrade_tier = 'free'`

---

### **Scenario 4: Personal → Free (No Vehicle Removal Needed)**

**Prerequisites:**
- User has Personal tier subscription
- User has exactly 1 vehicle

**Steps:**
1. Navigate to Settings
2. Click "Downgrade Subscription"
3. Verify Free tier is the only option shown

**Expected Results:**
- ✅ "Downgrade Subscription" button appears
- ✅ Modal shows only "Free Tier" option (no Personal tier option)
- ✅ Clicking Downgrade immediately processes (no vehicle selection needed)
- ✅ Success message appears
- ✅ User remains on Personal tier until period end

---

### **Scenario 5: Personal → Free (Vehicle Removal Required)**

**Prerequisites:**
- User has Personal tier subscription
- User has 2-3 vehicles

**Steps:**
1. Navigate to Settings
2. Click "Downgrade Subscription"
3. Select "Free Tier"
4. Click "Downgrade"

**Expected Results:**
- ✅ Vehicle selection modal appears
- ✅ Must select all vehicles except 1
- ✅ After selection, vehicles are deleted and downgrade is pending

---

### **Scenario 6: Free Tier User**

**Prerequisites:**
- User has Free tier subscription

**Steps:**
1. Navigate to Settings
2. Scroll to bottom

**Expected Results:**
- ✅ "Downgrade Subscription" button does NOT appear
- ✅ Only "Upgrade to unlock..." message is visible
- ✅ No downgrade option (already on lowest tier)

---

### **Scenario 7: Cancel/Back Navigation**

**Steps:**
1. Open Downgrade modal
2. Click "Cancel"

**Expected Results:**
- ✅ Modal closes
- ✅ No changes to subscription
- ✅ State is reset (no tier selected)

**Steps:**
1. Open Downgrade modal
2. Select tier that requires vehicle removal
3. Click "Downgrade" to see vehicle selection
4. Click "Back"

**Expected Results:**
- ✅ Vehicle selection modal closes
- ✅ Tier selection modal reopens
- ✅ Previous tier selection is still highlighted
- ✅ Selected vehicles are cleared

---

## 🔍 Edge Cases to Test

### **Edge Case 1: Exactly at Limit**
- Business user with exactly 3 vehicles downgrading to Personal
- Expected: No vehicle selection needed

### **Edge Case 2: Multiple Rapid Clicks**
- Click "Downgrade" button multiple times rapidly
- Expected: Button disables during processing, prevents duplicate requests

### **Edge Case 3: Network Error**
- Disconnect internet before clicking Downgrade
- Expected: Error message appears, modal remains open

### **Edge Case 4: Invalid Tier Selection**
- Try to downgrade from Free tier (should not be possible)
- Expected: Button doesn't appear for Free tier users

---

## 📊 Database Verification

After each downgrade, verify database state:

```sql
-- Check user_profiles
SELECT
  subscription_plan,
  pending_downgrade_tier,
  downgrade_effective_date,
  downgrade_requested_at
FROM user_profiles
WHERE id = 'USER_ID';
```

**Expected:**
- `pending_downgrade_tier` = selected tier ('free' or 'personal')
- `downgrade_effective_date` = end of current billing period (future date)
- `downgrade_requested_at` = NOW()

---

## 🎨 UI/UX Checklist

### **Visual Design:**
- ✅ Downgrade button is yellow (distinct from red Delete Account)
- ✅ Downgrade button is positioned to LEFT of Delete Account
- ✅ Both buttons have consistent sizing and spacing
- ✅ Modals use rounded-2xl corners
- ✅ Selected tier has blue border and background
- ✅ Selected vehicles have red border and checkmark
- ✅ Warning box for Free tier is yellow with icon

### **Dark Mode:**
- ✅ All modals work in dark mode
- ✅ Text is readable in dark mode
- ✅ Border colors are appropriate for dark background
- ✅ Warning box is visible in dark mode

### **Responsive Design:**
- ✅ Modals are centered on all screen sizes
- ✅ Vehicle list scrolls if many vehicles (max-h-80)
- ✅ Buttons stack properly on mobile

### **Accessibility:**
- ✅ Buttons have disabled states with cursor-not-allowed
- ✅ Loading states show "Processing..." text
- ✅ Clear visual feedback for selections
- ✅ Error messages are displayed prominently

---

## 🔗 Stripe Integration Verification

**After downgrade, verify in Stripe Dashboard:**

1. Go to Stripe Dashboard → Customers
2. Find the customer by email
3. Click on the active subscription
4. Verify:
   - ✅ "Cancel at period end" is set to TRUE
   - ✅ "Current period end" matches `downgrade_effective_date`
   - ✅ Subscription status is still "Active"

---

## ✅ Success Criteria

**A successful test run includes:**

1. ✅ All 7 scenarios pass
2. ✅ All edge cases handled gracefully
3. ✅ Database state is correct after each downgrade
4. ✅ Stripe subscription shows `cancel_at_period_end: true`
5. ✅ No console errors in browser
6. ✅ UI is consistent in light and dark mode
7. ✅ No TypeScript or build errors
8. ✅ Success/error messages display properly

---

## 🐛 Bug Reporting Template

If you find issues, document with:

```
**Scenario**: [e.g., Business → Personal with 4 vehicles]
**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:


**Actual Behavior**:


**Screenshots**:


**Console Errors**:


**Browser**: [Chrome/Firefox/Safari]
**Mode**: [Light/Dark]
```

---

## 🚀 Production Testing

Before deploying to production:

1. ✅ Test all scenarios on localhost:3000
2. ✅ Test on Vercel preview deployment
3. ✅ Verify Stripe webhook receives cancellation event
4. ✅ Test with real Stripe test cards
5. ✅ Verify email notifications (if implemented)
6. ✅ Test on mobile devices (iOS Safari, Android Chrome)

---

*Created: 2025-11-18*
*Last Updated: 2025-11-18*
