-- Theme Preference adds theme index to the user table

-- Add theme column to User table
ALTER TABLE "User" ADD COLUMN "theme" VARCHAR(50) DEFAULT 'default';

-- Create index for faster theme queries
CREATE INDEX IF NOT EXISTS idx_user_theme ON "User" ("theme");

-- Add comment for documentation
COMMENT ON COLUMN "User"."theme" IS 'User preferred color theme for the app interface';