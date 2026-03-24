CREATE TABLE IF NOT EXISTS "PerformanceEvent" (
  event_id      SERIAL PRIMARY KEY,
  kind          VARCHAR(50)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  duration_ms   DOUBLE PRECISION NOT NULL CHECK (duration_ms >= 0),
  status        VARCHAR(16)  NOT NULL,
  source        VARCHAR(16)  NOT NULL,
  route         VARCHAR(200),
  method        VARCHAR(12),
  screen        VARCHAR(80),
  request_id    VARCHAR(80),
  platform      VARCHAR(50),
  app_version   VARCHAR(50),
  metadata      JSONB,
  occurred_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_event_occurred_at
  ON "PerformanceEvent"(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_event_kind
  ON "PerformanceEvent"(kind);

CREATE INDEX IF NOT EXISTS idx_performance_event_source
  ON "PerformanceEvent"(source);
