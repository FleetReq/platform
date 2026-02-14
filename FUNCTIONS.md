# FleetReq Database Functions & Triggers

> **CRITICAL**: Always check this file before modifying database operations or schema.
> Database functions run automatically and can affect INSERT/UPDATE behavior.
> Last Updated: 2025-10-08

---

## Table of Contents
1. [Database Functions](#database-functions)
2. [Trigger Mappings](#trigger-mappings)
3. [Function Details](#function-details)

---

## Database Functions

### Overview
These PostgreSQL functions are executed automatically by triggers on specific database events.

| Function Name | Purpose | Tables Using It |
|--------------|---------|-----------------|
| `handle_new_user()` | Auto-creates user profile when new user signs up | `auth.users` (AFTER INSERT) |
| `update_updated_at_column()` | Auto-updates `updated_at` timestamp | `cars`, `fill_ups`, `maintenance_records`, `profiles`, `user_profiles` |
| `calculate_mpg()` | Auto-calculates MPG from miles_driven and gallons | `fill_ups` |
| `auto_create_tire_rotation()` | Auto-creates tire_rotation when tire_change is inserted | `maintenance_records` (AFTER INSERT) |

---

## Trigger Mappings

### auth.users
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### cars
```sql
CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### fill_ups
```sql
CREATE TRIGGER update_fill_ups_updated_at
  BEFORE UPDATE ON fill_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_fill_up_mpg
  BEFORE INSERT OR UPDATE ON fill_ups
  FOR EACH ROW
  EXECUTE FUNCTION calculate_mpg();
```

### maintenance_records
```sql
CREATE TRIGGER update_maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER auto_tire_rotation_on_tire_change
  AFTER INSERT ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tire_rotation();
```

### profiles
```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### user_profiles
```sql
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Function Details

### handle_new_user()

**Purpose**: Automatically creates a user profile with free tier defaults when a new user signs up.

**Trigger**: `AFTER INSERT` on `auth.users`

**SQL Code**:
```sql
BEGIN
  INSERT INTO public.user_profiles (id, subscription_plan, max_vehicles, max_invited_users)
  VALUES (NEW.id, 'free', 1, 0)
  ON CONFLICT (id) DO UPDATE
  SET subscription_plan = COALESCE(user_profiles.subscription_plan, 'free');
  RETURN NEW;
END;
```

**Behavior**:
- Executes AFTER a new user is inserted into `auth.users`
- Creates matching record in `user_profiles` with:
  - `id` = new user's ID
  - `subscription_plan` = 'free'
  - `max_vehicles` = 1
  - `max_invited_users` = 0
- If profile already exists (conflict), updates subscription_plan to 'free' if NULL
- **Important**: This runs automatically - DO NOT manually create user_profiles on signup

**Impact on Code**:
- ✅ User profiles are created automatically
- ❌ Don't manually INSERT into user_profiles after creating a user
- ✅ Query user_profiles immediately after signup - it will exist

---

### update_updated_at_column()

**Purpose**: Automatically updates the `updated_at` timestamp whenever a record is modified.

**Trigger**: `BEFORE UPDATE` on multiple tables

**SQL Code**:
```sql
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
```

**Behavior**:
- Executes BEFORE any UPDATE operation
- Sets `updated_at` to current timestamp
- Applies to: `cars`, `fill_ups`, `maintenance_records`, `profiles`, `user_profiles`

**Impact on Code**:
- ✅ `updated_at` is managed automatically
- ❌ Don't manually set `updated_at` in UPDATE queries
- ✅ Always read `updated_at` to track last modification time

**Example**:
```typescript
// ✅ CORRECT - Don't set updated_at
await supabase
  .from('cars')
  .update({ make: 'Toyota' })
  .eq('id', carId)

// ❌ WRONG - Don't manually set updated_at
await supabase
  .from('cars')
  .update({ make: 'Toyota', updated_at: new Date() })
  .eq('id', carId)
```

---

### calculate_mpg()

**Purpose**: Automatically calculates MPG (miles per gallon) from miles_driven and gallons.

**Trigger**: `BEFORE INSERT OR UPDATE` on `fill_ups`

**SQL Code**:
```sql
BEGIN
  IF NEW.miles_driven IS NOT NULL AND NEW.gallons IS NOT NULL AND NEW.gallons > 0 THEN
    NEW.mpg = NEW.miles_driven / NEW.gallons;
  END IF;
  RETURN NEW;
END;
```

**Behavior**:
- Executes BEFORE INSERT or UPDATE on `fill_ups`
- Calculates `mpg = miles_driven / gallons`
- Only calculates if:
  - `miles_driven` is NOT NULL
  - `gallons` is NOT NULL
  - `gallons` > 0 (prevents division by zero)
- If conditions aren't met, `mpg` remains NULL

**Impact on Code**:
- ✅ `mpg` is calculated automatically from `miles_driven`
- ❌ **NEVER manually set `mpg` in INSERT/UPDATE queries**
- ✅ ALWAYS provide `miles_driven` for accurate MPG calculation
- ✅ First fill-up will have NULL `mpg` (no previous fill-up to calculate miles_driven)

**Example**:
```typescript
// ✅ CORRECT - Provide miles_driven, let trigger calculate mpg
await supabase
  .from('fill_ups')
  .insert({
    car_id: 'abc-123',
    odometer_reading: 50000,
    gallons: 12.5,
    miles_driven: 350  // Trigger will calculate mpg = 350/12.5 = 28.0
  })

// ❌ WRONG - Don't manually set mpg
await supabase
  .from('fill_ups')
  .insert({
    car_id: 'abc-123',
    odometer_reading: 50000,
    gallons: 12.5,
    miles_driven: 350,
    mpg: 28.0  // WRONG - trigger will overwrite this anyway
  })
```

**API Integration**:
The API automatically calculates `miles_driven` from previous fill-up:
```typescript
// Get previous fill-up odometer reading
const { data: previousFillUp } = await supabase
  .from('fill_ups')
  .select('odometer_reading')
  .eq('car_id', car_id)
  .order('date', { ascending: false })
  .limit(1)
  .single()

// Calculate miles driven since last fill-up
const miles_driven = previousFillUp
  ? parseInt(odometer_reading) - previousFillUp.odometer_reading
  : null  // NULL for first fill-up

// Insert with miles_driven - trigger will calculate mpg
await supabase.from('fill_ups').insert({
  ...,
  miles_driven
})
```

---

### auto_create_tire_rotation()

**Purpose**: Automatically creates a `tire_rotation` record when a `tire_change` is inserted, since new tires reset the rotation interval.

**Trigger**: `AFTER INSERT` on `maintenance_records`

**SQL Code**:
```sql
BEGIN
  IF NEW.type = 'tire_change' THEN
    INSERT INTO maintenance_records (
      car_id, date, type, mileage, created_by_user_id, source_record_id, description
    ) VALUES (
      NEW.car_id, NEW.date, 'tire_rotation', NEW.mileage,
      NEW.created_by_user_id, NEW.id, 'Auto-created from tire change'
    );
  END IF;
  RETURN NEW;
END;
```

**Behavior**:
- Only fires when `type = 'tire_change'`
- Creates a `tire_rotation` record with the same `car_id`, `date`, `mileage`, and `created_by_user_id`
- Sets `source_record_id` to the tire_change record's ID
- The `source_record_id` FK has `ON DELETE CASCADE` — deleting the tire_change automatically deletes the auto-created tire_rotation

**Impact on Code**:
- ✅ Tire rotation interval resets automatically when new tires are installed
- ✅ Deleting a mistaken tire_change also removes the auto-created tire_rotation
- ❌ Don't manually create a tire_rotation when adding a tire_change — the trigger handles it

---

## Important Notes

### Auto-Calculated Fields - DO NOT SET MANUALLY
These fields are managed by triggers and should NEVER be set in INSERT/UPDATE:
- ✅ `updated_at` - Set by `update_updated_at_column()`
- ✅ `mpg` - Calculated by `calculate_mpg()`

### Auto-Created Records
These records are created automatically by triggers:
- ✅ `user_profiles` - Created by `handle_new_user()` when user signs up
- ✅ `maintenance_records` (tire_rotation) - Created by `auto_create_tire_rotation()` when a tire_change is inserted

### Function Execution Order
1. **BEFORE INSERT/UPDATE** triggers run first
   - `update_updated_at_column()` sets timestamp
   - `calculate_mpg()` calculates MPG
2. **Row is inserted/updated** with modified values
3. **AFTER INSERT/UPDATE** triggers run last
   - `handle_new_user()` creates user profile

### Debugging Trigger Issues
If you encounter database errors:
1. Check if a trigger is modifying fields you're trying to set
2. Verify required fields for trigger calculations exist (e.g., `miles_driven` for `calculate_mpg()`)
3. Review trigger conditions (e.g., NOT NULL checks, division by zero)
4. Check SCHEMA.md for column constraints
5. Use detailed error logging to see trigger-generated errors

---

## Updating This Document

When adding/modifying database functions:
1. ✅ Update this FUNCTIONS.md file
2. ✅ Update SCHEMA.md if column behavior changes
3. ✅ Update API routes to work with new trigger behavior
4. ✅ Test INSERT/UPDATE operations after function changes
5. ✅ Document any auto-calculated fields clearly

---

*Last Updated: 2025-10-08*
*Functions documented: 3 (handle_new_user, update_updated_at_column, calculate_mpg)*
