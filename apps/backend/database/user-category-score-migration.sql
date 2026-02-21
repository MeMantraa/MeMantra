-- User Category Score Migration
-- Tracks per-user interaction counts for each category.
-- The algorithm uses these scores to personalise the mantra feed.
--
-- Points system:
--   Reminder added   +5  for every category of the mantra
--   Rating 5 stars   +5  for every category of the mantra
--   Rating 4 stars   +4  for every category of the mantra
--   Like             +3  for every category of the mantra
--   Saved            +3  for every category of the mantra
--   Journal          +2  for every category of the mantra

CREATE TABLE IF NOT EXISTS "UserCategoryScore" (
  "user_id"     INT NOT NULL REFERENCES "User"("user_id") ON DELETE CASCADE,
  "category_id" INT NOT NULL REFERENCES "Category"("category_id") ON DELETE CASCADE,
  "score"       INT NOT NULL DEFAULT 0,
  "updated_at"  TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "category_id")
);

-- index for top categories for a user (ORDER BY score DESC)
CREATE INDEX IF NOT EXISTS idx_user_category_score_user
  ON "UserCategoryScore" ("user_id", "score" DESC);

-- index for which users prefer a category
CREATE INDEX IF NOT EXISTS idx_user_category_score_category
  ON "UserCategoryScore" ("category_id");
