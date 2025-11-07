import { CollectionModel } from '../../src/models/collection.model';
import { db } from '../../src/db';
import { Collection, CollectionUpdate, Mantra } from '../../src/types/database.types';
import { CollectionMantraModel } from '../../src/models/collectionMantra.model';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

jest.mock('../../src/models/collectionMantra.model', () => ({
  CollectionMantraModel: {
    add: jest.fn(),
    remove: jest.fn(),
    exists: jest.fn(),
    countMantras: jest.fn(),
    removeAllFromCollection: jest.fn(),
  },
}));

describe('CollectionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new collection with description', async () => {
      const mockCollection: Collection = {
        collection_id: 1,
        user_id: 1,
        name: 'My Favorites',
        description: 'My favorite mantras',
        created_at: new Date().toISOString(),
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockCollection),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.create(1, 'My Favorites', 'My favorite mantras');

      expect(db.insertInto).toHaveBeenCalledWith('Collection');
      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          name: 'My Favorites',
          description: 'My favorite mantras',
        })
      );
      expect(result).toEqual(mockCollection);
    });

    it('should create a new collection without description', async () => {
      const mockCollection: Collection = {
        collection_id: 1,
        user_id: 1,
        name: 'My Favorites',
        description: null,
        created_at: new Date().toISOString(),
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockCollection),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.create(1, 'My Favorites');

      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          name: 'My Favorites',
          description: null,
        })
      );
      expect(result).toEqual(mockCollection);
    });
  });

  describe('findByUserId', () => {
    it('should find all collections for a user', async () => {
      const mockCollections: Collection[] = [
        {
          collection_id: 1,
          user_id: 1,
          name: 'Favorites',
          description: 'My favorites',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          collection_id: 2,
          user_id: 1,
          name: 'Work Mantras',
          description: null,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCollections),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.findByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Collection');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(mockCollections);
    });
  });

  describe('findById', () => {
    it('should find collection by id', async () => {
      const mockCollection: Collection = {
        collection_id: 1,
        user_id: 1,
        name: 'My Favorites',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockCollection),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Collection');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(result).toEqual(mockCollection);
    });

    it('should return undefined if collection not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update collection', async () => {
      const updates: CollectionUpdate = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const mockUpdatedCollection: Collection = {
        collection_id: 1,
        user_id: 1,
        name: 'Updated Name',
        description: 'Updated description',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedCollection),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.update(1, updates);

      expect(db.updateTable).toHaveBeenCalledWith('Collection');
      expect(mockChain.set).toHaveBeenCalledWith(updates);
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 1);
      expect(result).toEqual(mockUpdatedCollection);
    });
  });

  describe('delete', () => {
    it('should delete collection and its mantras', async () => {
      (CollectionMantraModel.removeAllFromCollection as jest.Mock).mockResolvedValue(3);

      const deleteCollectionMock = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(deleteCollectionMock);

      const result = await CollectionModel.delete(1);

      expect(CollectionMantraModel.removeAllFromCollection).toHaveBeenCalledWith(1);
      expect(db.deleteFrom).toHaveBeenCalledWith('Collection');
      expect(result).toBe(true);
    });

    it('should return false if collection not found', async () => {
      (CollectionMantraModel.removeAllFromCollection as jest.Mock).mockResolvedValue(0);

      const deleteCollectionMock = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(deleteCollectionMock);

      const result = await CollectionModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('addMantra', () => {
    it('should add mantra to collection with user tracking', async () => {
      (CollectionMantraModel.add as jest.Mock).mockResolvedValue(undefined);

      await CollectionModel.addMantra(1, 2, 3);

      expect(CollectionMantraModel.add).toHaveBeenCalledWith(1, 2, 3);
    });
  });

  describe('removeMantra', () => {
    it('should remove mantra from collection and return true', async () => {
      (CollectionMantraModel.remove as jest.Mock).mockResolvedValue(true);

      const result = await CollectionModel.removeMantra(1, 2);

      expect(CollectionMantraModel.remove).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(true);
    });

    it('should return false if mantra not in collection', async () => {
      (CollectionMantraModel.remove as jest.Mock).mockResolvedValue(false);

      const result = await CollectionModel.removeMantra(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getMantrasInCollection', () => {
    it('should get all active mantras in collection', async () => {
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
        execute: jest.fn().mockResolvedValue(mockMantras),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.getMantrasInCollection(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.where).toHaveBeenCalledWith('CollectionMantra.collection_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('getCollectionWithMantras', () => {
    it('should return collection with its mantras', async () => {
      const mockCollection: Collection = {
        collection_id: 1,
        user_id: 1,
        name: 'My Collection',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
      };

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

      const collectionMock = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockCollection),
      };

      const mantrasMock = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };

      (db.selectFrom as jest.Mock)
        .mockReturnValueOnce(collectionMock)
        .mockReturnValueOnce(mantrasMock);

      const result = await CollectionModel.getCollectionWithMantras(1);

      expect(result).toEqual({
        collection: mockCollection,
        mantras: mockMantras,
      });
    });

    it('should return null if collection not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.getCollectionWithMantras(999);

      expect(result).toBeNull();
    });
  });

  describe('isMantraInCollection', () => {
    it('should return true if mantra is in collection', async () => {
      (CollectionMantraModel.exists as jest.Mock).mockResolvedValue(true);

      const result = await CollectionModel.isMantraInCollection(1, 2);

      expect(CollectionMantraModel.exists).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(true);
    });

    it('should return false if mantra is not in collection', async () => {
      (CollectionMantraModel.exists as jest.Mock).mockResolvedValue(false);

      const result = await CollectionModel.isMantraInCollection(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('countMantrasInCollection', () => {
    it('should return count of mantras in collection', async () => {
      (CollectionMantraModel.countMantras as jest.Mock).mockResolvedValue(5);

      const result = await CollectionModel.countMantrasInCollection(1);

      expect(CollectionMantraModel.countMantras).toHaveBeenCalledWith(1);
      expect(result).toBe(5);
    });

    it('should return 0 if collection is empty', async () => {
      (CollectionMantraModel.countMantras as jest.Mock).mockResolvedValue(0);

      const result = await CollectionModel.countMantrasInCollection(1);

      expect(result).toBe(0);
    });
  });

  describe('getCollectionsContainingMantra', () => {
    it('should get all collections containing a mantra', async () => {
      const mockCollections: Collection[] = [
        {
          collection_id: 1,
          user_id: 1,
          name: 'Collection 1',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCollections),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CollectionModel.getCollectionsContainingMantra(1);

      expect(mockChain.where).toHaveBeenCalledWith('CollectionMantra.mantra_id', '=', 1);
      expect(result).toEqual(mockCollections);
    });

    it('should filter by user id when provided', async () => {
      const mockCollections: Collection[] = [];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCollections),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await CollectionModel.getCollectionsContainingMantra(1, 5);

      expect(mockChain.where).toHaveBeenCalledWith('CollectionMantra.mantra_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Collection.user_id', '=', 5);
    });
  });
});