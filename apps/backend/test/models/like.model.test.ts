import { LikeModel } from '../../src/models/like.model';
import { db } from '../../src/db';
import { Like, Mantra } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('LikeModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new like', async () => {
      const mockLike: Like = {
        like_id: 1,
        user_id: 1,
        mantra_id: 2,
        created_at: new Date().toISOString(),
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockLike),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.create(1, 2);

      expect(db.insertInto).toHaveBeenCalledWith('Like');
      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          mantra_id: 2,
        })
      );
      expect(result).toEqual(mockLike);
    });
  });

  describe('remove', () => {
    it('should remove a like and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.remove(1, 2);

      expect(db.deleteFrom).toHaveBeenCalledWith('Like');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 2);
      expect(result).toBe(true);
    });

    it('should return false if like does not exist', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.remove(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('hasUserLiked', () => {
    it('should return true if user has liked mantra', async () => {
      const mockLike: Like = {
        like_id: 1,
        user_id: 1,
        mantra_id: 2,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockLike),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.hasUserLiked(1, 2);

      expect(result).toBe(true);
    });

    it('should return false if user has not liked mantra', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.hasUserLiked(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('findByUserId', () => {
    it('should find all likes by user', async () => {
      const mockLikes: Like[] = [
        {
          like_id: 1,
          user_id: 1,
          mantra_id: 2,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          like_id: 2,
          user_id: 1,
          mantra_id: 3,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockLikes),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.findByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Like');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(mockLikes);
    });
  });

  describe('findByMantraId', () => {
    it('should find all likes for a mantra', async () => {
      const mockLikes: Like[] = [
        {
          like_id: 1,
          user_id: 1,
          mantra_id: 2,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          like_id: 2,
          user_id: 3,
          mantra_id: 2,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockLikes),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.findByMantraId(2);

      expect(db.selectFrom).toHaveBeenCalledWith('Like');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 2);
      expect(result).toEqual(mockLikes);
    });
  });

  describe('getUserLikedMantras', () => {
    it('should get all mantras liked by user', async () => {
      const mockMantras: Mantra[] = [
        {
          mantra_id: 1,
          title: 'Test Mantra',
          key_takeaway: 'Test',
          background_author: 'Author',
          background_description: 'Description',
          jamie_take: 'Take',
          when_where: 'When',
          negative_thoughts: 'Thoughts',
          cbt_principles: 'Principles',
          references: 'Refs',
          created_by: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.getUserLikedMantras(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.innerJoin).toHaveBeenCalledWith('Like', 'Mantra.mantra_id', 'Like.mantra_id');
      expect(mockChain.where).toHaveBeenCalledWith('Like.user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('countLikesForMantra', () => {
    it('should return count of likes for a mantra', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '10' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.countLikesForMantra(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Like');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 1);
      expect(result).toBe(10);
    });

    it('should return 0 if no likes exist', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '0' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.countLikesForMantra(1);

      expect(result).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find like by id', async () => {
      const mockLike: Like = {
        like_id: 1,
        user_id: 1,
        mantra_id: 2,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockLike),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Like');
      expect(mockChain.where).toHaveBeenCalledWith('like_id', '=', 1);
      expect(result).toEqual(mockLike);
    });

    it('should return undefined if like not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getMostLikedMantras', () => {
    it('should get most liked mantras with like counts', async () => {
      const mockResults = [
        {
          mantra_id: 1,
          title: 'Popular Mantra',
          key_takeaway: 'Test',
          background_author: 'Author',
          background_description: 'Description',
          jamie_take: 'Take',
          when_where: 'When',
          negative_thoughts: 'Thoughts',
          cbt_principles: 'Principles',
          references: 'Refs',
          created_by: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          like_count: '15',
        },
      ];

      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await LikeModel.getMostLikedMantras(10);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.leftJoin).toHaveBeenCalledWith('Like', 'Mantra.mantra_id', 'Like.mantra_id');
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(mockChain.groupBy).toHaveBeenCalledWith('Mantra.mantra_id');
      expect(mockChain.orderBy).toHaveBeenCalledWith('like_count', 'desc');
      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(result[0].like_count).toBe(15);
    });

    it('should use default limit of 10', async () => {
      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await LikeModel.getMostLikedMantras();

      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });
  });
});