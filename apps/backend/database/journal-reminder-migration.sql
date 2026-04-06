-- Migration: Add journal entry support to Reminder table
-- Feature: Reminders can now point to journal entries in addition to mantras and collections
-- Date: 2026-04-06

-- Add journal_id column to allow reminders to point to journal entries
-- A reminder can point to a mantra (mantra_id), collection (collection_id), OR journal entry (journal_id), but only one
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "journal_id" INT;

-- Add foreign key constraint for journal_id
ALTER TABLE "Reminder" ADD CONSTRAINT fk_reminder_journal
FOREIGN KEY ("journal_id") REFERENCES "JournalEntry" ("journal_id") ON DELETE CASCADE;

-- Create index for efficient querying of journal-based reminders
CREATE INDEX IF NOT EXISTS idx_reminder_journal ON "Reminder"(journal_id);

-- Comments for documentation
COMMENT ON COLUMN "Reminder".journal_id IS 'Optional reference to a journal entry. If set, the reminder points to a journal entry instead of a mantra or collection.';
