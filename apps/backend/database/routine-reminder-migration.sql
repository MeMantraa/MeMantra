-- Migration: Add routine schedule support to Reminder table
-- Issue: #47 - Schedule Reminders to Fit Routine
-- Date: 2026-02-16

-- Add schedule_times column: array of HH:MM strings for daily reminder times
-- Used when frequency = 'routine'. Max 5 times enforced at application layer.
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "schedule_times" VARCHAR(5)[];

-- Add schedule_days column: array of day-of-week integers (0=Sunday, 6=Saturday)
-- Used when frequency = 'routine'. NULL or empty means every day.
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "schedule_days" SMALLINT[];

-- Add timezone column: IANA timezone string for the user's local timezone
-- Used to correctly interpret schedule_times in the user's timezone.
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(64);

-- Create partial index for efficient querying of routine reminders
CREATE INDEX IF NOT EXISTS idx_reminder_routine
  ON "Reminder"(status, frequency)
  WHERE frequency = 'routine';
