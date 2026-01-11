

-- Create MessageReaction table
CREATE TABLE IF NOT EXISTS "MessageReaction" (
    reaction_id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES "Message"(message_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    
    CONSTRAINT unique_user_message_emoji UNIQUE (message_id, user_id, emoji)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reaction_message ON "MessageReaction"(message_id);
CREATE INDEX IF NOT EXISTS idx_reaction_user ON "MessageReaction"(user_id);

-- Comments for documentation
COMMENT ON TABLE "MessageReaction" IS 'Stores emoji reactions to messages';
COMMENT ON COLUMN "MessageReaction".emoji IS 'The emoji used for the reaction (e.g., 👍, ❤️, 😂)';
