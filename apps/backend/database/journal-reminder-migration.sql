-- Migration: Add journal support to Reminder table
-- Feature: Journal entry notifications/reminders
-- Date: 2026-04-03

-- Add journal_id column to allow reminders to point to journal entries
-- A reminder can point to a mantra, collection, OR journal entry (exactly one)
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "journal_id" INT;

-- Add foreign key constraint for journal_id
ALTER TABLE "Reminder" ADD CONSTRAINT fk_reminder_journal
FOREIGN KEY ("journal_id") REFERENCES "JournalEntry" ("journal_id") ON DELETE CASCADE;

-- Create index for efficient querying of journal-based reminders
CREATE INDEX IF NOT EXISTS idx_reminder_journal ON "Reminder"(journal_id);

COMMENT ON COLUMN "Reminder".journal_id IS 'Optional reference to a journal entry. If set, the reminder points to a journal entry instead of a mantra or collection.';
