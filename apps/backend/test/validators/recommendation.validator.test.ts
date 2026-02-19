import {
  createRecommendationSchema,
  recommendationIdSchema,
  recommendationQuerySchema,
  recentQuerySchema,
  suggestQuerySchema,
} from '../../src/validators/recommendation.validator';

describe('recommendation.validator', () => {
  describe('createRecommendationSchema', () => {
    it('should validate valid body', () => {
      const result = createRecommendationSchema.safeParse({
        body: { mantra_id: 1, reason: 'test reason' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing mantra_id', () => {
      const result = createRecommendationSchema.safeParse({
        body: { reason: 'test' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive mantra_id', () => {
      const result = createRecommendationSchema.safeParse({
        body: { mantra_id: 0, reason: 'test' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative mantra_id', () => {
      const result = createRecommendationSchema.safeParse({
        body: { mantra_id: -1, reason: 'test' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer mantra_id', () => {
      const result = createRecommendationSchema.safeParse({
        body: { mantra_id: 1.5, reason: 'test' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty reason', () => {
      const result = createRecommendationSchema.safeParse({
        body: { mantra_id: 1, reason: '' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing reason', () => {
      const result = createRecommendationSchema.safeParse({
        body: { mantra_id: 1 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('recommendationIdSchema', () => {
    it('should validate valid id param', () => {
      const result = recommendationIdSchema.safeParse({
        params: { id: '5' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.params.id).toBe(5);
      }
    });

    it('should reject non-numeric id', () => {
      const result = recommendationIdSchema.safeParse({
        params: { id: 'abc' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative id', () => {
      const result = recommendationIdSchema.safeParse({
        params: { id: '-1' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero id', () => {
      const result = recommendationIdSchema.safeParse({
        params: { id: '0' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('recommendationQuerySchema', () => {
    it('should validate valid query params', () => {
      const result = recommendationQuerySchema.safeParse({
        query: { limit: '10', offset: '5' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.limit).toBe(10);
        expect(result.data.query.offset).toBe(5);
      }
    });

    it('should accept empty query', () => {
      const result = recommendationQuerySchema.safeParse({
        query: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject limit < 1', () => {
      const result = recommendationQuerySchema.safeParse({
        query: { limit: '0' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit > 100', () => {
      const result = recommendationQuerySchema.safeParse({
        query: { limit: '101' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = recommendationQuerySchema.safeParse({
        query: { offset: '-1' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('recentQuerySchema', () => {
    it('should validate valid days param', () => {
      const result = recentQuerySchema.safeParse({
        query: { days: '7' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.days).toBe(7);
      }
    });

    it('should accept empty query', () => {
      const result = recentQuerySchema.safeParse({
        query: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject days < 1', () => {
      const result = recentQuerySchema.safeParse({
        query: { days: '0' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject days > 365', () => {
      const result = recentQuerySchema.safeParse({
        query: { days: '366' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('suggestQuerySchema', () => {
    it('should validate valid suggest query', () => {
      const result = suggestQuerySchema.safeParse({
        query: { limit: '10', mood: 'anxious' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.limit).toBe(10);
        expect(result.data.query.mood).toBe('anxious');
      }
    });

    it('should accept empty query', () => {
      const result = suggestQuerySchema.safeParse({
        query: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject limit > 50', () => {
      const result = suggestQuerySchema.safeParse({
        query: { limit: '51' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit < 1', () => {
      const result = suggestQuerySchema.safeParse({
        query: { limit: '0' },
      });
      expect(result.success).toBe(false);
    });

    it('should parse excludeIds from comma-separated string', () => {
      const result = suggestQuerySchema.safeParse({
        query: { excludeIds: '1,2,3' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.excludeIds).toEqual([1, 2, 3]);
      }
    });

    it('should filter out invalid numbers from excludeIds', () => {
      const result = suggestQuerySchema.safeParse({
        query: { excludeIds: '1,abc,3,-5' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.excludeIds).toEqual([1, 3]);
      }
    });

    it('should reject mood longer than 50 chars', () => {
      const result = suggestQuerySchema.safeParse({
        query: { mood: 'a'.repeat(51) },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty mood string', () => {
      const result = suggestQuerySchema.safeParse({
        query: { mood: '' },
      });
      expect(result.success).toBe(false);
    });
  });
});
