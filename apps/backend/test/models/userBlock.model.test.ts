import { UserBlockModel } from '../../src/models/userBlock.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    deleteFrom: jest.fn(),
    fn: {
      countAll: jest.fn(),
    },
  },
}));

describe('UserBlockModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    it('should create a new block if it does not exist', async () => {
      const mockBlock = {
        block_id: 1,
        blocker_id: 1,
        blocked_id: 2,
        created_at: '2026-04-08T00:00:00Z',
      };

      const mockSelectChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
      };

      const mockInsertChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockBlock),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockSelectChain);
      (db.insertInto as jest.Mock).mockReturnValue(mockInsertChain);

      const result = await UserBlockModel.blockUser(1, 2);

      expect(db.selectFrom).toHaveBeenCalledWith('UserBlock');
      expect(db.insertInto).toHaveBeenCalledWith('UserBlock');
      expect(result).toEqual(mockBlock);
    });

    it('should return existing block if it already exists', async () => {
      const mockExistingBlock = {
        block_id: 1,
        blocker_id: 1,
        blocked_id: 2,
        created_at: '2026-04-07T00:00:00Z',
      };

      const mockSelectChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockExistingBlock),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockSelectChain);

      const result = await UserBlockModel.blockUser(1, 2);

      expect(db.insertInto).not.toHaveBeenCalled();
      expect(result).toEqual(mockExistingBlock);
    });
  });

  describe('unblockUser', () => {
    it('should delete a block', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ block_id: 1 }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.unblockUser(1, 2);

      expect(db.deleteFrom).toHaveBeenCalledWith('UserBlock');
      expect(mockChain.where).toHaveBeenCalledWith('blocker_id', '=', 1);
      expect(result).toBeDefined();
    });
  });

  describe('isBlocked', () => {
    it('should return true if user is blocked', async () => {
      const mockCountAll = {
        as: jest.fn().mockReturnValue('countAlias'),
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: 1 }),
      };

      (db.fn.countAll as jest.Mock).mockReturnValue(mockCountAll);
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.isBlocked(1, 2);

      expect(result).toBe(true);
    });

    it('should return false if user is not blocked', async () => {
      const mockCountAll = {
        as: jest.fn().mockReturnValue('countAlias'),
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
      };

      (db.fn.countAll as jest.Mock).mockReturnValue(mockCountAll);
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.isBlocked(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getBlockedUsers', () => {
    it('should return all users blocked by a user', async () => {
      const mockBlocks = [
        { block_id: 1, blocked_id: 2 },
        { block_id: 2, blocked_id: 3 },
      ];

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockBlocks),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.getBlockedUsers(1);

      expect(mockChain.where).toHaveBeenCalledWith('blocker_id', '=', 1);
      expect(result).toEqual(mockBlocks);
    });
  });

  describe('getBlockingUsers', () => {
    it('should return all users blocking a user', async () => {
      const mockBlocks = [{ block_id: 1, blocker_id: 5 }];

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockBlocks),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.getBlockingUsers(2);

      expect(mockChain.where).toHaveBeenCalledWith('blocked_id', '=', 2);
      expect(result).toEqual(mockBlocks);
    });
  });

  describe('findById', () => {
    it('should find a block by ID', async () => {
      const mockBlock = { block_id: 1, blocker_id: 1, blocked_id: 2 };

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockBlock),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.findById(1);

      expect(mockChain.where).toHaveBeenCalledWith('block_id', '=', 1);
      expect(result).toEqual(mockBlock);
    });
  });

  describe('deleteBlock', () => {
    it('should delete a block', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ block_id: 1 }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await UserBlockModel.deleteBlock(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('UserBlock');
      expect(mockChain.where).toHaveBeenCalledWith('block_id', '=', 1);
      expect(result).toBeDefined();
    });
  });
});
