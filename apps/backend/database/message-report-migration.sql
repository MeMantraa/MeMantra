-- Migration: Create message report functionality tables

-- Create enum type for report reasons
DO $$ BEGIN
    CREATE TYPE report_reason AS ENUM (
        'inappropriate_language',
        'harassment',
        'spam',
        'offensive_content',
        'misinformation',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create enum type for report status
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'pending',
        'accepted',
        'denied',
        'reviewed'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create MessageReport table
CREATE TABLE IF NOT EXISTS "MessageReport" (
    "report_id" SERIAL PRIMARY KEY,
    "message_id" INTEGER NOT NULL REFERENCES message(message_id) ON DELETE CASCADE,
    "conversation_id" INTEGER NOT NULL REFERENCES conversation(conversation_id) ON DELETE CASCADE,
    "reported_by_id" INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    "reason" report_reason NOT NULL,
    "description" TEXT,
    "status" report_status DEFAULT 'pending',
    "reviewed_by_id" INTEGER REFERENCES "User"(user_id) ON DELETE SET NULL,
    "review_notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_report_status ON "MessageReport"(status);
CREATE INDEX IF NOT EXISTS idx_message_report_message_id ON "MessageReport"(message_id);
CREATE INDEX IF NOT EXISTS idx_message_report_created_at ON "MessageReport"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_report_reported_by ON "MessageReport"(reported_by_id);

-- Create UserBlock table for user blocking functionality
CREATE TABLE IF NOT EXISTS "UserBlock" (
    "block_id" SERIAL PRIMARY KEY,
    "blocker_id" INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    "blocked_id" INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate blocks
    CONSTRAINT unique_user_block UNIQUE (blocker_id, blocked_id),
    -- Prevent self-blocking
    CONSTRAINT different_users_block CHECK (blocker_id != blocked_id)
);

-- Create indexes for UserBlock
CREATE INDEX IF NOT EXISTS idx_user_block_blocker ON "UserBlock"(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_block_blocked ON "UserBlock"(blocked_id);
