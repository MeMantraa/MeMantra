import {
  categoryService,
  Category,
  CategoryResponse,
  SingleCategoryResponse,
  CategoryMutationResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../services/category.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config');

const mockToken = 'test-token';

const mockCategory: Category = {
  category_id: 1,
  name: 'Breathing',
  description: 'Breathing exercises',
  category_type: 'essential',
  parent_id: null,
  is_active: true,
};

const mockCategories: Category[] = [
  {
    category_id: 1,
    name: 'Breathing',
    description: 'Breathing exercises',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 2,
    name: 'Productivity',
    description: 'Productivity goals',
    category_type: 'goal',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 3,
    name: 'Happiness',
    description: undefined,
    category_type: 'mood',
    parent_id: null,
    is_active: true,
  },
];

describe('categoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should fetch all active categories successfully', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: mockCategories },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getAllCategories(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result.status).toBe('success');
      expect(result.data.categories).toEqual(mockCategories);
      expect(result.data.categories.length).toBe(3);
    });

    it('should return empty categories array when none exist', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: [] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getAllCategories(mockToken);

      expect(result.status).toBe('success');
      expect(result.data.categories).toEqual([]);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(categoryService.getAllCategories(mockToken)).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
    });

    it('should include category type information', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: mockCategories },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getAllCategories(mockToken);

      expect(result.data.categories[0].category_type).toBe('essential');
      expect(result.data.categories[1].category_type).toBe('goal');
      expect(result.data.categories[2].category_type).toBe('mood');
    });
  });

  describe('getCategoryById', () => {
    it('should fetch a category by id successfully', async () => {
      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: mockCategory },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getCategoryById(1, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/categories/1');
      expect(result.status).toBe('success');
      expect(result.data.category).toEqual(mockCategory);
      expect(result.data.category.category_id).toBe(1);
    });

    it('should return error when category not found', async () => {
      const mockResponse = {
        status: 'error',
        message: 'Category not found',
        data: { category: null },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getCategoryById(999, mockToken);

      expect(result.status).toBe('error');
      expect(result.message).toBe('Category not found');
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Server error'));

      await expect(categoryService.getCategoryById(1, mockToken)).rejects.toThrow('Server error');
      expect(apiClient.get).toHaveBeenCalledWith('/categories/1');
    });

    it('should work with different category types', async () => {
      const goalCategory = { ...mockCategory, category_id: 2, category_type: 'goal' as const };
      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: goalCategory },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await categoryService.getCategoryById(2, mockToken);

      expect(result.data.category.category_type).toBe('goal');
    });
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      const payload: CreateCategoryPayload = {
        name: 'Meditation',
        description: 'Meditation techniques',
        category_type: 'essential',
      };

      const createdCategory: Category = {
        category_id: 4,
        name: 'Meditation',
        description: 'Meditation techniques',
        category_type: 'essential',
        parent_id: null,
        is_active: true,
      };

      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: createdCategory },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.createCategory(payload, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/categories', payload);
      expect(result.status).toBe('success');
      expect(result.data.category.name).toBe('Meditation');
      expect(result.data.category.category_id).toBe(4);
    });

    it('should create category without description', async () => {
      const payload: CreateCategoryPayload = {
        name: 'Quick Wins',
        category_type: 'goal',
      };

      const createdCategory: Category = {
        category_id: 5,
        name: 'Quick Wins',
        category_type: 'goal',
        parent_id: null,
        is_active: true,
      };

      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: createdCategory },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.createCategory(payload, mockToken);

      expect(result.data.category.description).toBeUndefined();
      expect(apiClient.post).toHaveBeenCalledWith('/categories', payload);
    });

    it('should handle creation errors', async () => {
      const payload: CreateCategoryPayload = {
        name: 'New Category',
        category_type: 'mood',
      };

      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      await expect(categoryService.createCategory(payload, mockToken)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('should support all category types', async () => {
      const types = ['essential', 'goal', 'mood', 'scenario', 'time', 'theme'] as const;

      for (const type of types) {
        const payload: CreateCategoryPayload = {
          name: `Category ${type}`,
          category_type: type,
        };

        const mockResponse: SingleCategoryResponse = {
          status: 'success',
          data: { category: { ...mockCategory, category_type: type } },
        };

        (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

        const result = await categoryService.createCategory(payload, mockToken);

        expect(result.data.category.category_type).toBe(type);
      }
    });
  });

  describe('updateCategory', () => {
    it('should update a category successfully', async () => {
      const payload: UpdateCategoryPayload = {
        name: 'Updated Breathing',
        description: 'Updated breathing exercises',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        name: 'Updated Breathing',
        description: 'Updated breathing exercises',
      };

      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: updatedCategory },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.updateCategory(1, payload, mockToken);

      expect(apiClient.put).toHaveBeenCalledWith('/categories/1', payload);
      expect(result.status).toBe('success');
      expect(result.data.category.name).toBe('Updated Breathing');
    });

    it('should update only selected fields', async () => {
      const payload: UpdateCategoryPayload = {
        description: 'New description only',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        description: 'New description only',
      };

      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: updatedCategory },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.updateCategory(1, payload, mockToken);

      expect(result.data.category.name).toBe(mockCategory.name); // unchanged
      expect(result.data.category.description).toBe('New description only'); // changed
      expect(apiClient.put).toHaveBeenCalledWith('/categories/1', payload);
    });

    it('should return error when category not found', async () => {
      const payload: UpdateCategoryPayload = {
        name: 'Updated',
      };

      const mockResponse = {
        status: 'error',
        message: 'Category not found',
        data: { category: null },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.updateCategory(999, payload, mockToken);

      expect(result.status).toBe('error');
      expect(result.message).toBe('Category not found');
    });

    it('should handle update errors', async () => {
      const payload: UpdateCategoryPayload = {
        name: 'Test',
      };

      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(categoryService.updateCategory(1, payload, mockToken)).rejects.toThrow(
        'Update failed',
      );
      expect(apiClient.put).toHaveBeenCalledWith('/categories/1', payload);
    });

    it('should allow updating category type', async () => {
      const payload: UpdateCategoryPayload = {
        category_type: 'goal',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        category_type: 'goal',
      };

      const mockResponse: SingleCategoryResponse = {
        status: 'success',
        data: { category: updatedCategory },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.updateCategory(1, payload, mockToken);

      expect(result.data.category.category_type).toBe('goal');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Category deleted',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.deleteCategory(1, mockToken);

      expect(apiClient.delete).toHaveBeenCalledWith('/categories/1');
      expect(result.status).toBe('success');
      expect(result.message).toBe('Category deleted');
    });

    it('should handle delete errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Cannot delete'));

      await expect(categoryService.deleteCategory(1, mockToken)).rejects.toThrow('Cannot delete');
      expect(apiClient.delete).toHaveBeenCalledWith('/categories/1');
    });

    it('should work with any category id', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Category deleted',
      };

      for (const id of [1, 10, 100, 999]) {
        (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

        await categoryService.deleteCategory(id, mockToken);

        expect(apiClient.delete).toHaveBeenCalledWith(`/categories/${id}`);
      }
    });
  });

  describe('getCategoriesForMantra', () => {
    it('should get categories for a mantra successfully', async () => {
      const categories = [mockCategories[0], mockCategories[1]];
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getCategoriesForMantra(1, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/mantras/1/categories');
      expect(result.status).toBe('success');
      expect(result.data.categories.length).toBe(2);
      expect(result.data.categories[0].category_id).toBe(1);
    });

    it('should return empty array when mantra has no categories', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: [] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.getCategoriesForMantra(5, mockToken);

      expect(result.status).toBe('success');
      expect(result.data.categories).toEqual([]);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Mantra not found'));

      await expect(categoryService.getCategoriesForMantra(999, mockToken)).rejects.toThrow(
        'Mantra not found',
      );
      expect(apiClient.get).toHaveBeenCalledWith('/mantras/999/categories');
    });

    it('should work with different mantra ids', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: [mockCategories[0]] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      for (const mantraId of [1, 5, 10, 100]) {
        await categoryService.getCategoriesForMantra(mantraId, mockToken);

        expect(apiClient.get).toHaveBeenCalledWith(`/mantras/${mantraId}/categories`);
      }
    });
  });

  describe('addMantraToCategory', () => {
    it('should add a mantra to a category successfully', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Mantra added to category',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.addMantraToCategory(1, 5, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/categories/1/mantras/5');
      expect(result.status).toBe('success');
      expect(result.message).toBe('Mantra added to category');
    });

    it('should handle add errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(categoryService.addMantraToCategory(1, 999, mockToken)).rejects.toThrow(
        'Not found',
      );
      expect(apiClient.post).toHaveBeenCalledWith('/categories/1/mantras/999');
    });

    it('should allow multiple mantras to be added to the same category', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Mantra added to category',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      for (const mantraId of [1, 2, 3]) {
        const result = await categoryService.addMantraToCategory(1, mantraId, mockToken);

        expect(result.status).toBe('success');
        expect(apiClient.post).toHaveBeenCalledWith(`/categories/1/mantras/${mantraId}`);
      }
    });

    it('should allow the same mantra to be added to multiple categories', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Mantra added to category',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      for (const categoryId of [1, 2, 3]) {
        const result = await categoryService.addMantraToCategory(categoryId, 5, mockToken);

        expect(result.status).toBe('success');
        expect(apiClient.post).toHaveBeenCalledWith(`/categories/${categoryId}/mantras/5`);
      }
    });
  });

  describe('removeMantraFromCategory', () => {
    it('should remove a mantra from a category successfully', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Mantra removed from category',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await categoryService.removeMantraFromCategory(1, 5, mockToken);

      expect(apiClient.delete).toHaveBeenCalledWith('/categories/1/mantras/5');
      expect(result.status).toBe('success');
      expect(result.message).toBe('Mantra removed from category');
    });

    it('should handle remove errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Cannot remove'));

      await expect(categoryService.removeMantraFromCategory(1, 5, mockToken)).rejects.toThrow(
        'Cannot remove',
      );
      expect(apiClient.delete).toHaveBeenCalledWith('/categories/1/mantras/5');
    });

    it('should work with different mantra and category combinations', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Mantra removed from category',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const combinations = [
        { categoryId: 1, mantraId: 5 },
        { categoryId: 2, mantraId: 10 },
        { categoryId: 3, mantraId: 15 },
      ];

      for (const { categoryId, mantraId } of combinations) {
        const result = await categoryService.removeMantraFromCategory(
          categoryId,
          mantraId,
          mockToken,
        );

        expect(result.status).toBe('success');
        expect(apiClient.delete).toHaveBeenCalledWith(
          `/categories/${categoryId}/mantras/${mantraId}`,
        );
      }
    });

    it('should handle removing a mantra that is not in the category', async () => {
      const mockResponse: CategoryMutationResponse = {
        status: 'success',
        message: 'Mantra removed from category',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await categoryService.removeMantraFromCategory(1, 999, mockToken);

      expect(result.status).toBe('success');
    });
  });

  describe('API integration', () => {
    it('should use apiClient with correct base URL structure', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: [] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      await categoryService.getAllCategories(mockToken);

      // Verify that apiClient.get was called with absolute path
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
    });

    it('should handle token parameter in all methods', async () => {
      const mockResponse: CategoryResponse = {
        status: 'success',
        data: { categories: [] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const testToken = 'specific-test-token';

      // Token is passed to methods even though it's not used directly
      // (it's used for authentication in the real API client)
      await categoryService.getAllCategories(testToken);

      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});
