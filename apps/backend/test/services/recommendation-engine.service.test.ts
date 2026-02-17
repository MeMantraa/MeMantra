import { RecommendationEngine } from '../../src/services/recommendation-engine.service';
import { ReminderModel } from '../../src/models/reminder.model';
import { RatingModel } from '../../src/models/rating.model';
import { LikeModel } from '../../src/models/like.model';
import { CollectionModel } from '../../src/models/collection.model';
import { JournalModel } from '../../src/models/journal.model';
import { RecommendationModel } from '../../src/models/recommendation.model';
import { MantraModel } from '../../src/models/mantra.model';
import { CategoryModel } from '../../src/models/category.model';

jest.mock('../../src/models/reminder.model');
jest.mock('../../src/models/rating.model');
jest.mock('../../src/models/like.model');
jest.mock('../../src/models/collection.model');
jest.mock('../../src/models/journal.model');
jest.mock('../../src/models/recommendation.model');
jest.mock('../../src/models/mantra.model');
jest.mock('../../src/models/category.model');

const mockMantra = (id: number, daysOld = 30) => ({
  mantra_id: id,
  title: `Mantra ${id}`,
  key_takeaway: `Takeaway ${id}`,
  background_author: null,
  background_description: null,
  jamie_take: null,
  when_where: null,
  negative_thoughts: null,
  cbt_principles: null,
  references: null,
  created_by: null,
  is_active: true,
  created_at: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString(),
});

const buildCategoryMap = (mappings: Record<number, Array<{ category_id: number; name: string }>>) => {
  const map = new Map<number, Array<{ category_id: number; name: string }>>();
  for (const [id, cats] of Object.entries(mappings)) {
    map.set(Number(id), cats);
  }
  return map;
};

describe('RecommendationEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gatherUserSignals', () => {
    it('should gather all signals in parallel', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([
        { reminder_id: 1, mantra_id: 10, status: 'active' },
      ]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([
        { rating_id: 1, mantra_id: 20, rating: 5 },
        { rating_id: 2, mantra_id: 21, rating: 4 },
        { rating_id: 3, mantra_id: 22, rating: 3 },
      ]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([
        { like_id: 1, mantra_id: 30 },
      ]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([
        { collection_id: 1 },
      ]);
      (CollectionModel.getMantrasInCollection as jest.Mock).mockResolvedValue([
        { mantra_id: 40 },
      ]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([
        { journal_id: 1, mantra_id: 50, mood: 'anxious' },
      ]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([
        { rec_id: 1, mantra_id: 60 },
      ]);

      const signals = await RecommendationEngine.gatherUserSignals(1);

      expect(signals.reminderMantraIds).toEqual([10]);
      expect(signals.fiveStarMantraIds).toEqual([20]);
      expect(signals.fourStarMantraIds).toEqual([21]);
      expect(signals.likedMantraIds).toEqual([30]);
      expect(signals.savedMantraIds).toEqual([40]);
      expect(signals.journaledMantraIds).toEqual([50]);
      expect(signals.journalMoods).toEqual(['anxious']);
      expect(signals.recentlyRecommendedIds).toEqual([60]);
    });

    it('should handle empty results gracefully', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);

      const signals = await RecommendationEngine.gatherUserSignals(1);

      expect(signals.reminderMantraIds).toEqual([]);
      expect(signals.fiveStarMantraIds).toEqual([]);
      expect(signals.fourStarMantraIds).toEqual([]);
      expect(signals.likedMantraIds).toEqual([]);
      expect(signals.savedMantraIds).toEqual([]);
      expect(signals.journaledMantraIds).toEqual([]);
      expect(signals.journalMoods).toEqual([]);
      expect(signals.recentlyRecommendedIds).toEqual([]);
    });

    it('should handle errors from individual models without failing', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));
      (RatingModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));
      (LikeModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));
      (CollectionModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));
      (JournalModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));
      (RecommendationModel.findRecent as jest.Mock).mockRejectedValue(new Error('DB error'));

      const signals = await RecommendationEngine.gatherUserSignals(1);

      expect(signals.reminderMantraIds).toEqual([]);
      expect(signals.fiveStarMantraIds).toEqual([]);
      expect(signals.likedMantraIds).toEqual([]);
    });

    it('should filter out null mantra_ids', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([
        { reminder_id: 1, mantra_id: null },
        { reminder_id: 2, mantra_id: 10 },
      ]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([
        { like_id: 1, mantra_id: null },
      ]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([
        { journal_id: 1, mantra_id: null, mood: null },
      ]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);

      const signals = await RecommendationEngine.gatherUserSignals(1);

      expect(signals.reminderMantraIds).toEqual([10]);
      expect(signals.likedMantraIds).toEqual([]);
      expect(signals.journaledMantraIds).toEqual([]);
      expect(signals.journalMoods).toEqual([]);
    });
  });

  describe('buildUserProfile', () => {
    it('should build profile with correct category weights', async () => {
      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([
        { mantra_id: 1, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 101, name: 'Calm' },
      ]);

      const signals = {
        reminderMantraIds: [1],
        fiveStarMantraIds: [2],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: ['anxious', 'anxious', 'stressed'],
        recentlyRecommendedIds: [],
      };

      const profile = await RecommendationEngine.buildUserProfile(signals);

      expect(profile.totalInteractions).toBe(2);
      expect(profile.interactedMantraIds.has(1)).toBe(true);
      expect(profile.interactedMantraIds.has(2)).toBe(true);
      expect(profile.categoryWeights.has('Anxiety')).toBe(true);
      expect(profile.categoryWeights.has('Calm')).toBe(true);
      expect(profile.moods[0]).toBe('anxious'); // most common
    });

    it('should return empty profile when no interactions', async () => {
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const profile = await RecommendationEngine.buildUserProfile(signals);

      expect(profile.totalInteractions).toBe(0);
      expect(profile.categoryWeights.size).toBe(0);
      expect(profile.moods).toEqual([]);
    });

    it('should normalize category weights to max of 1', async () => {
      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([
        { mantra_id: 1, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 101, name: 'Calm' },
      ]);

      const signals = {
        reminderMantraIds: [1], // weight 5.0
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [2], // weight 3.0
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const profile = await RecommendationEngine.buildUserProfile(signals);

      // Anxiety should be normalized to 1.0 (highest), Calm should be 3/5 = 0.6
      expect(profile.categoryWeights.get('Anxiety')).toBe(1);
      expect(profile.categoryWeights.get('Calm')).toBeCloseTo(0.6);
    });

    it('should weight signals correctly (reminders highest)', async () => {
      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([
        { mantra_id: 1, category_id: 100, name: 'CatA' },
        { mantra_id: 2, category_id: 101, name: 'CatB' },
      ]);

      const signals = {
        reminderMantraIds: [1],    // 5.0
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [2],   // 2.0
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const profile = await RecommendationEngine.buildUserProfile(signals);

      // CatA (reminder=5.0) should have higher weight than CatB (journal=2.0)
      const catA = profile.categoryWeights.get('CatA')!;
      const catB = profile.categoryWeights.get('CatB')!;
      expect(catA).toBeGreaterThan(catB);
    });
  });

  describe('scoreCandidates', () => {
    it('should score candidates and sort by score descending', () => {
      const candidates = [mockMantra(1, 10), mockMantra(2, 80), mockMantra(3, 5)];
      const categoryMap = buildCategoryMap({
        1: [{ category_id: 100, name: 'Anxiety' }],
        2: [{ category_id: 101, name: 'Calm' }],
        3: [{ category_id: 100, name: 'Anxiety' }],
      });
      const profile = {
        categoryWeights: new Map([['Anxiety', 1.0], ['Calm', 0.3]]),
        interactedMantraIds: new Set<number>(),
        moods: [],
        totalInteractions: 5,
      };
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const scored = RecommendationEngine.scoreCandidates(
        candidates, categoryMap, profile, signals,
      );

      expect(scored.length).toBe(3);
      // Results should be sorted by score descending
      expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
      expect(scored[1].score).toBeGreaterThanOrEqual(scored[2].score);
    });

    it('should apply mood score when mood is provided', () => {
      const candidates = [mockMantra(1), mockMantra(2)];
      const categoryMap = buildCategoryMap({
        1: [{ category_id: 100, name: 'Anxiety' }], // matches 'anxious'
        2: [{ category_id: 101, name: 'Leadership' }], // doesn't match
      });
      const profile = {
        categoryWeights: new Map<string, number>(),
        interactedMantraIds: new Set<number>(),
        moods: [],
        totalInteractions: 5,
      };
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const scored = RecommendationEngine.scoreCandidates(
        candidates, categoryMap, profile, signals, 'anxious',
      );

      const anxietyMantra = scored.find((s) => s.mantra.mantra_id === 1)!;
      const leadershipMantra = scored.find((s) => s.mantra.mantra_id === 2)!;

      expect(anxietyMantra.score).toBeGreaterThan(leadershipMantra.score);
    });

    it('should penalize recently recommended mantras', () => {
      const candidates = [mockMantra(1), mockMantra(2)];
      const categoryMap = buildCategoryMap({
        1: [{ category_id: 100, name: 'Anxiety' }],
        2: [{ category_id: 100, name: 'Anxiety' }],
      });
      const profile = {
        categoryWeights: new Map([['Anxiety', 1.0]]),
        interactedMantraIds: new Set<number>(),
        moods: [],
        totalInteractions: 5,
      };
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [1], // mantra 1 was recently recommended
      };

      const scored = RecommendationEngine.scoreCandidates(
        candidates, categoryMap, profile, signals,
      );

      const mantra1 = scored.find((s) => s.mantra.mantra_id === 1)!;
      const mantra2 = scored.find((s) => s.mantra.mantra_id === 2)!;

      expect(mantra2.score).toBeGreaterThan(mantra1.score);
    });

    it('should boost fresher content', () => {
      const candidates = [mockMantra(1, 5), mockMantra(2, 120)]; // 5 days vs 120 days old
      const categoryMap = buildCategoryMap({
        1: [{ category_id: 100, name: 'Anxiety' }],
        2: [{ category_id: 100, name: 'Anxiety' }],
      });
      const profile = {
        categoryWeights: new Map([['Anxiety', 1.0]]),
        interactedMantraIds: new Set<number>(),
        moods: [],
        totalInteractions: 5,
      };
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const scored = RecommendationEngine.scoreCandidates(
        candidates, categoryMap, profile, signals,
      );

      const fresh = scored.find((s) => s.mantra.mantra_id === 1)!;
      const old = scored.find((s) => s.mantra.mantra_id === 2)!;

      expect(fresh.score).toBeGreaterThan(old.score);
    });

    it('should handle candidates with no categories', () => {
      const candidates = [mockMantra(1)];
      const categoryMap = buildCategoryMap({}); // no categories
      const profile = {
        categoryWeights: new Map<string, number>(),
        interactedMantraIds: new Set<number>(),
        moods: [],
        totalInteractions: 5,
      };
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const scored = RecommendationEngine.scoreCandidates(
        candidates, categoryMap, profile, signals,
      );

      expect(scored.length).toBe(1);
      expect(scored[0].score).toBeGreaterThanOrEqual(0);
    });

    it('should include reason strings for scored mantras', () => {
      const candidates = [mockMantra(1, 2)];
      const categoryMap = buildCategoryMap({
        1: [{ category_id: 100, name: 'Anxiety' }],
      });
      const profile = {
        categoryWeights: new Map([['Anxiety', 0.8]]),
        interactedMantraIds: new Set<number>(),
        moods: [],
        totalInteractions: 5,
      };
      const signals = {
        reminderMantraIds: [],
        fiveStarMantraIds: [],
        fourStarMantraIds: [],
        likedMantraIds: [],
        savedMantraIds: [],
        journaledMantraIds: [],
        journalMoods: [],
        recentlyRecommendedIds: [],
      };

      const scored = RecommendationEngine.scoreCandidates(
        candidates, categoryMap, profile, signals, 'anxious',
      );

      expect(scored[0].reason).toBeDefined();
      expect(typeof scored[0].reason).toBe('string');
      expect(scored[0].reason.length).toBeGreaterThan(0);
    });
  });

  describe('applyDiversityPass', () => {
    it('should enforce category balance (no category > 60%)', () => {
      const scored: Array<{
        mantra: ReturnType<typeof mockMantra>;
        score: number;
        categories: Array<{ category_id: number; name: string }>;
        reason: string;
      }> = [];

      // 8 mantras all in 'Anxiety' category
      for (let i = 1; i <= 8; i++) {
        scored.push({
          mantra: mockMantra(i),
          score: 1 - i * 0.01,
          categories: [{ category_id: 100, name: 'Anxiety' }],
          reason: 'test',
        });
      }
      // 2 mantras in 'Calm' category
      for (let i = 9; i <= 10; i++) {
        scored.push({
          mantra: mockMantra(i),
          score: 0.5 - i * 0.01,
          categories: [{ category_id: 101, name: 'Calm' }],
          reason: 'test',
        });
      }
      // Additional overflow mantras for replacement
      for (let i = 11; i <= 15; i++) {
        scored.push({
          mantra: mockMantra(i),
          score: 0.3 - i * 0.01,
          categories: [{ category_id: 102, name: 'Motivation' }],
          reason: 'test',
        });
      }

      const result = RecommendationEngine.applyDiversityPass(scored, 10);

      // Count per category
      const catCounts = new Map<string, number>();
      for (const r of result) {
        const cat = r.categories[0]?.name || 'uncategorized';
        catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
      }

      // No category should exceed 60% of results (6 out of 10)
      for (const [, count] of catCounts) {
        expect(count).toBeLessThanOrEqual(Math.ceil(10 * 0.6));
      }
    });

    it('should return all items if count <= limit', () => {
      const scored = [
        {
          mantra: mockMantra(1),
          score: 0.9,
          categories: [{ category_id: 100, name: 'Anxiety' }],
          reason: 'test',
        },
        {
          mantra: mockMantra(2),
          score: 0.8,
          categories: [{ category_id: 101, name: 'Calm' }],
          reason: 'test',
        },
      ];

      const result = RecommendationEngine.applyDiversityPass(scored, 10);

      expect(result.length).toBe(2);
    });

    it('should not modify results when categories are already balanced', () => {
      const scored = [];
      for (let i = 1; i <= 10; i++) {
        scored.push({
          mantra: mockMantra(i),
          score: 1 - i * 0.01,
          categories: [{ category_id: 100 + (i % 3), name: `Cat${i % 3}` }],
          reason: 'test',
        });
      }

      const result = RecommendationEngine.applyDiversityPass(scored, 10);

      expect(result.length).toBe(10);
    });
  });

  describe('generateColdStartRecommendations', () => {
    it('should return popularity-weighted results for new users', async () => {
      const mantras = Array.from({ length: 20 }, (_, i) => mockMantra(i + 1));
      const categoryMap = buildCategoryMap(
        Object.fromEntries(mantras.map((m) => [m.mantra_id, [{ category_id: 100, name: 'General' }]])),
      );

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateColdStartRecommendations(10);

      expect(result.length).toBe(10);
      expect(result[0].reason).toBe('popular mantra');
    });

    it('should apply mood filtering when mood is provided', async () => {
      const mantras = Array.from({ length: 20 }, (_, i) => mockMantra(i + 1));
      const categoryMap = new Map<number, Array<{ category_id: number; name: string }>>();

      // First 10 mantras have Anxiety category, last 10 have Leadership
      for (let i = 1; i <= 10; i++) {
        categoryMap.set(i, [{ category_id: 100, name: 'Anxiety' }]);
      }
      for (let i = 11; i <= 20; i++) {
        categoryMap.set(i, [{ category_id: 101, name: 'Leadership' }]);
      }

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateColdStartRecommendations(10, 'anxious');

      // All results should be from Anxiety category (mood match)
      for (const item of result) {
        expect(item.categories.some((c) => c.name === 'Anxiety')).toBe(true);
      }
      expect(result[0].reason).toBe('suggested for anxious mood');
    });

    it('should exclude specified mantra IDs', async () => {
      const mantras = Array.from({ length: 10 }, (_, i) => mockMantra(i + 1));
      const categoryMap = buildCategoryMap(
        Object.fromEntries(mantras.map((m) => [m.mantra_id, [{ category_id: 100, name: 'General' }]])),
      );

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateColdStartRecommendations(10, undefined, [1, 2, 3]);

      const resultIds = result.map((r) => r.mantra.mantra_id);
      expect(resultIds).not.toContain(1);
      expect(resultIds).not.toContain(2);
      expect(resultIds).not.toContain(3);
    });

    it('should fall back to unfiltered if mood filter yields too few results', async () => {
      const mantras = Array.from({ length: 10 }, (_, i) => mockMantra(i + 1));
      const categoryMap = new Map<number, Array<{ category_id: number; name: string }>>();

      // Only 2 mantras match the mood
      categoryMap.set(1, [{ category_id: 100, name: 'Anxiety' }]);
      categoryMap.set(2, [{ category_id: 100, name: 'Calm' }]);
      for (let i = 3; i <= 10; i++) {
        categoryMap.set(i, [{ category_id: 101, name: 'Leadership' }]);
      }

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateColdStartRecommendations(5, 'anxious');

      // Should include more than just the 2 mood-matched ones since 2 < 5
      expect(result.length).toBe(5);
    });
  });

  describe('generateRecommendations (full flow)', () => {
    it('should use cold start path for users with < 5 interactions', async () => {
      // User has no interactions
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);
      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([]);

      const mantras = Array.from({ length: 15 }, (_, i) => mockMantra(i + 1));
      const categoryMap = buildCategoryMap(
        Object.fromEntries(mantras.map((m) => [m.mantra_id, [{ category_id: 100, name: 'General' }]])),
      );

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateRecommendations(1, { limit: 5 });

      expect(result.length).toBe(5);
    });

    it('should use personalized path for users with >= 5 interactions', async () => {
      // User has 6 interactions
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([
        { reminder_id: 1, mantra_id: 1, status: 'active' },
      ]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([
        { rating_id: 1, mantra_id: 2, rating: 5 },
        { rating_id: 2, mantra_id: 3, rating: 4 },
      ]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([
        { like_id: 1, mantra_id: 4 },
        { like_id: 2, mantra_id: 5 },
      ]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([
        { collection_id: 1 },
      ]);
      (CollectionModel.getMantrasInCollection as jest.Mock).mockResolvedValue([
        { mantra_id: 6 },
      ]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.create as jest.Mock).mockResolvedValue({});

      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([
        { mantra_id: 1, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 100, name: 'Anxiety' },
        { mantra_id: 3, category_id: 101, name: 'Calm' },
        { mantra_id: 4, category_id: 100, name: 'Anxiety' },
        { mantra_id: 5, category_id: 102, name: 'Motivation' },
        { mantra_id: 6, category_id: 101, name: 'Calm' },
      ]);

      // Create candidate mantras (not interacted with)
      const mantras = Array.from({ length: 20 }, (_, i) => mockMantra(i + 1));
      const categoryMap = new Map<number, Array<{ category_id: number; name: string }>>();
      for (let i = 1; i <= 20; i++) {
        categoryMap.set(i, [{ category_id: 100, name: i % 2 === 0 ? 'Anxiety' : 'Calm' }]);
      }

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateRecommendations(1, { limit: 5 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
      // Should not include interacted mantras
      const resultIds = result.map((r) => r.mantra.mantra_id);
      expect(resultIds).not.toContain(1);
      expect(resultIds).not.toContain(2);
      expect(resultIds).not.toContain(3);
      expect(resultIds).not.toContain(4);
      expect(resultIds).not.toContain(5);
      expect(resultIds).not.toContain(6);
    });

    it('should exclude specified mantra IDs', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);
      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([]);

      const mantras = Array.from({ length: 15 }, (_, i) => mockMantra(i + 1));
      const categoryMap = buildCategoryMap(
        Object.fromEntries(mantras.map((m) => [m.mantra_id, [{ category_id: 100, name: 'General' }]])),
      );

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateRecommendations(1, {
        limit: 5,
        excludeIds: [1, 2],
      });

      const resultIds = result.map((r) => r.mantra.mantra_id);
      expect(resultIds).not.toContain(1);
      expect(resultIds).not.toContain(2);
    });

    it('should log recommendations after generating them', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([
        { reminder_id: 1, mantra_id: 1 },
        { reminder_id: 2, mantra_id: 2 },
        { reminder_id: 3, mantra_id: 3 },
        { reminder_id: 4, mantra_id: 4 },
        { reminder_id: 5, mantra_id: 5 },
      ]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.create as jest.Mock).mockResolvedValue({});

      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([
        { mantra_id: 1, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 100, name: 'Anxiety' },
        { mantra_id: 3, category_id: 100, name: 'Anxiety' },
        { mantra_id: 4, category_id: 100, name: 'Anxiety' },
        { mantra_id: 5, category_id: 100, name: 'Anxiety' },
      ]);

      const mantras = Array.from({ length: 20 }, (_, i) => mockMantra(i + 1));
      const categoryMap = new Map<number, Array<{ category_id: number; name: string }>>();
      for (let i = 1; i <= 20; i++) {
        categoryMap.set(i, [{ category_id: 100, name: 'Anxiety' }]);
      }

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      await RecommendationEngine.generateRecommendations(1, { limit: 3 });

      expect(RecommendationModel.create).toHaveBeenCalled();
    });

    it('should apply mood from journal if not provided explicitly', async () => {
      (ReminderModel.findActiveByUserId as jest.Mock).mockResolvedValue([
        { reminder_id: 1, mantra_id: 1 },
        { reminder_id: 2, mantra_id: 2 },
        { reminder_id: 3, mantra_id: 3 },
        { reminder_id: 4, mantra_id: 4 },
        { reminder_id: 5, mantra_id: 5 },
      ]);
      (RatingModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (LikeModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (JournalModel.findByUserId as jest.Mock).mockResolvedValue([
        { journal_id: 1, mantra_id: null, mood: 'anxious' },
        { journal_id: 2, mantra_id: null, mood: 'anxious' },
        { journal_id: 3, mantra_id: null, mood: 'happy' },
      ]);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue([]);
      (RecommendationModel.create as jest.Mock).mockResolvedValue({});

      (CategoryModel.getCategoriesForMantras as jest.Mock).mockResolvedValue([
        { mantra_id: 1, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 100, name: 'Anxiety' },
        { mantra_id: 3, category_id: 100, name: 'Anxiety' },
        { mantra_id: 4, category_id: 100, name: 'Anxiety' },
        { mantra_id: 5, category_id: 100, name: 'Anxiety' },
      ]);

      const mantras = Array.from({ length: 20 }, (_, i) => mockMantra(i + 1));
      const categoryMap = new Map<number, Array<{ category_id: number; name: string }>>();
      for (let i = 1; i <= 10; i++) {
        categoryMap.set(i, [{ category_id: 100, name: 'Anxiety' }]);
      }
      for (let i = 11; i <= 20; i++) {
        categoryMap.set(i, [{ category_id: 101, name: 'Leadership' }]);
      }

      (MantraModel.findAllWithCategories as jest.Mock).mockResolvedValue({
        mantras,
        categoryMap,
      });

      const result = await RecommendationEngine.generateRecommendations(1);

      // Results should exist (mood 'anxious' from journals should influence scoring)
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('logRecommendations', () => {
    it('should log each recommendation to the model', async () => {
      (RecommendationModel.create as jest.Mock).mockResolvedValue({});

      const recommendations = [
        { mantra: mockMantra(1), score: 0.9, categories: [], reason: 'test' },
        { mantra: mockMantra(2), score: 0.8, categories: [], reason: 'test' },
      ];

      await RecommendationEngine.logRecommendations(1, recommendations);

      expect(RecommendationModel.create).toHaveBeenCalledTimes(2);
      expect(RecommendationModel.create).toHaveBeenCalledWith({
        user_id: 1,
        mantra_id: 1,
        reason: 'test',
      });
      expect(RecommendationModel.create).toHaveBeenCalledWith({
        user_id: 1,
        mantra_id: 2,
        reason: 'test',
      });
    });

    it('should not throw if logging fails', async () => {
      (RecommendationModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const recommendations = [
        { mantra: mockMantra(1), score: 0.9, categories: [], reason: 'test' },
      ];

      await expect(
        RecommendationEngine.logRecommendations(1, recommendations),
      ).resolves.not.toThrow();
    });
  });
});
