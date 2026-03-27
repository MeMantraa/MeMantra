-- index to speed up message fetches by conversation ordered by time
-- Handles both quoted ("Message") and unquoted/lowercase (message) table variants.

DO $$
BEGIN
    IF to_regclass('"Message"') IS NOT NULL THEN
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_message_conversation_created_at
            ON "Message" ("conversation_id", "created_at" DESC)
        ';
    ELSIF to_regclass('message') IS NOT NULL THEN
        EXECUTE '
            CREATE INDEX IF NOT EXISTS idx_message_conversation_created_at
            ON message (conversation_id, created_at DESC)
        ';
    ELSE
        RAISE NOTICE 'Skipping message index migration: message table not found.';
    END IF;
END $$;
