import { MantraModel } from '../../src/models/mantra.model';
import { db } from '../../src/db';
import { Mantra, NewMantra, MantraUpdate } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
  },
}));

describe('MantraModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new mantra', async () => {
      const newMantra: NewMantra = {
        title: 'Test Mantra',
        key_takeaway: 'Test takeaway',
        background_author: 'Test Author',
        background_description: 'Test description',
        jamie_take: 'Test take',
        when_where: 'Test when/where',
        negative_thoughts: 'Test thoughts',
        cbt_principles: 'Test principles',
        references: 'Test references',
        created_by: 1,
        is_active: true,
      };

      const mockMantra: Mantra = {
  mantra_id: newMantra.mantra_id ?? 0,
  title: newMantra.title ?? null,
  key_takeaway: newMantra.key_takeaway ?? null,
  background_author: newMantra.background_author ?? null,
  background_description: newMantra.background_description ?? null,
  jamie_take: newMantra.jamie_take ?? null,
  when_where: newMantra.when_where ?? null,
  negative_thoughts: newMantra.negative_thoughts ?? null,
  cbt_principles: newMantra.cbt_principles ?? null,
  references: newMantra.references ?? null,
  created_by: newMantra.created_by ?? null,
  is_active: typeof newMantra.is_active === "boolean" ? newMantra.is_active : null,
  created_at: new Date().toISOString(),
};

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockMantra),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.create(newMantra);

      expect(db.insertInto).toHaveBeenCalledWith('Mantra');
      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining(newMantra)
      );
      expect(result).toEqual(mockMantra);
    });
  });

  describe('findById', () => {
    it('should find active mantra by id', async () => {
      const mockMantra: Mantra = {
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
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockMantra),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(result).toEqual(mockMantra);
    });

    it('should return undefined for inactive mantra', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.findById(1);

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should find all active mantras with default pagination', async () => {
      const mockMantras: Mantra[] = [
        {
          mantra_id: 1,
          title: 'Mantra 1',
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
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.findAll();

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(mockChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(mockChain.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockMantras);
    });

    it('should respect custom limit and offset', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await MantraModel.findAll(10, 20);

      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(mockChain.offset).toHaveBeenCalledWith(20);
    });
  });

  describe('findByCategory', () => {
    it('should find active mantras by category', async () => {
      const mockMantras: Mantra[] = [
        {
          mantra_id: 1,
          title: 'Mantra 1',
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

      const result = await MantraModel.findByCategory(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.innerJoin).toHaveBeenCalledWith('MantraCategory', 'Mantra.mantra_id', 'MantraCategory.mantra_id');
      expect(mockChain.where).toHaveBeenCalledWith('MantraCategory.category_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('update', () => {
    it('should update a mantra', async () => {
      const updates: MantraUpdate = {
        title: 'Updated Title',
        key_takeaway: 'Updated takeaway',
      };

      const mockUpdatedMantra: Mantra = {
        mantra_id: 1,
        title: 'Updated Title',
        key_takeaway: 'Updated takeaway',
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
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedMantra),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.update(1, updates);

      expect(db.updateTable).toHaveBeenCalledWith('Mantra');
      expect(mockChain.set).toHaveBeenCalledWith(updates);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 1);
      expect(result).toEqual(mockUpdatedMantra);
    });

    it('should return undefined if mantra not found', async () => {
      const updates: MantraUpdate = {
        title: 'Updated Title',
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.update(999, updates);

      expect(result).toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a mantra and return true', async () => {
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numUpdatedRows: BigInt(1) }),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.softDelete(1);

      expect(db.updateTable).toHaveBeenCalledWith('Mantra');
      expect(mockChain.set).toHaveBeenCalledWith({ is_active: false });
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 1);
      expect(result).toBe(true);
    });

    it('should return false if mantra not found', async () => {
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numUpdatedRows: BigInt(0) }),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.softDelete(999);

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search mantras by title or key takeaway', async () => {
      const mockMantras: Mantra[] = [
        {
          mantra_id: 1,
          title: 'Pressure Is a Privilege',
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
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MantraModel.search('pressure');

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockMantras);
    });

    it('should respect custom limit', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      await MantraModel.search('test', 5);

      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findWithLikeCount', () => {
    it('should find mantras with like counts', async () => {
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
          like_count: '10',
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

      const result = await MantraModel.findWithLikeCount(50);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.leftJoin).toHaveBeenCalledWith('Like', 'Mantra.mantra_id', 'Like.mantra_id');
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(mockChain.groupBy).toHaveBeenCalledWith('Mantra.mantra_id');
      expect(mockChain.orderBy).toHaveBeenCalledWith('like_count', 'desc');
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(result[0].like_count).toBe(10);
    });
  });
});