import { RatingModel } from '../../src/models/rating.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    selectFrom: jest.fn(),
    insertInto: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('RatingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockChain = () => ({
    where: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
    execute: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  });

  describe('upsert', () => {
    it('should create new rating if not exists', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(undefined);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const insertChain = mockChain();
      const newRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4, review_text: 'Great!' };
      insertChain.executeTakeFirstOrThrow.mockResolvedValue(newRating);
      (db.insertInto as jest.Mock).mockReturnValue(insertChain);

      const result = await RatingModel.upsert(1, 5, 4, 'Great!');

      expect(result).toEqual(newRating);
      expect(db.insertInto).toHaveBeenCalledWith('Rating');
    });

    it('should create new rating without review text', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(undefined);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const insertChain = mockChain();
      const newRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4, review_text: null };
      insertChain.executeTakeFirstOrThrow.mockResolvedValue(newRating);
      (db.insertInto as jest.Mock).mockReturnValue(insertChain);

      const result = await RatingModel.upsert(1, 5, 4);

      expect(result).toEqual(newRating);
      expect(db.insertInto).toHaveBeenCalledWith('Rating');
    });

    it('should update existing rating', async () => {
      const existingRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 3 };
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(existingRating);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const updateChain = mockChain();
      const updatedRating = { ...existingRating, rating: 5, review_text: 'Updated!' };
      updateChain.executeTakeFirstOrThrow.mockResolvedValue(updatedRating);
      (db.updateTable as jest.Mock).mockReturnValue(updateChain);

      const result = await RatingModel.upsert(1, 5, 5, 'Updated!');

      expect(result).toEqual(updatedRating);
      expect(db.updateTable).toHaveBeenCalledWith('Rating');
    });

    it('should update existing rating without review text', async () => {
      const existingRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 3 };
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(existingRating);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const updateChain = mockChain();
      const updatedRating = { ...existingRating, rating: 5, review_text: null };
      updateChain.executeTakeFirstOrThrow.mockResolvedValue(updatedRating);
      (db.updateTable as jest.Mock).mockReturnValue(updateChain);

      const result = await RatingModel.upsert(1, 5, 5);

      expect(result).toEqual(updatedRating);
      expect(db.updateTable).toHaveBeenCalledWith('Rating');
    });
  });

  describe('findByUserAndMantra', () => {
    it('should find rating by user and mantra', async () => {
      const mockRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 };
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(mockRating);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.findByUserAndMantra(1, 5);

      expect(result).toEqual(mockRating);
      expect(db.selectFrom).toHaveBeenCalledWith('Rating');
    });
  });

  describe('findByUserId', () => {
    it('should find all ratings by user', async () => {
      const mockRatings = [
        { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 },
        { rating_id: 2, user_id: 1, mantra_id: 6, rating: 5 },
      ];
      const chain = mockChain();
      chain.execute.mockResolvedValue(mockRatings);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.findByUserId(1);

      expect(result).toEqual(mockRatings);
      expect(chain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });
  });

  describe('findByMantraId', () => {
    it('should find all ratings for a mantra', async () => {
      const mockRatings = [
        { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 },
        { rating_id: 2, user_id: 2, mantra_id: 5, rating: 5 },
      ];
      const chain = mockChain();
      chain.execute.mockResolvedValue(mockRatings);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.findByMantraId(5);

      expect(result).toEqual(mockRatings);
      expect(chain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
    });
  });

  describe('getAverageRating', () => {
    it('should calculate average rating', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ average: '4.5', count: '10' });
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getAverageRating(5);

      expect(result).toEqual({ average: 4.5, count: 10 });
    });

    it('should return zeros if no ratings', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(undefined);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getAverageRating(5);

      expect(result).toEqual({ average: 0, count: 0 });
    });

    it('should handle null average', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ average: null, count: '0' });
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getAverageRating(5);

      expect(result).toEqual({ average: 0, count: 0 });
    });

    it('should handle null count', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ average: '4.5', count: null });
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getAverageRating(5);

      expect(result).toEqual({ average: 4.5, count: 0 });
    });
  });

  describe('getTopRatedMantras', () => {
    it('should get top rated mantras with default limit', async () => {
      const mockResults = [
        { mantra_id: 1, title: 'Top Mantra', avg_rating: '4.8', rating_count: '10' },
      ];
      const chain = mockChain();
      chain.execute.mockResolvedValue(mockResults);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getTopRatedMantras();

      expect(result).toEqual([
        { ...mockResults[0], avg_rating: '4.8', rating_count: 10 },
      ]);
      expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it('should get top rated mantras with custom limit', async () => {
      const chain = mockChain();
      chain.execute.mockResolvedValue([]);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      await RatingModel.getTopRatedMantras(5);

      expect(chain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('getUserHighlyRatedMantras', () => {
    it('should get user highly rated mantras', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Great Mantra' },
        { mantra_id: 2, title: 'Amazing Mantra' },
      ];
      const chain = mockChain();
      chain.execute.mockResolvedValue(mockMantras);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getUserHighlyRatedMantras(1);

      expect(result).toEqual(mockMantras);
      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
    });
  });

  describe('delete', () => {
    it('should delete rating and return true', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ numDeletedRows: BigInt(1) });
      (db.deleteFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.delete(1);

      expect(result).toBe(true);
      expect(db.deleteFrom).toHaveBeenCalledWith('Rating');
    });

    it('should return false if nothing deleted', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ numDeletedRows: BigInt(0) });
      (db.deleteFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('getRatingDistribution', () => {
    it('should get rating distribution', async () => {
      const mockResults = [
        { rating: 5, count: '50' },
        { rating: 4, count: '30' },
        { rating: 3, count: '15' },
      ];
      const chain = mockChain();
      chain.execute.mockResolvedValue(mockResults);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getRatingDistribution(5);

      expect(result).toEqual({ 5: 50, 4: 30, 3: 15 });
    });

    it('should return empty object if no ratings', async () => {
      const chain = mockChain();
      chain.execute.mockResolvedValue([]);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getRatingDistribution(5);

      expect(result).toEqual({});
    });
  });

  describe('getUserMantrasByRating', () => {
    it('should get user mantras by specific rating', async () => {
      const mockMantras = [
        { mantra_id: 1, title: '5 Star Mantra' },
        { mantra_id: 2, title: 'Another 5 Star' },
      ];
      const chain = mockChain();
      chain.execute.mockResolvedValue(mockMantras);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.getUserMantrasByRating(1, 5);

      expect(result).toEqual(mockMantras);
      expect(chain.orderBy).toHaveBeenCalledWith('Rating.created_at', 'desc');
    });
  });

  describe('updateRating', () => {
    it('should update rating value', async () => {
      const updatedRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 5 };
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(updatedRating);
      (db.updateTable as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.updateRating(1, 5);

      expect(result).toEqual(updatedRating);
      expect(db.updateTable).toHaveBeenCalledWith('Rating');
    });
  });

  describe('countByUserId', () => {
    it('should count ratings by user', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ count: '25' });
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.countByUserId(1);

      expect(result).toBe(25);
    });

    it('should return 0 if no ratings', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue(undefined);
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.countByUserId(1);

      expect(result).toBe(0);
    });

    it('should handle null count', async () => {
      const chain = mockChain();
      chain.executeTakeFirst.mockResolvedValue({ count: null });
      (db.selectFrom as jest.Mock).mockReturnValue(chain);

      const result = await RatingModel.countByUserId(1);

      expect(result).toBe(0);
    });
  });
});