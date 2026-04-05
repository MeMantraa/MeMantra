-- Index migration: add indexes on commonly filtered columns
-- Safe to run multiple times (IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_reminder_status_time
  ON "Reminder" ("status", "time");

CREATE UNIQUE INDEX IF NOT EXISTS idx_like_user_mantra
  ON "Like" ("user_id", "mantra_id");

CREATE INDEX IF NOT EXISTS idx_collection_user_id
  ON "Collection" ("user_id");

CREATE INDEX IF NOT EXISTS idx_collection_mantra_collection_id
  ON "CollectionMantra" ("collection_id");

CREATE INDEX IF NOT EXISTS idx_recommendation_log_user_id
  ON "RecommendationLog" ("user_id", "timestamp" DESC);
