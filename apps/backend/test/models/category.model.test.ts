import { CategoryModel } from '../../src/models/category.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('CategoryModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategory = { name: 'Anxiety', description: 'Anxiety relief', category_type: 'essential' };
      const mockResult = { category_id: 1, ...newCategory, parent_id: null, image_url: null, is_active: true };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockResult),
      };
      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.create(newCategory as any);

      expect(db.insertInto).toHaveBeenCalledWith('Category');
      expect(mockChain.values).toHaveBeenCalledWith(newCategory);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findById', () => {
    it('should find category by id', async () => {
      const mockCategory = { category_id: 1, name: 'Anxiety', is_active: true };
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

    it('should return undefined if not found', async () => {
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
    it('should return all categories sorted by name', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Anxiety' },
        { category_id: 2, name: 'Calm' },
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
    });
  });

  describe('findAllActive', () => {
    it('should return only active categories', async () => {
      const mockCategories = [{ category_id: 1, name: 'Anxiety', is_active: true }];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findAllActive();

      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findByType', () => {
    it('should find categories by type', async () => {
      const mockCategories = [{ category_id: 1, name: 'Anxiety', category_type: 'essential' }];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findByType('essential');

      expect(mockChain.where).toHaveBeenCalledWith('category_type', '=', 'essential');
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findByName', () => {
    it('should find category by name', async () => {
      const mockCategory = { category_id: 1, name: 'Anxiety' };
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockCategory),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findByName('Anxiety');

      expect(mockChain.where).toHaveBeenCalledWith('name', '=', 'Anxiety');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('addMantraToCategory', () => {
    it('should link a mantra to a category', async () => {
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      await CategoryModel.addMantraToCategory(1, 2);

      expect(db.insertInto).toHaveBeenCalledWith('MantraCategory');
      expect(mockChain.values).toHaveBeenCalledWith({ mantra_id: 1, category_id: 2 });
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
      expect(result).toBe(true);
    });

    it('should return false if nothing was removed', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };
      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.removeMantraFromCategory(1, 999);
      expect(result).toBe(false);
    });
  });

  describe('getMantrasInCategory', () => {
    it('should return active mantras in category', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Test' }];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockMantras),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.getMantrasInCategory(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Mantra');
      expect(mockChain.where).toHaveBeenCalledWith('MantraCategory.category_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('Mantra.is_active', '=', true);
      expect(result).toEqual(mockMantras);
    });
  });

  describe('getCategoriesForMantra', () => {
    it('should return categories for a mantra', async () => {
      const mockCategories = [{ category_id: 1, name: 'Anxiety' }];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.getCategoriesForMantra(5);

      expect(db.selectFrom).toHaveBeenCalledWith('Category');
      expect(mockChain.where).toHaveBeenCalledWith('MantraCategory.mantra_id', '=', 5);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getCategoriesForMantras', () => {
    it('should return categories for multiple mantras', async () => {
      const mockResults = [
        { mantra_id: 1, category_id: 100, name: 'Anxiety' },
        { mantra_id: 2, category_id: 101, name: 'Calm' },
      ];
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.getCategoriesForMantras([1, 2]);

      expect(db.selectFrom).toHaveBeenCalledWith('MantraCategory');
      expect(result).toEqual(mockResults);
    });

    it('should return empty array for empty input', async () => {
      const result = await CategoryModel.getCategoriesForMantras([]);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const mockResult = { category_id: 1, name: 'Updated', is_active: true };
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockResult),
      };
      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.update(1, { name: 'Updated' });

      expect(db.updateTable).toHaveBeenCalledWith('Category');
      expect(mockChain.set).toHaveBeenCalledWith({ name: 'Updated' });
      expect(result).toEqual(mockResult);
    });

    it('should return undefined if category not found', async () => {
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };
      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.update(999, { name: 'Test' });
      expect(result).toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a category', async () => {
      const mockResult = { category_id: 1, name: 'Anxiety', is_active: false };
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockResult),
      };
      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.softDelete(1);

      expect(mockChain.set).toHaveBeenCalledWith({ is_active: false });
      expect(result).toEqual(mockResult);
    });
  });

  describe('reactivate', () => {
    it('should reactivate a category', async () => {
      const mockResult = { category_id: 1, name: 'Anxiety', is_active: true };
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockResult),
      };
      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.reactivate(1);

      expect(mockChain.set).toHaveBeenCalledWith({ is_active: true });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getChildren', () => {
    it('should get child categories', async () => {
      const mockChildren = [{ category_id: 2, name: 'Sub Category', parent_id: 1 }];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockChildren),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.getChildren(1);

      expect(mockChain.where).toHaveBeenCalledWith('parent_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(result).toEqual(mockChildren);
    });
  });

  describe('findTopLevel', () => {
    it('should find top-level categories with no parent', async () => {
      const mockCategories = [{ category_id: 1, name: 'Top', parent_id: null }];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findTopLevel();

      expect(mockChain.where).toHaveBeenCalledWith('parent_id', 'is', null);
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findTopLevelByType', () => {
    it('should find top-level categories by type', async () => {
      const mockCategories = [{ category_id: 1, name: 'Essential', category_type: 'essential', parent_id: null }];
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await CategoryModel.findTopLevelByType('essential');

      expect(mockChain.where).toHaveBeenCalledWith('category_type', '=', 'essential');
      expect(mockChain.where).toHaveBeenCalledWith('parent_id', 'is', null);
      expect(mockChain.where).toHaveBeenCalledWith('is_active', '=', true);
      expect(result).toEqual(mockCategories);
    });
  });
});
