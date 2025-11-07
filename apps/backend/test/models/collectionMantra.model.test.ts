import { CollectionMantraModel } from '../../src/models/collectionMantra.model';
import { db } from '../../src/db';
import { CollectionMantra } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('CollectionMantraModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('should add a mantra to a collection with user tracking', async () => {
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      await CollectionMantraModel.add(1, 2, 3);

      expect(db.insertInto).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.values).toHaveBeenCalledWith({
        collection_id: 1,
        mantra_id: 2,
        added_by: 3,
      });
      expect(mockChain.execute).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a mantra from a collection and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.remove(1, 2);

      expect(db.deleteFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 2);
      expect(result).toBe(true);
    });

    it('should return false if no rows deleted', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.remove(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true if mantra is in collection', async () => {
      const mockEntry: CollectionMantra = {
        collection_id: 1,
        mantra_id: 2,
        added_at: '2024-01-01T00:00:00Z',
        added_by: 3,
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockEntry),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.exists(1, 2);

      expect(db.selectFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 2);
      expect(result).toBe(true);
    });

    it('should return false if mantra is not in collection', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.exists(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('findMantrasByCollection', () => {
    it('should return all mantra IDs in a collection', async () => {
      const mockResults = [
        { mantra_id: 1, collection_id: 1 },
        { mantra_id: 2, collection_id: 1 },
        { mantra_id: 3, collection_id: 1 },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.findMantrasByCollection(1);

      expect(db.selectFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(mockChain.select).toHaveBeenCalledWith('mantra_id');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array if no mantras in collection', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.findMantrasByCollection(1);

      expect(result).toEqual([]);
    });
  });

  describe('findCollectionsByMantra', () => {
    it('should return all collection IDs containing a mantra', async () => {
      const mockResults = [
        { collection_id: 1, mantra_id: 5 },
        { collection_id: 3, mantra_id: 5 },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.findCollectionsByMantra(5);

      expect(db.selectFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(mockChain.select).toHaveBeenCalledWith('collection_id');
      expect(result).toEqual([1, 3]);
    });

    it('should return empty array if mantra not in any collection', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.findCollectionsByMantra(999);

      expect(result).toEqual([]);
    });
  });

  describe('countMantras', () => {
    it('should count mantras in a collection', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '5' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.countMantras(1);

      expect(db.selectFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(result).toBe(5);
    });

    it('should return 0 if no mantras in collection', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '0' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.countMantras(1);

      expect(result).toBe(0);
    });
  });

  describe('getDetails', () => {
    it('should get CollectionMantra entry with user and timestamp details', async () => {
      const mockEntry: CollectionMantra = {
        collection_id: 1,
        mantra_id: 2,
        added_at: '2024-01-15T10:30:00Z',
        added_by: 5,
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockEntry),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.getDetails(1, 2);

      expect(db.selectFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 2);
      expect(result).toEqual(mockEntry);
    });

    it('should return undefined if entry not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.getDetails(1, 999);

      expect(result).toBeUndefined();
    });
  });

  describe('getAllByCollection', () => {
    it('should get all entries for a collection ordered by added_at desc', async () => {
      const mockEntries: CollectionMantra[] = [
        {
          collection_id: 1,
          mantra_id: 3,
          added_at: '2024-01-15T12:00:00Z',
          added_by: 2,
        },
        {
          collection_id: 1,
          mantra_id: 1,
          added_at: '2024-01-10T08:00:00Z',
          added_by: 2,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockEntries),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.getAllByCollection(1);

      expect(db.selectFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('added_at', 'desc');
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array if no entries', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.getAllByCollection(1);

      expect(result).toEqual([]);
    });
  });

  describe('removeAllFromCollection', () => {
    it('should remove all mantras from a collection and return count', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(5) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.removeAllFromCollection(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('CollectionMantra');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(result).toBe(5);
    });

    it('should return 0 if no rows deleted', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionMantraModel.removeAllFromCollection(1);

      expect(result).toBe(0);
    });
  });
});

