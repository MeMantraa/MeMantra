-- Migration: Widen PasswordResetToken.code column to store bcrypt hashes
-- Bcrypt hashes are 60 characters; VARCHAR(72) provides safe headroom.
-- Previous: VARCHAR(6) (plain-text 6-digit codes)

ALTER TABLE "PasswordResetToken"
  ALTER COLUMN "code" TYPE VARCHAR(72);
