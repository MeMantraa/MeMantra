import { RecommendationModel } from '../../src/models/recommendation.model';
import { db } from '../../src/db';
import { RecommendationLog, NewRecommendationLog } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('RecommendationModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new recommendation', async () => {
      const newRecommendation: NewRecommendationLog = {
        user_id: 1,
        mantra_id: 5,
        reason: 'User expressed anxiety, recommended calming mantra',
      };

      const mockRecommendation: RecommendationLog = {
        rec_id: 1,
        user_id: newRecommendation.user_id ?? null,
        mantra_id: newRecommendation.mantra_id ?? null,
        reason: newRecommendation.reason ?? null,
        timestamp: new Date().toISOString(),
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockRecommendation),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.create(newRecommendation);

      expect(db.insertInto).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          mantra_id: 5,
          reason: 'User expressed anxiety, recommended calming mantra',
        })
      );
      expect(result).toEqual(mockRecommendation);
    });
  });

  describe('findById', () => {
    it('should find recommendation by id', async () => {
      const mockRecommendation: RecommendationLog = {
        rec_id: 1,
        user_id: 1,
        mantra_id: 5,
        reason: 'Test reason',
        timestamp: new Date().toISOString(),
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockRecommendation),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('rec_id', '=', 1);
      expect(result).toEqual(mockRecommendation);
    });

    it('should return undefined if recommendation not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByUserId', () => {
    it('should find recommendations by user id with default pagination', async () => {
      const mockRecommendations = [
        { rec_id: 1, user_id: 1, mantra_id: 5, reason: 'Reason 1', timestamp: new Date().toISOString() },
        { rec_id: 2, user_id: 1, mantra_id: 6, reason: 'Reason 2', timestamp: new Date().toISOString() },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRecommendations),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(mockChain.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockRecommendations);
    });

    it('should find recommendations with custom pagination', async () => {
      const mockRecommendations = [{ rec_id: 1, user_id: 1 }];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRecommendations),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await RecommendationModel.findByUserId(1, 10, 5);

      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(mockChain.offset).toHaveBeenCalledWith(5);
    });
  });

  describe('findByMantraId', () => {
    it('should find recommendations by mantra id', async () => {
      const mockRecommendations = [
        { rec_id: 1, user_id: 1, mantra_id: 5, reason: 'Reason', timestamp: new Date().toISOString() },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRecommendations),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findByMantraId(5);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(mockChain.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('findByUserAndMantra', () => {
    it('should find recommendations by user and mantra', async () => {
      const mockRecommendations = [
        { rec_id: 1, user_id: 1, mantra_id: 5, reason: 'Reason', timestamp: new Date().toISOString() },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRecommendations),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findByUserAndMantra(1, 5);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('findByUserIdWithMantras', () => {
    it('should find recommendations with mantra details', async () => {
      const mockRecommendations = [
        {
          rec_id: 1,
          user_id: 1,
          mantra_id: 5,
          reason: 'Reason',
          timestamp: new Date().toISOString(),
          mantra_title: 'Calming Mantra',
        },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRecommendations),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findByUserIdWithMantras(1, 20);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.innerJoin).toHaveBeenCalled();
      expect(mockChain.where).toHaveBeenCalledWith('RecommendationLog.user_id', '=', 1);
      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('findRecent', () => {
    it('should find recent recommendations within specified days', async () => {
      const mockRecommendations = [
        { rec_id: 1, user_id: 1, mantra_id: 5, timestamp: new Date().toISOString() },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockRecommendations),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.findRecent(1, 7);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('timestamp', '>=', expect.any(String));
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('countByUserId', () => {
    it('should count recommendations by user id', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '145' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.countByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(145);
    });

    it('should return 0 if count is undefined', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.countByUserId(1);

      expect(result).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete recommendation by id', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.delete(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('rec_id', '=', 1);
      expect(result).toBe(true);
    });

    it('should return false if nothing deleted', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all recommendations by user id', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(5) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.deleteByUserId(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('RecommendationLog');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(5);
    });

    it('should return 0 if no recommendations deleted', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await RecommendationModel.deleteByUserId(999);

      expect(result).toBe(0);
    });
  });
});
