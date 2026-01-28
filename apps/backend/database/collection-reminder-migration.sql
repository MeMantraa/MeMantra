-- Migration: Add collection support to Reminder table
-- Issue: #417 - Notifications can point to default/custom user collections
-- Date: 2026-01-28

-- Add collection_id column to allow reminders to point to collections
-- A reminder can point to either a mantra (mantra_id) OR a collection (collection_id), but not both
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "collection_id" INT;

-- Add foreign key constraint for collection_id
ALTER TABLE "Reminder" ADD CONSTRAINT fk_reminder_collection
FOREIGN KEY ("collection_id") REFERENCES "Collection" ("collection_id") ON DELETE CASCADE;

-- Create index for efficient querying of collection-based reminders
CREATE INDEX IF NOT EXISTS idx_reminder_collection ON "Reminder"(collection_id);

-- Comments for documentation
COMMENT ON COLUMN "Reminder".collection_id IS 'Optional reference to a collection. If set, the reminder points to a collection instead of a single mantra.';
