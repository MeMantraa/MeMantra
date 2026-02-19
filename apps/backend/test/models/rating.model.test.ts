import { RatingModel } from '../../src/models/rating.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('RatingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should create a new rating when none exists', async () => {
      const selectChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const mockRating = {
        rating_id: 1,
        user_id: 1,
        mantra_id: 5,
        rating: 4,
        review_text: 'Great mantra',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const insertChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockRating),
      };
      (db.insertInto as jest.Mock).mockReturnValue(insertChain);

      const result = await RatingModel.upsert(1, 5, 4, 'Great mantra');

      expect(db.insertInto).toHaveBeenCalledWith('Rating');
      expect(result).toEqual(mockRating);
    });

    it('should update existing rating', async () => {
      const existingRating = { rating_id: 10, user_id: 1, mantra_id: 5, rating: 3 };
      const selectChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(existingRating),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const updatedRating = { ...existingRating, rating: 5 };
      const updateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(updatedRating),
      };
      (db.updateTable as jest.Mock).mockReturnValue(updateChain);

      const result = await RatingModel.upsert(1, 5, 5);

      expect(db.updateTable).toHaveBeenCalledWith('Rating');
      expect(updateChain.where).toHaveBeenCalledWith('rating_id', '=', 10);
      expect(result).toEqual(updatedRating);
    });
  });

  describe('findByUserAndMantra', () => {
    it('should find rating by user and mantra', async () => {
      const mockRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 };
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockRating),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.findByUserAndMantra(1, 5);

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(result).toEqual(mockRating);
    });

    it('should return undefined if not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.findByUserAndMantra(1, 999);
      expect(result).toBeUndefined();
    });
  });

  describe('findByUserId', () => {
    it('should find all ratings for a user', async () => {
      const mockRatings = [
        { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 },
        { rating_id: 2, user_id: 1, mantra_id: 6, rating: 5 },
      ];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRatings),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.findByUserId(1);

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(mockRatings);
    });
  });

  describe('findByMantraId', () => {
    it('should find all ratings for a mantra', async () => {
      const mockRatings = [{ rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 }];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRatings),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.findByMantraId(5);

      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(result).toEqual(mockRatings);
    });
  });

  describe('getAverageRating', () => {
    it('should return average and count', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ average: 4.2, count: 10 }),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.getAverageRating(5);

      expect(result).toEqual({ average: 4.2, count: 10 });
    });

    it('should return zeros when no ratings', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.getAverageRating(999);

      expect(result).toEqual({ average: 0, count: 0 });
    });
  });

  describe('getTopRatedMantras', () => {
    it('should return top rated mantras', async () => {
      const mockResults = [
        { mantra_id: 1, title: 'Top Mantra', avg_rating: 4.8, rating_count: '15' },
      ];
      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.getTopRatedMantras(10);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(result[0].rating_count).toBe(15);
    });

    it('should use default limit of 10', async () => {
      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await RatingModel.getTopRatedMantras();

      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getUserHighlyRatedMantras', () => {
    it('should return mantras rated >= 4 by user', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Great Mantra' }];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.getUserHighlyRatedMantras(1);

      expect(mockChain.where).toHaveBeenCalledWith('Rating.user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Rating.rating', '>=', 4);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('delete', () => {
    it('should delete a rating and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };
      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.delete(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('Rating');
      expect(result).toBe(true);
    });

    it('should return false if not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };
      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.delete(999);
      expect(result).toBe(false);
    });
  });

  describe('getRatingDistribution', () => {
    it('should return rating distribution', async () => {
      const mockResults = [
        { rating: 5, count: '10' },
        { rating: 4, count: '5' },
        { rating: 3, count: '3' },
      ];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.getRatingDistribution(5);

      expect(result).toEqual({ 5: 10, 4: 5, 3: 3 });
    });
  });

  describe('getUserMantrasByRating', () => {
    it('should return mantras with specific rating', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Five Star' }];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.getUserMantrasByRating(1, 5);

      expect(mockChain.where).toHaveBeenCalledWith('Rating.user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Rating.rating', '=', 5);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('updateRating', () => {
    it('should update a rating', async () => {
      const mockResult = { rating_id: 1, rating: 5, updated_at: '2024-01-01' };
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockResult),
      };
      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.updateRating(1, 5);

      expect(db.updateTable).toHaveBeenCalledWith('Rating');
      expect(mockChain.where).toHaveBeenCalledWith('rating_id', '=', 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('countByUserId', () => {
    it('should count ratings for a user', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '7' }),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.countByUserId(1);

      expect(result).toBe(7);
    });

    it('should return 0 when no ratings', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RatingModel.countByUserId(999);

      expect(result).toBe(0);
    });
  });
});
