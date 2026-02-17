import { ReminderModel } from '../models/reminder.model';
import { RatingModel } from '../models/rating.model';
import { LikeModel } from '../models/like.model';
import { CollectionModel } from '../models/collection.model';
import { JournalModel } from '../models/journal.model';
import { RecommendationModel } from '../models/recommendation.model';
import { MantraModel } from '../models/mantra.model';
import { Mantra } from '../types/database.types';

export interface RecommendationOptions {
  limit?: number;
  mood?: string;
  excludeIds?: number[];
}

interface UserSignals {
  reminderMantraIds: number[];
  fiveStarMantraIds: number[];
  fourStarMantraIds: number[];
  likedMantraIds: number[];
  savedMantraIds: number[];
  journaledMantraIds: number[];
  journalMoods: string[];
  recentlyRecommendedIds: number[];
}

interface UserProfile {
  categoryWeights: Map<string, number>;
  interactedMantraIds: Set<number>;
  moods: string[];
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

const MOOD_CATEGORY_MAP: Record<string, string[]> = {
  anxious: ['Anxiety', 'Calm', 'Mindfulness', 'Stress', 'Relaxation'],
  stressed: ['Stress', 'Calm', 'Relaxation', 'Mindfulness', 'Balance'],
  sad: ['Motivation', 'Self-Love', 'Gratitude', 'Hope', 'Positivity'],
  angry: ['Calm', 'Patience', 'Mindfulness', 'Forgiveness', 'Peace'],
  happy: ['Gratitude', 'Joy', 'Positivity', 'Growth', 'Motivation'],
  overwhelmed: ['Simplicity', 'Calm', 'Focus', 'Mindfulness', 'Balance'],
  lonely: ['Connection', 'Self-Love', 'Community', 'Belonging', 'Compassion'],
  fearful: ['Courage', 'Confidence', 'Strength', 'Resilience', 'Trust'],
  unmotivated: ['Motivation', 'Discipline', 'Purpose', 'Growth', 'Action'],
  confident: ['Leadership', 'Growth', 'Ambition', 'Purpose', 'Strength'],
};

export const RecommendationEngine = {
  async generateRecommendations(
    userId: number,
    options: RecommendationOptions = {},
  ): Promise<ScoredMantra[]> {
    const { limit = 10, mood, excludeIds = [] } = options;

    const signals = await this.gatherUserSignals(userId);
    const profile = await this.buildUserProfile(signals);

    const isColdStart = profile.totalInteractions < COLD_START_THRESHOLD;

    if (isColdStart) {
      return this.generateColdStartRecommendations(limit, mood, excludeIds);
    }

    const { mantras, categoryMap } = await MantraModel.findAllWithCategories(500, 0);

    const excludeSet = new Set([
      ...excludeIds,
      ...profile.interactedMantraIds,
    ]);

    const candidates = mantras.filter(
      (m) => !excludeSet.has(m.mantra_id),
    );

    const activeMood = mood || (profile.moods.length > 0 ? profile.moods[0] : undefined);

    const scored = this.scoreCandidates(
      candidates,
      categoryMap,
      profile,
      signals,
      activeMood,
    );

    const diversified = this.applyDiversityPass(scored, limit);

    await this.logRecommendations(userId, diversified);

    return diversified;
  },

  async gatherUserSignals(userId: number): Promise<UserSignals> {
    const [
      activeReminders,
      ratings,
      likes,
      collections,
      journals,
      recentRecs,
    ] = await Promise.all([
      ReminderModel.findActiveByUserId(userId).catch(() => []),
      RatingModel.findByUserId(userId).catch(() => []),
      LikeModel.findByUserId(userId).catch(() => []),
      CollectionModel.findByUserId(userId).catch(() => []),
      JournalModel.findByUserId(userId, 100, 0).catch(() => []),
      RecommendationModel.findRecent(userId, RECENCY_PENALTY_DAYS).catch(() => []),
    ]);

    const fiveStarMantraIds = ratings
      .filter((r) => r.rating === 5)
      .map((r) => r.mantra_id);
    const fourStarMantraIds = ratings
      .filter((r) => r.rating === 4)
      .map((r) => r.mantra_id);

    // Gather saved mantra IDs from all user collections
    const savedMantraIds: number[] = [];
    for (const collection of collections) {
      const mantras = await CollectionModel.getMantrasInCollection(collection.collection_id);
      savedMantraIds.push(...mantras.map((m) => m.mantra_id));
    }

    return {
      reminderMantraIds: activeReminders
        .filter((r) => r.mantra_id != null)
        .map((r) => r.mantra_id as number),
      fiveStarMantraIds,
      fourStarMantraIds,
      likedMantraIds: likes
        .filter((l) => l.mantra_id != null)
        .map((l) => l.mantra_id as number),
      savedMantraIds,
      journaledMantraIds: journals
        .filter((j) => j.mantra_id != null)
        .map((j) => j.mantra_id as number),
      journalMoods: journals
        .filter((j) => j.mood != null)
        .map((j) => j.mood as string),
      recentlyRecommendedIds: recentRecs
        .filter((r) => r.mantra_id != null)
        .map((r) => r.mantra_id as number),
    };
  },

  async buildUserProfile(signals: UserSignals): Promise<UserProfile> {
    const allMantraIds = [
      ...signals.reminderMantraIds,
      ...signals.fiveStarMantraIds,
      ...signals.fourStarMantraIds,
      ...signals.likedMantraIds,
      ...signals.savedMantraIds,
      ...signals.journaledMantraIds,
    ];

    const interactedMantraIds = new Set(allMantraIds);
    const totalInteractions = interactedMantraIds.size;

    // Build category weights from interacted mantras
    const categoryWeights = new Map<string, number>();

    if (allMantraIds.length > 0) {
      const { CategoryModel } = await import('../models/category.model');
      const uniqueIds = [...interactedMantraIds];
      const categoryMappings = await CategoryModel.getCategoriesForMantras(uniqueIds);

      const weightedIds = new Map<number, number>();

      for (const id of signals.reminderMantraIds) {
        weightedIds.set(id, (weightedIds.get(id) || 0) + 5.0);
      }
      for (const id of signals.fiveStarMantraIds) {
        weightedIds.set(id, (weightedIds.get(id) || 0) + 4.0);
      }
      for (const id of signals.fourStarMantraIds) {
        weightedIds.set(id, (weightedIds.get(id) || 0) + 3.0);
      }
      for (const id of signals.likedMantraIds) {
        weightedIds.set(id, (weightedIds.get(id) || 0) + 3.0);
      }
      for (const id of signals.savedMantraIds) {
        weightedIds.set(id, (weightedIds.get(id) || 0) + 2.5);
      }
      for (const id of signals.journaledMantraIds) {
        weightedIds.set(id, (weightedIds.get(id) || 0) + 2.0);
      }

      for (const mapping of categoryMappings) {
        const mantraWeight = weightedIds.get(mapping.mantra_id) || 1;
        const current = categoryWeights.get(mapping.name) || 0;
        categoryWeights.set(mapping.name, current + mantraWeight);
      }

      // Normalize category weights
      const maxWeight = Math.max(...categoryWeights.values(), 1);
      for (const [cat, weight] of categoryWeights) {
        categoryWeights.set(cat, weight / maxWeight);
      }
    }

    // Get most common recent mood
    const moodCounts = new Map<string, number>();
    for (const mood of signals.journalMoods) {
      moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
    }
    const moods = [...moodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([mood]) => mood);

    return {
      categoryWeights,
      interactedMantraIds,
      moods,
      totalInteractions,
    };
  },

  scoreCandidates(
    candidates: Mantra[],
    categoryMap: Map<number, Array<{ category_id: number; name: string }>>,
    profile: UserProfile,
    signals: UserSignals,
    mood?: string,
  ): ScoredMantra[] {
    const now = Date.now();
    const recentSet = new Set(signals.recentlyRecommendedIds);

    // Compute global popularity stats
    const allCategories = new Map<string, number>();
    for (const [, cats] of categoryMap) {
      for (const c of cats) {
        allCategories.set(c.name, (allCategories.get(c.name) || 0) + 1);
      }
    }
    const totalCategorized = [...allCategories.values()].reduce((a, b) => a + b, 0) || 1;

    return candidates.map((mantra) => {
      const cats = categoryMap.get(mantra.mantra_id) || [];

      // 1. Category score (0-1): how well does this mantra's categories match user preferences
      let categoryScore = 0;
      if (cats.length > 0) {
        const scores = cats.map((c) => profile.categoryWeights.get(c.name) || 0);
        categoryScore = Math.max(...scores);
      }

      // 2. Popularity score (0-1): based on global category representation
      const popularityScore = cats.length > 0
        ? Math.min(cats.reduce((sum, c) => sum + (allCategories.get(c.name) || 0), 0) / totalCategorized, 1)
        : 0;

      // 3. Mood score (0-1): does mantra category match the active mood
      let moodScore = 0;
      if (mood && MOOD_CATEGORY_MAP[mood.toLowerCase()]) {
        const moodCategories = MOOD_CATEGORY_MAP[mood.toLowerCase()];
        const matchCount = cats.filter((c) =>
          moodCategories.some((mc) => c.name.toLowerCase().includes(mc.toLowerCase())),
        ).length;
        moodScore = cats.length > 0 ? matchCount / cats.length : 0;
      }

      // 4. Freshness score (0-1): newer content boosted with 90-day decay
      const createdAt = mantra.created_at ? new Date(mantra.created_at).getTime() : 0;
      const ageMs = now - createdAt;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(0, 1 - ageDays / FRESHNESS_DECAY_DAYS);

      // 5. Diversity bonus (0-1): bonus for underrepresented categories
      let diversityBonus = 0;
      if (cats.length > 0) {
        const representationScores = cats.map((c) => {
          const catCount = allCategories.get(c.name) || 0;
          return 1 - catCount / totalCategorized;
        });
        diversityBonus = Math.max(...representationScores);
      }

      // 6. Recency penalty (0-1): penalize recently recommended
      const recencyPenalty = recentSet.has(mantra.mantra_id) ? 1 : 0;

      // Apply weighted scoring formula
      const finalScore =
        0.40 * categoryScore +
        0.20 * popularityScore +
        0.15 * moodScore +
        0.10 * freshnessScore +
        0.10 * diversityBonus -
        0.05 * recencyPenalty;

      // Build reason string
      const reasons: string[] = [];
      if (categoryScore > 0.5) reasons.push('matches your preferred categories');
      if (moodScore > 0) reasons.push(`relevant to your ${mood} mood`);
      if (freshnessScore > 0.5) reasons.push('newly added');
      if (diversityBonus > 0.7) reasons.push('explore a new topic');
      const reason = reasons.length > 0 ? reasons.join(', ') : 'personalized suggestion';

      return {
        mantra,
        score: finalScore,
        categories: cats,
        reason,
      };
    }).sort((a, b) => b.score - a.score);
  },

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

    // Count primary categories
    const categoryCounts = new Map<string, number>();
    for (const item of selected) {
      const primaryCat = item.categories[0]?.name || 'uncategorized';
      categoryCounts.set(primaryCat, (categoryCounts.get(primaryCat) || 0) + 1);
    }

    // Find over-represented categories
    const overRepresented = new Set<string>();
    for (const [cat, count] of categoryCounts) {
      if (count > maxPerCategory) {
        overRepresented.add(cat);
      }
    }

    if (overRepresented.size === 0) return selected;

    const result: ScoredMantra[] = [];
    const toReplace: number[] = [];

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      const primaryCat = item.categories[0]?.name || 'uncategorized';

      if (overRepresented.has(primaryCat)) {
        const currentCount = result.filter(
          (r) => (r.categories[0]?.name || 'uncategorized') === primaryCat,
        ).length;

        if (currentCount >= maxPerCategory) {
          toReplace.push(i);
          continue;
        }
      }
      result.push(item);
    }

    // Fill replacements from overflow with different categories
    for (const replacement of overflow) {
      if (toReplace.length === 0) break;
      const replacementCat = replacement.categories[0]?.name || 'uncategorized';
      if (!overRepresented.has(replacementCat)) {
        result.push(replacement);
        toReplace.shift();
      }
    }

    // If we couldn't find enough replacements, add back originals
    for (const idx of toReplace) {
      result.push(selected[idx]);
    }

    return result;
  },

  async generateColdStartRecommendations(
    limit: number,
    mood?: string,
    excludeIds: number[] = [],
  ): Promise<ScoredMantra[]> {
    const { mantras, categoryMap } = await MantraModel.findAllWithCategories(200, 0);
    const excludeSet = new Set(excludeIds);
    let candidates = mantras.filter((m) => !excludeSet.has(m.mantra_id));

    // If mood provided, filter by mood-relevant categories
    if (mood && MOOD_CATEGORY_MAP[mood.toLowerCase()]) {
      const moodCategories = MOOD_CATEGORY_MAP[mood.toLowerCase()];
      const moodFiltered = candidates.filter((m) => {
        const cats = categoryMap.get(m.mantra_id) || [];
        return cats.some((c) =>
          moodCategories.some((mc) => c.name.toLowerCase().includes(mc.toLowerCase())),
        );
      });
      // Only use filtered if we have enough results
      if (moodFiltered.length >= limit) {
        candidates = moodFiltered;
      }
    }

    const now = Date.now();

    const scored: ScoredMantra[] = candidates.map((mantra) => {
      const cats = categoryMap.get(mantra.mantra_id) || [];

      // Cold start: 60% popularity, 20% freshness, 20% random
      const popularityScore = cats.length > 0 ? Math.min(cats.length / 5, 1) : 0;

      const createdAt = mantra.created_at ? new Date(mantra.created_at).getTime() : 0;
      const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(0, 1 - ageDays / FRESHNESS_DECAY_DAYS);

      const randomScore = Math.random();

      const score = 0.60 * popularityScore + 0.20 * freshnessScore + 0.20 * randomScore;

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

  async logRecommendations(userId: number, recommendations: ScoredMantra[]): Promise<void> {
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
