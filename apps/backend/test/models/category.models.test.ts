import { CategoryModel } from '../../src/models/category.model';
import { db } from '../../src/db';
import { Category, NewCategory } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    deleteFrom: jest.fn(),
    updateTable: jest.fn(),
  },
}));

describe('CategoryModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategory: NewCategory = {
        name: 'Motivation',
      };

      const mockCategory: Category = {
          category_id: 1,
          name: 'Motivation',
          description: null,
          category_type: null,
          image_url: null,
          is_active: null,
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockCategory),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.create(newCategory);

      expect(db.insertInto).toHaveBeenCalledWith('Category');
      expect(mockChain.values).toHaveBeenCalledWith(newCategory);
      expect(result).toEqual(mockCategory);
    });

    it('should throw error if creation fails', async () => {
      const newCategory: NewCategory = {
        name: 'Motivation',
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      await expect(CategoryModel.create(newCategory)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find category by id', async () => {
      const mockCategory: Category = {
          category_id: 1,
          name: 'Motivation',
          description: null,
          category_type: null,
          image_url: null,
          is_active: null,
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockCategory),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.where).toHaveBeenCalledWith('category_id', '=', 1);
      expect(result).toEqual(mockCategory);
    });

    it('should return undefined if category not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      const mockCategories: Category[] = [
        {
            category_id: 1, name: 'Focus',
            description: null,
            category_type: null,
            image_url: null,
            is_active: null,
        },
        {
            category_id: 2, name: 'Motivation',
            description: null,
            category_type: null,
            image_url: null,
            is_active: null,
        },
        {
            category_id: 3, name: 'Stress',
            description: null,
            category_type: null,
            image_url: null,
            is_active: null,
        },
      ];

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findAll();

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(3);
    });

    it('should return empty array if no categories exist', async () => {
      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByName', () => {
    it('should find category by name', async () => {
      const mockCategory: Category = {
          category_id: 1,
          name: 'Motivation',
          description: null,
          category_type: null,
          image_url: null,
          is_active: null,
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockCategory),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findByName('Motivation');

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.where).toHaveBeenCalledWith('name', '=', 'Motivation');
      expect(result).toEqual(mockCategory);
    });

    it('should return undefined if category name not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findByName('NonExistent');

      expect(result).toBeUndefined();
    });
  });

  describe('addMantraToCategory', () => {
    it('should add a mantra to a category', async () => {
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      await CategoryModel.addMantraToCategory(1, 2);

      expect(db.insertInto).toHaveBeenCalledWith('MantraCategory');
      expect(mockChain.values).toHaveBeenCalledWith({
        mantra_id: 1,
        category_id: 2,
      });
      expect(mockChain.execute).toHaveBeenCalled();
    });
  });

  describe('removeMantraFromCategory', () => {
    it('should remove mantra from category and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.removeMantraFromCategory(1, 2);

      expect(db.deleteFrom).toHaveBeenCalledWith('MantraCategory');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('category_id', '=', 2);
      expect(result).toBe(true);
    });

    it('should return false if no rows deleted', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.removeMantraFromCategory(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getMantrasInCategory', () => {
    it('should get all active mantras in a category', async () => {
      const mockMantras = [
        {
          mantra_id: 1,
          title: 'Test Mantra',
          key_takeaway: 'Test takeaway',
          is_active: true,
        },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.getMantrasInCategory(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.innerJoin).toHaveBeenCalledWith('MantraCategory', 'Mantra.mantra_id', 'MantraCategory.mantra_id');
      expect(mockChain.where).toHaveBeenCalledWith('MantraCategory.category_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('getCategoriesForMantra', () => {
    it('should get all categories for a mantra', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Motivation' },
        { category_id: 2, name: 'Focus' },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.getCategoriesForMantra(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.innerJoin).toHaveBeenCalledWith('MantraCategory', 'Category.category_id', 'MantraCategory.category_id');
      expect(mockChain.where).toHaveBeenCalledWith('MantraCategory.mantra_id', '=', 1);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findAllActive', () => {
    it('should return only active categories ordered by name', async () => {
      const mockCategories: Category[] = [
        {
          category_id: 1,
          name: 'Anxiety',
          description: 'Anxiety related',
          category_type: 'emotion',
          image_url: null,
          is_active: true,
        },
        {
          category_id: 2,
          name: 'Motivation',
          description: null,
          category_type: 'emotion',
          image_url: null,
          is_active: true,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findAllActive();

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(mockChain.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no active categories exist', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findAllActive();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    it('should return active categories filtered by type', async () => {
      const mockCategories: Category[] = [
        {
          category_id: 5,
          name: 'Cognitive Reframing',
          description: 'CBT technique',
          category_type: 'cbt',
          image_url: null,
          is_active: true,
        },
        {
          category_id: 8,
          name: 'Exposure Therapy',
          description: null,
          category_type: 'cbt',
          image_url: null,
          is_active: true,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findByType('cbt');

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.where).toHaveBeenCalledWith('category_type', '=', 'cbt');
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(mockChain.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no categories match type', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findByType('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update category details', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
        category_type: 'context',
      };

      const mockUpdatedCategory: Category = {
        category_id: 1,
        name: 'Updated Name',
        description: 'Updated description',
        category_type: 'context',
        image_url: null,
        is_active: true,
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedCategory),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.update(1, updates);

      expect(db.updateTable).toHaveBeenCalledWith('Category');
      expect(mockChain.set).toHaveBeenCalledWith(updates);
      expect(mockChain.where).toHaveBeenCalledWith('category_id', '=', 1);
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should return undefined if category not found', async () => {
      const updates = { name: 'New Name' };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.update(999, updates);

      expect(result).toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('should soft delete category by setting is_active to false', async () => {
      const mockDeactivatedCategory: Category = {
        category_id: 1,
        name: 'Motivation',
        description: null,
        category_type: 'emotion',
        image_url: null,
        is_active: false,
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockDeactivatedCategory),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.softDelete(1);

      expect(db.updateTable).toHaveBeenCalledWith('Category');
      expect(mockChain.set).toHaveBeenCalledWith({ is_active: false });
      expect(mockChain.where).toHaveBeenCalledWith('category_id', '=', 1);
      expect(result).toEqual(mockDeactivatedCategory);
      expect(result?.is_active).toBe(false);
    });

    it('should return undefined if category not found', async () => {
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.softDelete(999);

      expect(result).toBeUndefined();
    });
  });

  describe('reactivate', () => {
    it('should reactivate category by setting is_active to true', async () => {
      const mockReactivatedCategory: Category = {
        category_id: 1,
        name: 'Motivation',
        description: null,
        category_type: 'emotion',
        image_url: null,
        is_active: true,
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReactivatedCategory),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.reactivate(1);

      expect(db.updateTable).toHaveBeenCalledWith('Category');
      expect(mockChain.set).toHaveBeenCalledWith({ is_active: true });
      expect(mockChain.where).toHaveBeenCalledWith('category_id', '=', 1);
      expect(result).toEqual(mockReactivatedCategory);
      expect(result?.is_active).toBe(true);
    });

    it('should return undefined if category not found', async () => {
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.reactivate(999);

      expect(result).toBeUndefined();
    });
  });
});