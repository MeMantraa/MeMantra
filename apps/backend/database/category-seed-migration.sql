-- Category Seed Migration
-- Populates the Category table with the six navigation layers defined 
-- in the Mantra Categories document.
--
-- Layers:
--   1) essential  – High-level core areas for general exploration
--   2) goal       – Users select a specific outcome or goal
--   3) mood       – Match mantras to the user's current emotional state
--   4) scenario   – Situational contexts where mantras are helpful
--   5) time       – Timing-based mantras for routines or seasonal inspiration
--   6) theme      – Aspirational, principle-driven mantras
--


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Category' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE "Category" ADD COLUMN "parent_id" INT REFERENCES "Category"("category_id") ON DELETE SET NULL;
  END IF;
END $$;

-- Add unique constraint to prevent duplicate seeds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_category_name_type'
  ) THEN
    ALTER TABLE "Category" ADD CONSTRAINT uq_category_name_type UNIQUE ("name", "category_type");
  END IF;
END $$;

-- 1) ESSENTIALS (parent categories + subcategories)

-- Top-level essential categories
INSERT INTO "Category" ("name", "description", "category_type", "parent_id", "is_active")
VALUES
  ('Mind & Emotional Health', 'Mantras for mental well-being and emotional resilience', 'essential', NULL, TRUE),
  ('Physical Health & Energy', 'Mantras for physical vitality and healthy living', 'essential', NULL, TRUE),
  ('Work & Learning', 'Mantras for career growth, productivity, and education', 'essential', NULL, TRUE),
  ('Relationships & Social Life', 'Mantras for building and maintaining connections', 'essential', NULL, TRUE),
  ('Parenting & Family', 'Mantras for family life and parenting', 'essential', NULL, TRUE),
  ('Personal Growth & Goals', 'Mantras for self-improvement and ambition', 'essential', NULL, TRUE),
  ('Daily Life & Creativity', 'Mantras for everyday motivation and creative expression', 'essential', NULL, TRUE)
ON CONFLICT ("name", "category_type") DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- 2) GOAL-BASED CATEGORIES
-- ═════════════════════════════════════════════════════════════
INSERT INTO "Category" ("name", "description", "category_type", "parent_id", "is_active")
VALUES
  ('Boost Confidence & Courage', 'Mantras to build confidence and courage', 'goal', NULL, TRUE),
  ('Stay Motivated & Focused', 'Mantras for maintaining motivation and focus', 'goal', NULL, TRUE),
  ('Let Go of Fear & Anxiety', 'Mantras for releasing fear and worry', 'goal', NULL, TRUE),
  ('Improve Relationships & Communication', 'Mantras for better connections and communication', 'goal', NULL, TRUE),
  ('Cultivate Gratitude & Happiness', 'Mantras for gratitude and joy', 'goal', NULL, TRUE),
  ('Enhance Creativity & Self-Expression', 'Mantras for creative growth and self-expression', 'goal', NULL, TRUE),
  ('Build Resilience & Adaptability', 'Mantras for resilience and adapting to change', 'goal', NULL, TRUE),
  ('Improve Health & Vitality', 'Mantras for improving overall health', 'goal', NULL, TRUE),
  ('Reduce Stress & Overthinking', 'Mantras for reducing stress and mental clutter', 'goal', NULL, TRUE)
ON CONFLICT ("name", "category_type") DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- 3) MOOD / EMOTION-BASED CATEGORIES
-- ═════════════════════════════════════════════════════════════
INSERT INTO "Category" ("name", "description", "category_type", "parent_id", "is_active")
VALUES
  ('Calm / Relaxed', 'When you feel calm and want to maintain serenity', 'mood', NULL, TRUE),
  ('Stressed / Overwhelmed', 'When you feel overwhelmed or under pressure', 'mood', NULL, TRUE),
  ('Happy / Joyful', 'When you feel happy and want to amplify the joy', 'mood', NULL, TRUE),
  ('Anxious / Worried', 'When you feel anxious or worried about something', 'mood', NULL, TRUE),
  ('Sad / Lonely', 'When you feel sad or isolated', 'mood', NULL, TRUE),
  ('Grateful / Appreciative', 'When you feel thankful and want to deepen gratitude', 'mood', NULL, TRUE),
  ('Energetic / Motivated', 'When you feel energized and ready to take action', 'mood', NULL, TRUE),
  ('Reflective / Thoughtful', 'When you are in a contemplative or introspective mood', 'mood', NULL, TRUE)
ON CONFLICT ("name", "category_type") DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- 4) LIFE SCENARIOS
-- ═════════════════════════════════════════════════════════════
INSERT INTO "Category" ("name", "description", "category_type", "parent_id", "is_active")
VALUES
  ('Work Challenges & Deadlines', 'Mantras for navigating work pressure and deadlines', 'scenario', NULL, TRUE),
  ('Parenting & Family Moments', 'Mantras for parenting and family situations', 'scenario', NULL, TRUE),
  ('Romantic Relationships & Dating', 'Mantras for romantic life and dating', 'scenario', NULL, TRUE),
  ('Friendships & Social Interactions', 'Mantras for social situations and friendships', 'scenario', NULL, TRUE),
  ('Daily Life / Small Frustrations', 'Mantras for everyday annoyances and routines', 'scenario', NULL, TRUE),
  ('Celebrations & Achievements', 'Mantras for celebrating wins and milestones', 'scenario', NULL, TRUE),
  ('Travel & Adventure', 'Mantras for travel experiences and adventure', 'scenario', NULL, TRUE),
  ('Major Life Changes / Transitions', 'Mantras for navigating major life changes', 'scenario', NULL, TRUE),
  ('Tough Decisions / Dilemmas', 'Mantras for making difficult decisions', 'scenario', NULL, TRUE),
  ('Creative Projects / Hobbies', 'Mantras for creative endeavors and hobby projects', 'scenario', NULL, TRUE)
ON CONFLICT ("name", "category_type") DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- 5) TIMES OF DAY / YEAR
-- ═════════════════════════════════════════════════════════════
INSERT INTO "Category" ("name", "description", "category_type", "parent_id", "is_active")
VALUES
  ('Morning Motivation', 'Mantras to start the day with energy and positivity', 'time', NULL, TRUE),
  ('Midday Focus / Energy Boost', 'Mantras for a midday reset and renewed focus', 'time', NULL, TRUE),
  ('Evening Reflection / Winding Down', 'Mantras for reflecting on the day and settling in', 'time', NULL, TRUE),
  ('Bedtime Calm & Sleep', 'Mantras for peaceful sleep and bedtime relaxation', 'time', NULL, TRUE),
  ('Seasonal Inspiration', 'Mantras inspired by the seasons (Spring, Summer, Fall, Winter)', 'time', NULL, TRUE),
  ('Holidays & Special Occasions', 'Mantras for holidays, celebrations, and special events', 'time', NULL, TRUE)
ON CONFLICT ("name", "category_type") DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- 6) VALUES / INSPIRATIONAL THEMES
-- ═════════════════════════════════════════════════════════════
INSERT INTO "Category" ("name", "description", "category_type", "parent_id", "is_active")
VALUES
  ('Gratitude & Appreciation', 'Mantras centered on thankfulness and appreciation', 'theme', NULL, TRUE),
  ('Kindness & Compassion', 'Mantras for kindness toward self and others', 'theme', NULL, TRUE),
  ('Courage & Confidence', 'Mantras for bravery and self-assurance', 'theme', NULL, TRUE),
  ('Mindfulness & Presence', 'Mantras for staying present and aware', 'theme', NULL, TRUE),
  ('Love & Connection', 'Mantras for love, belonging, and human connection', 'theme', NULL, TRUE),
  ('Peace & Harmony', 'Mantras for inner peace and harmony', 'theme', NULL, TRUE),
  ('Positivity & Joy', 'Mantras for positive thinking and joyful living', 'theme', NULL, TRUE),
  ('Self-Love & Acceptance', 'Mantras for self-acceptance and loving yourself', 'theme', NULL, TRUE)
ON CONFLICT ("name", "category_type") DO NOTHING;
