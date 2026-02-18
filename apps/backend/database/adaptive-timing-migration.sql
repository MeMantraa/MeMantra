-- Add EngagementEvent table and optimal_send_hour to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "optimal_send_hour" SMALLINT;
COMMENT ON COLUMN "User".optimal_send_hour IS
  'Hour (0-23, user local timezone) for recommendation notifications. '
  'Computed nightly from EngagementEvent. NULL = fall back to hour 9.';

CREATE TABLE IF NOT EXISTS "EngagementEvent" (
  event_id    SERIAL      PRIMARY KEY,
  user_id     INT         NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
  event_type  VARCHAR(50) NOT NULL DEFAULT 'app_open',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_engagement_user_time
  ON "EngagementEvent"(user_id, occurred_at);
