import { UserCategoryScoreModel } from '../../src/models/user-category-score.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('UserCategoryScoreModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addScoreForMantra', () => {
    it('should add score for each category of a mantra', async () => {
      const selectChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([{ category_id: 1 }, { category_id: 2 }]),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const insertChain = {
        values: jest.fn().mockReturnThis(),
        onConflict: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      (db.insertInto as jest.Mock).mockReturnValue(insertChain);

      await UserCategoryScoreModel.addScoreForMantra(1, 5, 3);

      expect(db.selectFrom).toHaveBeenCalledWith('MantraCategory');
      expect(db.insertInto).toHaveBeenCalledTimes(2);
      expect(db.insertInto).toHaveBeenCalledWith('UserCategoryScore');
    });

    it('should do nothing when mantra has no categories', async () => {
      const selectChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(selectChain);

      await UserCategoryScoreModel.addScoreForMantra(1, 5, 3);

      expect(db.insertInto).not.toHaveBeenCalled();
    });
  });

  describe('removeScoreForMantra', () => {
    it('should remove score for mantra categories', async () => {
      const selectChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([{ category_id: 1 }]),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const updateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      (db.updateTable as jest.Mock).mockReturnValue(updateChain);

      await UserCategoryScoreModel.removeScoreForMantra(1, 5, 3);

      expect(db.updateTable).toHaveBeenCalledWith('UserCategoryScore');
    });

    it('should do nothing when mantra has no categories', async () => {
      const selectChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(selectChain);

      await UserCategoryScoreModel.removeScoreForMantra(1, 5, 3);

      expect(db.updateTable).not.toHaveBeenCalled();
    });
  });

  describe('getScoresForUser', () => {
    it('should return scores sorted by score desc', async () => {
      const mockScores = [
        { user_id: 1, category_id: 1, score: 10, updated_at: '2024-01-01' },
        { user_id: 1, category_id: 2, score: 5, updated_at: '2024-01-01' },
      ];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockScores),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.getScoresForUser(1);

      expect(db.selectFrom).toHaveBeenCalledWith('UserCategoryScore');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('score', 'desc');
      expect(result).toEqual(mockScores);
    });
  });

  describe('getScoresForUserWithNames', () => {
    it('should return scores with category names', async () => {
      const mockScores = [
        { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 10 },
      ];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockScores),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.getScoresForUserWithNames(1);

      expect(db.selectFrom).toHaveBeenCalledWith('UserCategoryScore');
      expect(result).toEqual(mockScores);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories with scores > 0', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 10 },
      ];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.getTopCategories(1, 5);

      expect(mockChain.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockCategories);
    });

    it('should use default limit of 10', async () => {
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await UserCategoryScoreModel.getTopCategories(1);

      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getScore', () => {
    it('should return score for specific user/category', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ score: 7 }),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.getScore(1, 2);

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('category_id', '=', 2);
      expect(result).toBe(7);
    });

    it('should return 0 when no score exists', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.getScore(1, 999);
      expect(result).toBe(0);
    });
  });

  describe('setScore', () => {
    it('should set score via upsert', async () => {
      const mockResult = { user_id: 1, category_id: 2, score: 5, updated_at: '2024-01-01' };
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        onConflict: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockResult),
      };
      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.setScore(1, 2, 5);

      expect(db.insertInto).toHaveBeenCalledWith('UserCategoryScore');
      expect(result).toEqual(mockResult);
    });

    it('should clamp negative scores to 0', async () => {
      const mockResult = { user_id: 1, category_id: 2, score: 0, updated_at: '2024-01-01' };
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        onConflict: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockResult),
      };
      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      await UserCategoryScoreModel.setScore(1, 2, -5);

      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ score: 0 }),
      );
    });
  });

  describe('resetAllScores', () => {
    it('should delete all scores for user', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      await UserCategoryScoreModel.resetAllScores(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('UserCategoryScore');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
    });
  });

  describe('resetScore', () => {
    it('should delete specific score and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };
      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.resetScore(1, 2);

      expect(db.deleteFrom).toHaveBeenCalledWith('UserCategoryScore');
      expect(result).toBe(true);
    });

    it('should return false if score not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };
      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserCategoryScoreModel.resetScore(1, 999);
      expect(result).toBe(false);
    });
  });
});
