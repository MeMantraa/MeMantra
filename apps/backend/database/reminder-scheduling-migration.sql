-- Migration: Add scheduling support to Reminder table
-- Issue: #179 - Implement notification scheduling logic
-- Date: 2026-01-14

-- Add last_sent_at column to track when reminders were last sent
-- This enables proper handling of recurring reminders (daily, weekly, monthly)
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "last_sent_at" TIMESTAMP;

-- Create index for efficient querying of due reminders
-- The scheduler queries by status and time, so this index helps performance
CREATE INDEX IF NOT EXISTS idx_reminder_status_time ON "Reminder"(status, time);

-- Create index for last_sent_at to efficiently find reminders that need to be sent
CREATE INDEX IF NOT EXISTS idx_reminder_last_sent ON "Reminder"(last_sent_at);

-- Comments for documentation
COMMENT ON COLUMN "Reminder".last_sent_at IS 'Timestamp of when the reminder notification was last sent. NULL if never sent.';
