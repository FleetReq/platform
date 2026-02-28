-- Migration: Add default_car_id to user_profiles
-- Purpose: Remember the last-selected vehicle per user across sessions
-- Run this in the Supabase SQL editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS default_car_id uuid REFERENCES cars(id) ON DELETE SET NULL;
