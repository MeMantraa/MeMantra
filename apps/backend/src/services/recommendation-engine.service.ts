import { randomInt } from 'crypto';
import { ReminderModel } from '../models/reminder.model';
import { RatingModel } from '../models/rating.model';
import { LikeModel } from '../models/like.model';
import { CollectionModel } from '../models/collection.model';
import { JournalModel } from '../models/journal.model';
import { RecommendationModel } from '../models/recommendation.model';
import { MantraModel } from '../models/mantra.model';
import { UserCategoryScoreModel } from '../models/user-category-score.model';
import { Mantra } from '../types/database.types';

export interface RecommendationOptions {
  limit?: number;
  mood?: string;
  excludeIds?: number[];
}

interface UserProfile {
  /** Normalised category weights (0-1) keyed by category name */
  categoryWeights: Map<string, number>;
  /** Set of mantra IDs the user has interacted with */
  interactedMantraIds: Set<number>;
  /** Most common journal moods */
  moods: string[];
  /** Total unique mantras interacted with */
  totalInteractions: number;
}

interface ScoredMantra {
  mantra: Mantra;
  score: number;
  categories: Array<{ category_id: number; name: string }>;
  reason: string;
}

const COLD_START_THRESHOLD = 5;
const RECENCY_PENALTY_DAYS = 14;
const FRESHNESS_DECAY_DAYS = 90;
const MAX_CATEGORY_SHARE = 0.6;

/**
 * Maps moods (from journal entries) to relevant category name keywords.
 * Used to boost mantras whose categories match the user's current / dominant mood.
 */
const MOOD_CATEGORY_MAP: Record<string, string[]> = {
  anxious: ['Anxiety', 'Calm', 'Mindfulness', 'Stress', 'Relaxation', 'Anxious', 'Worried'],
  stressed: ['Stress', 'Calm', 'Relaxation', 'Mindfulness', 'Balance', 'Overwhelmed'],
  sad: ['Motivation', 'Self-Love', 'Gratitude', 'Hope', 'Positivity', 'Sad', 'Lonely'],
  angry: ['Calm', 'Patience', 'Mindfulness', 'Forgiveness', 'Peace'],
  happy: ['Gratitude', 'Joy', 'Positivity', 'Growth', 'Motivation', 'Happy', 'Joyful'],
  overwhelmed: ['Simplicity', 'Calm', 'Focus', 'Mindfulness', 'Balance', 'Stressed', 'Overwhelmed'],
  lonely: ['Connection', 'Self-Love', 'Community', 'Belonging', 'Compassion', 'Lonely'],
  fearful: ['Courage', 'Confidence', 'Strength', 'Resilience', 'Trust'],
  unmotivated: ['Motivation', 'Discipline', 'Purpose', 'Growth', 'Action', 'Motivated'],
  confident: ['Leadership', 'Growth', 'Ambition', 'Purpose', 'Strength', 'Confidence'],
};

export const RecommendationEngine = {
  /**
   * Main entry-point: generate personalised mantra recommendations for a user.
   *
   * The algorithm reads the persisted UserCategoryScore table, which records
   * cumulative interaction points per category. High-scoring categories mean
   * the user cares more about those topics, so mantras in those categories
   * are ranked higher.
   */
  async generateRecommendations(
    userId: number,
    options: RecommendationOptions = {},
  ): Promise<ScoredMantra[]> {
    const { limit = 10, mood, excludeIds = [] } = options;

    // 1. Build user profile from persisted category scores
    const profile = await this.buildUserProfile(userId);

    // 2. Cold-start path for new users
    if (profile.totalInteractions < COLD_START_THRESHOLD) {
      return this.generateColdStartRecommendations(limit, mood, excludeIds);
    }

    // 3. Fetch all mantras with their categories
    const { mantras, categoryMap } = await MantraModel.findAllWithCategories(500, 0);

    // 4. Build exclusion set (already-interacted + explicit excludes)
    const excludeSet = new Set([
      ...excludeIds,
      ...profile.interactedMantraIds,
    ]);

    const candidates = mantras.filter((m) => !excludeSet.has(m.mantra_id));

    // 5. Determine active mood
    const activeMood = mood || (profile.moods.length > 0 ? profile.moods[0] : undefined);

    // 6. Get recently recommended mantra IDs (14-day window)
    const recentRecs = await RecommendationModel.findRecent(userId, RECENCY_PENALTY_DAYS).catch(() => []);
    const recentlyRecommendedIds = recentRecs
      .filter((r) => r.mantra_id != null)
      .map((r) => r.mantra_id as number);

    // 7. Score all candidates
    const scored = this.scoreCandidates(
      candidates,
      categoryMap,
      profile,
      recentlyRecommendedIds,
      activeMood,
    );

    // 8. Apply diversity pass and limit
    const diversified = this.applyDiversityPass(scored, limit);

    // 9. Log recommendations
    await this.logRecommendations(userId, diversified);

    return diversified;
  },

  /**
   * Build a user profile from the **persisted** UserCategoryScore table.
   *
   * This replaces the old approach of gathering all signals and computing
   * category weights on every request. The scores are pre-computed and
   * updated incrementally whenever a user interacts with a mantra.
   */
  async buildUserProfile(userId: number): Promise<UserProfile> {
    // 1. Read persisted category scores
    const categoryScores = await UserCategoryScoreModel.getScoresForUserWithNames(userId);

    // 2. Build normalised weights map
    const categoryWeights = new Map<string, number>();
    const maxScore = categoryScores.length > 0
      ? Math.max(...categoryScores.map((s) => s.score), 1)
      : 1;

    for (const entry of categoryScores) {
      categoryWeights.set(entry.name, entry.score / maxScore);
    }

    // 3. Get interacted mantra IDs (union of all signal sources)
    const [
      activeReminders,
      ratings,
      likes,
      collections,
      journals,
    ] = await Promise.all([
      ReminderModel.findActiveByUserId(userId).catch(() => []),
      RatingModel.findByUserId(userId).catch(() => []),
      LikeModel.findByUserId(userId).catch(() => []),
      CollectionModel.findByUserId(userId).catch(() => []),
      JournalModel.findByUserId(userId, 100, 0).catch(() => []),
    ]);

    const savedMantraIds: number[] = [];
    for (const collection of collections) {
      const mantras = await CollectionModel.getMantrasInCollection(collection.collection_id);
      savedMantraIds.push(...mantras.map((m) => m.mantra_id));
    }

    const allMantraIds = [
      ...activeReminders.filter((r) => r.mantra_id != null).map((r) => r.mantra_id as number),
      ...ratings.map((r) => r.mantra_id),
      ...likes.filter((l) => l.mantra_id != null).map((l) => l.mantra_id as number),
      ...savedMantraIds,
      ...journals.filter((j) => j.mantra_id != null).map((j) => j.mantra_id as number),
    ];

    const interactedMantraIds = new Set(allMantraIds);

    // 4. Extract mood distribution from journals
    const moodCounts = new Map<string, number>();
    for (const j of journals) {
      if (j.mood) {
        moodCounts.set(j.mood, (moodCounts.get(j.mood) || 0) + 1);
      }
    }
    const moods = [...moodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);

    return {
      categoryWeights,
      interactedMantraIds,
      moods,
      totalInteractions: interactedMantraIds.size,
    };
  },

  /**
   * Score each candidate mantra based on:
   *   0.40 - Category match (from persisted UserCategoryScore)
   *   0.20 - Global popularity
   *   0.15 - Mood relevance
   *   0.10 - Freshness (newer content boosted)
   *   0.10 - Diversity bonus (underrepresented categories)
   *  -0.05 - Recency penalty (recently recommended)
   */
  scoreCandidates(
    candidates: Mantra[],
    categoryMap: Map<number, Array<{ category_id: number; name: string }>>,
    profile: UserProfile,
    recentlyRecommendedIds: number[],
    mood?: string,
  ): ScoredMantra[] {
    const now = Date.now();
    const recentSet = new Set(recentlyRecommendedIds);

    // Global popularity stats
    const allCategories = new Map<string, number>();
    for (const [, cats] of categoryMap) {
      for (const c of cats) {
        allCategories.set(c.name, (allCategories.get(c.name) || 0) + 1);
      }
    }
    const totalCategorized = [...allCategories.values()].reduce((a, b) => a + b, 0) || 1;

    return candidates
      .map((mantra) => {
        const cats = categoryMap.get(mantra.mantra_id) || [];

        // 1. Category score (0-1): best-match from user's persisted weights
        let categoryScore = 0;
        if (cats.length > 0) {
          const scores = cats.map((c) => profile.categoryWeights.get(c.name) || 0);
          categoryScore = Math.max(...scores);
        }

        // 2. Popularity score (0-1)
        const popularityScore =
          cats.length > 0
            ? Math.min(
                cats.reduce((sum, c) => sum + (allCategories.get(c.name) || 0), 0) / totalCategorized,
                1,
              )
            : 0;

        // 3. Mood score (0-1)
        let moodScore = 0;
        if (mood && MOOD_CATEGORY_MAP[mood.toLowerCase()]) {
          const moodCategories = MOOD_CATEGORY_MAP[mood.toLowerCase()];
          const matchCount = cats.filter((c) =>
            moodCategories.some((mc) =>
              c.name.toLowerCase().includes(mc.toLowerCase()),
            ),
          ).length;
          moodScore = cats.length > 0 ? matchCount / cats.length : 0;
        }

        // 4. Freshness score (0-1): 90-day decay
        const createdAt = mantra.created_at
          ? new Date(mantra.created_at).getTime()
          : 0;
        const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
        const freshnessScore = Math.max(0, 1 - ageDays / FRESHNESS_DECAY_DAYS);

        // 5. Diversity bonus (0-1): reward rare categories
        let diversityBonus = 0;
        if (cats.length > 0) {
          const representationScores = cats.map((c) => {
            const catCount = allCategories.get(c.name) || 0;
            return 1 - catCount / totalCategorized;
          });
          diversityBonus = Math.max(...representationScores);
        }

        // 6. Recency penalty
        const recencyPenalty = recentSet.has(mantra.mantra_id) ? 1 : 0;

        // Weighted final score
        const finalScore =
          0.4 * categoryScore +
          0.2 * popularityScore +
          0.15 * moodScore +
          0.1 * freshnessScore +
          0.1 * diversityBonus -
          0.05 * recencyPenalty;

        // Build human-readable reason
        const reasons: string[] = [];
        if (categoryScore > 0.5) reasons.push('matches your preferred categories');
        if (moodScore > 0) reasons.push(`relevant to your ${mood} mood`);
        if (freshnessScore > 0.5) reasons.push('newly added');
        if (diversityBonus > 0.7) reasons.push('explore a new topic');
        const reason =
          reasons.length > 0 ? reasons.join(', ') : 'personalized suggestion';

        return { mantra, score: finalScore, categories: cats, reason };
      })
      .sort((a, b) => b.score - a.score);
  },

  // Diversity pass
  applyDiversityPass(scored: ScoredMantra[], limit: number): ScoredMantra[] {
    if (scored.length <= limit) {
      return this.enforceCategoryBalance(scored);
    }
    const selected = scored.slice(0, limit);
    const remaining = scored.slice(limit);
    return this.enforceCategoryBalance(selected, remaining);
  },

  enforceCategoryBalance(
    selected: ScoredMantra[],
    overflow: ScoredMantra[] = [],
  ): ScoredMantra[] {
    const limit = selected.length;
    if (limit === 0) return selected;

    const maxPerCategory = Math.ceil(limit * MAX_CATEGORY_SHARE);
    const overRepresented = this._findOverRepresentedCategories(selected, maxPerCategory);
    if (overRepresented.size === 0) return selected;

    const { result, toReplace } = this._partitionSelected(selected, overRepresented, maxPerCategory);
    this._fillFromOverflow(result, toReplace, overflow, overRepresented);

    for (const idx of toReplace) {
      result.push(selected[idx]);
    }

    return result;
  },

  /** Count categories and return those exceeding the cap. */
  _findOverRepresentedCategories(
    items: ScoredMantra[],
    maxPerCategory: number,
  ): Set<string> {
    const counts = new Map<string, number>();
    for (const item of items) {
      const cat = item.categories[0]?.name || 'uncategorized';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    const overRepresented = new Set<string>();
    for (const [cat, count] of counts) {
      if (count > maxPerCategory) overRepresented.add(cat);
    }
    return overRepresented;
  },

  _partitionSelected(
    selected: ScoredMantra[],
    overRepresented: Set<string>,
    maxPerCategory: number,
  ): { result: ScoredMantra[]; toReplace: number[] } {
    const result: ScoredMantra[] = [];
    const toReplace: number[] = [];

    for (let i = 0; i < selected.length; i++) {
      const primaryCat = selected[i].categories[0]?.name || 'uncategorized';
      if (overRepresented.has(primaryCat)) {
        const currentCount = result.filter(
          (r) => (r.categories[0]?.name || 'uncategorized') === primaryCat,
        ).length;
        if (currentCount >= maxPerCategory) {
          toReplace.push(i);
          continue;
        }
      }
      result.push(selected[i]);
    }
    return { result, toReplace };
  },


  _fillFromOverflow(
    result: ScoredMantra[],
    toReplace: number[],
    overflow: ScoredMantra[],
    overRepresented: Set<string>,
  ): void {
    for (const replacement of overflow) {
      if (toReplace.length === 0) break;
      const cat = replacement.categories[0]?.name || 'uncategorized';
      if (!overRepresented.has(cat)) {
        result.push(replacement);
        toReplace.shift();
      }
    }
  },

  // Cold-start
  async generateColdStartRecommendations(
    limit: number,
    mood?: string,
    excludeIds: number[] = [],
  ): Promise<ScoredMantra[]> {
    const { mantras, categoryMap } = await MantraModel.findAllWithCategories(200, 0);
    const excludeSet = new Set(excludeIds);
    let candidates = mantras.filter((m) => !excludeSet.has(m.mantra_id));

    if (mood && MOOD_CATEGORY_MAP[mood.toLowerCase()]) {
      const moodCategories = MOOD_CATEGORY_MAP[mood.toLowerCase()];
      const moodFiltered = candidates.filter((m) => {
        const cats = categoryMap.get(m.mantra_id) || [];
        return cats.some((c) =>
          moodCategories.some((mc) =>
            c.name.toLowerCase().includes(mc.toLowerCase()),
          ),
        );
      });
      if (moodFiltered.length >= limit) {
        candidates = moodFiltered;
      }
    }

    const now = Date.now();

    const scored: ScoredMantra[] = candidates.map((mantra) => {
      const cats = categoryMap.get(mantra.mantra_id) || [];
      const popularityScore = cats.length > 0 ? Math.min(cats.length / 5, 1) : 0;

      const createdAt = mantra.created_at
        ? new Date(mantra.created_at).getTime()
        : 0;
      const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(0, 1 - ageDays / FRESHNESS_DECAY_DAYS);

      const randomScore = randomInt(0, 1000000) / 1000000;

      const score =
        0.6 * popularityScore + 0.2 * freshnessScore + 0.2 * randomScore;

      return {
        mantra,
        score,
        categories: cats,
        reason: mood ? `suggested for ${mood} mood` : 'popular mantra',
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  },

  // Logging
  async logRecommendations(
    userId: number,
    recommendations: ScoredMantra[],
  ): Promise<void> {
    for (const rec of recommendations) {
      await RecommendationModel.create({
        user_id: userId,
        mantra_id: rec.mantra.mantra_id,
        reason: rec.reason,
      }).catch(() => {
        // Non-critical: don't fail the whole recommendation if logging fails
      });
    }
  },
};
