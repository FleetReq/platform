# FleetReq Database Schema

> **CRITICAL**: Always verify column names against this schema before writing to the database.
> Last Updated: 2025-01-16

---

## Table of Contents
1. [auth.users](#authusers) (Supabase managed)
2. [user_profiles](#user_profiles)
3. [cars](#cars)
4. [fill_ups](#fill_ups)
5. [maintenance_records](#maintenance_records)
6. [heartbeat](#heartbeat) (system table)

---

## auth.users
**Managed by Supabase Auth** - Do not modify directly

- `id` - uuid (primary key)
- `email` - text
- `encrypted_password` - text
- `email_confirmed_at` - timestamp
- `created_at` - timestamp
- `updated_at` - timestamp
- User metadata stored in `raw_user_meta_data` and `raw_app_meta_data`

---

## user_profiles

**Subscription and user metadata**

```sql
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NULL,
  full_name text NULL,
  avatar_url text NULL,
  github_id text NULL,
  is_admin boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  subscription_plan text NOT NULL DEFAULT 'free'::text,
  max_vehicles integer NOT NULL DEFAULT 1,
  max_invited_users integer NOT NULL DEFAULT 0,
  is_primary_user boolean NOT NULL DEFAULT true,
  subscription_start_date timestamp without time zone NULL,
  current_tier_start_date timestamp without time zone NULL,
  subscription_end_date timestamp with time zone NULL,
  cancellation_requested_at timestamp with time zone NULL,
  scheduled_deletion_date timestamp with time zone NULL,
  cancellation_reason text NULL,
  stripe_customer_id text NULL,

  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_github_id_key UNIQUE (github_id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id),
  CONSTRAINT user_profiles_subscription_plan_check CHECK (
    subscription_plan = ANY (ARRAY['free'::text, 'personal'::text, 'business'::text])
  )
)
```

**RLS Policies:**
- `user_profiles_select_policy` - Users can only view their own profile
- `user_profiles_insert_policy` - Users can create their own profile
- `user_profiles_update_policy` - Users can only update their own profile

**Key Columns:**
- `id` - Links to auth.users.id (one-to-one)
- `subscription_plan` - 'free' | 'personal' | 'business'
- `max_vehicles` - Enforced limit (1 for free, 3 for personal, 999 for business)
- `is_admin` - Bypass all limits, show purple badge
- `stripe_customer_id` - Stripe customer ID for billing
- `subscription_end_date` - Date when subscription ends/renews
- `cancellation_requested_at` - Timestamp when user requested cancellation
- `scheduled_deletion_date` - Date when all user data will be permanently deleted (subscription_end + 30 days)
- `cancellation_reason` - Optional reason provided by user for cancellation

---

## cars

**User vehicles**

```sql
CREATE TABLE public.cars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text NULL,
  license_plate text NULL,
  nickname text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  current_mileage integer NULL,

  CONSTRAINT cars_pkey PRIMARY KEY (id),
  CONSTRAINT cars_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT cars_year_check CHECK ((year >= 1900) AND (year <= 2030))
)
```

**Indexes:**
- `idx_cars_user_id` on `user_id`
- `idx_cars_current_mileage` on `current_mileage`

**Triggers:**
- `update_cars_updated_at` - Auto-updates `updated_at` timestamp

**RLS Policies:**
- `users_select_own_cars` - Users can only view their own cars
- `users_insert_own_cars` - Users can create cars for themselves
- `users_update_own_cars` - Users can only update their own cars
- `users_delete_own_cars` - Users can only delete their own cars

**Key Columns:**
- `user_id` - Owner of the vehicle (NOT `owner_id`)
- `current_mileage` - Automatically updated from fill_ups/maintenance records

---

## fill_ups

**Fuel tracking records**

```sql
CREATE TABLE public.fill_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading integer NOT NULL,
  gallons numeric(6, 3) NOT NULL,
  price_per_gallon numeric(5, 3) NULL,
  total_cost numeric(8, 2) NULL,
  gas_station text NULL,
  location text NULL,
  notes text NULL,
  miles_driven integer NULL,
  mpg numeric(5, 2) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  fuel_type character varying(20) NULL DEFAULT NULL,
  created_by_user_id uuid NULL,

  CONSTRAINT fill_ups_pkey PRIMARY KEY (id),
  CONSTRAINT fill_ups_car_id_fkey FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
  CONSTRAINT fk_fill_ups_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES auth.users (id),
  CONSTRAINT fill_ups_gallons_check CHECK (gallons > 0),
  CONSTRAINT fill_ups_odometer_reading_check CHECK (odometer_reading >= 0),
  CONSTRAINT fill_ups_price_per_gallon_check CHECK (price_per_gallon IS NULL OR price_per_gallon > 0),
  CONSTRAINT fill_ups_total_cost_check CHECK (total_cost IS NULL OR total_cost > 0)
)
```

**Indexes:**
- `idx_fill_ups_car_id` on `car_id`
- `idx_fill_ups_date` on `date`
- `idx_fill_ups_fuel_type` on `fuel_type`
- `idx_fill_ups_created_by_user_id` on `created_by_user_id`
- `idx_fill_ups_miles_driven` on `miles_driven`

**Triggers:**
- `update_fill_ups_updated_at` - Auto-updates `updated_at` timestamp
- `calculate_fill_up_mpg` - Auto-calculates `mpg` field on INSERT/UPDATE

**RLS Policies:**
- `Users can view fill-ups for their cars or records they created` - Restricts to car owner OR record creator
- `Users can insert own fill-ups` - Anyone authenticated can create fill-ups
- `Users can update own fill-ups` - Restricts to car owner
- `Users can delete own fill-ups` - Restricts to car owner

**Key Columns:**
- `car_id` - Links to cars table
- `created_by_user_id` - User who created the record (for team features)
- `miles_driven` - Miles driven since last fill-up (optional, used for MPG calculation)
- `mpg` - **AUTO-CALCULATED by trigger** from `miles_driven / gallons`
- `total_cost` - Optional, can be calculated or entered manually

**Important Notes:**
- `mpg` is auto-calculated by trigger if `miles_driven` is provided
- `miles_driven` should be calculated from odometer reading differences
- If `miles_driven` is NULL, `mpg` will remain NULL

---

## maintenance_records

**Vehicle maintenance tracking**

```sql
CREATE TABLE public.maintenance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL,
  description text NULL,
  cost numeric(8, 2) NULL,
  mileage integer NULL,
  service_provider text NULL,
  location text NULL,
  next_service_date date NULL,
  next_service_mileage integer NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  oil_type character varying(20) NULL DEFAULT NULL,
  created_by_user_id uuid NULL,

  CONSTRAINT maintenance_records_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_records_car_id_fkey FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_records_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES auth.users (id),
  CONSTRAINT maintenance_records_type_check CHECK (
    type = ANY (ARRAY[
      'oil_change'::text,
      'tire_rotation'::text,
      'brake_inspection'::text,
      'air_filter'::text,
      'transmission_service'::text,
      'coolant_flush'::text,
      'wipers'::text,
      'registration'::text
    ])
  ),
  CONSTRAINT maintenance_records_cost_check CHECK (cost >= 0),
  CONSTRAINT maintenance_records_check CHECK (next_service_mileage >= mileage),
  CONSTRAINT maintenance_records_mileage_check CHECK (mileage >= 0)
)
```

**Indexes:**
- `idx_maintenance_records_car_id` on `car_id`
- `idx_maintenance_records_date` on `date`
- `idx_maintenance_records_type` on `type`
- `idx_maintenance_records_oil_type` on `oil_type`
- `idx_maintenance_records_created_by_user_id` on `created_by_user_id`

**Triggers:**
- `update_maintenance_records_updated_at` - Auto-updates `updated_at` timestamp

**RLS Policies:**
- `Users can view maintenance records for their cars or records th...` - Restricts to car owner OR record creator
- `Users can insert own maintenance records` - Anyone authenticated can create maintenance records
- `Users can update own maintenance records` - Restricts to car owner
- `Users can delete own maintenance records` - Restricts to car owner

**Key Columns:**
- `car_id` - Links to cars table
- `created_by_user_id` - User who created the record (for team features)
- `type` - Must be one of 8 valid maintenance types (see CHECK constraint)
- `oil_type` - Only relevant for oil_change type

**Valid Maintenance Types:**
- `oil_change`
- `tire_rotation`
- `brake_inspection`
- `air_filter`
- `transmission_service`
- `coolant_flush`
- `wipers`
- `registration`

---

## heartbeat

**System table for Supabase keep-alive**

```sql
CREATE TABLE public.heartbeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pinged_at timestamptz NOT NULL DEFAULT NOW(),
  source text NOT NULL DEFAULT 'cron',
  metadata jsonb
)
```

**Purpose:** Prevents Supabase free-tier auto-pause by tracking database activity

**Indexes:**
- `idx_heartbeat_pinged_at` on `pinged_at DESC`

**RLS Policies:**
- `Service role can manage heartbeat` - Only service_role can read/write (system table)

**Managed By:**
- `.github/workflows/keep-alive.yml` - GitHub Actions cron (every 4 hours)
- `app/api/cron/keep-alive/route.ts` - API endpoint

**Auto-Cleanup:** Keeps only the last 100 records (old records deleted automatically)

---

## Common Patterns

### User ID References
- **auth.users.id** - Primary user identifier
- **cars.user_id** - Owner of the vehicle (⚠️ NOT `owner_id`)
- **created_by_user_id** - User who created a record (for audit/team features)

### Timestamps
All tables have:
- `created_at` - Auto-set on INSERT
- `updated_at` - Auto-updated via trigger on UPDATE

### Cascade Deletes
- Deleting a user → Deletes their cars, profiles
- Deleting a car → Deletes fill_ups and maintenance_records

### Auto-Calculated Fields
- `fill_ups.mpg` - Calculated by `calculate_mpg()` trigger
- DO NOT manually insert values for auto-calculated fields

---

## Important Notes

1. **Always use `created_by_user_id`** for fill_ups and maintenance_records (it exists!)
2. **Cars table uses `user_id`** not `owner_id`
3. **MPG is auto-calculated** - don't insert it manually
4. **Maintenance types are constrained** - only 8 valid values allowed
5. **Foreign keys cascade delete** - deleting a car removes all associated records
