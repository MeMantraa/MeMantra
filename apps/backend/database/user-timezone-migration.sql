-- Migration: Add timezone and recommendation notification tracking to User table
-- Date: 2026-02-18
--
-- Timezone is a user-level attribute (where the person is located).
-- It is captured from the device when the push token is registered and stored
-- here as the single source of truth for all user-level time-based features
-- (e.g. delivering recommendation notifications at 9 AM local time).
-- Reminder.timezone remains for self-contained reminder scheduling.

-- Store the user's IANA timezone string (e.g. 'America/New_York')
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(100);

-- Track when a recommendation notification was last delivered to each user.
-- Used to prevent sending more than one recommendation notification per day.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "recommendation_notif_sent_at" TIMESTAMPTZ;

-- Index to efficiently find users who are due for a notification
CREATE INDEX IF NOT EXISTS idx_user_recommendation_notif_sent
  ON "User"("recommendation_notif_sent_at");

COMMENT ON COLUMN "User".timezone IS 'IANA timezone identifier (e.g. America/New_York). Captured from the device on push-token registration. NULL defaults to UTC.';
COMMENT ON COLUMN "User".recommendation_notif_sent_at IS 'Timestamp of the last recommendation push notification sent to this user.';
