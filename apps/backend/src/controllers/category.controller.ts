import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator';

export const CategoryController = {
  // GET /api/categories - List all categories
  async getAllCategories(_req: Request, res: Response) {
    try {
      const categories = await CategoryModel.findAll();

      return res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      console.error('Get all categories error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving categories',
      });
    }
  },

  // GET /api/categories/:id - Get single category
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await CategoryModel.findById(Number(id));

      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      console.error('Get category by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving category',
      });
    }
  },

  // GET /api/categories/type/:type - Get categories by type
  async getCategoriesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      const categories = await CategoryModel.findByType(
        type as 'emotion' | 'cbt' | 'context' | 'reference'
      );

      return res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      console.error('Get categories by type error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving categories by type',
      });
    }
  },

  // POST /api/categories - Create new category (admin only)
  async createCategory(req: Request, res: Response) {
    try {
      const categoryData = req.body as CreateCategoryInput;

      const newCategory = await CategoryModel.create(categoryData);

      return res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: { category: newCategory },
      });
    } catch (error) {
      console.error('Create category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating category',
      });
    }
  },

  // PUT /api/categories/:id - Update category
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateCategoryInput;

      const existingCategory = await CategoryModel.findById(Number(id));

      if (!existingCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }

      const updatedCategory = await CategoryModel.update(Number(id), updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: { category: updatedCategory },
      });
    } catch (error) {
      console.error('Update category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating category',
      });
    }
  },

  // DELETE /api/categories/:id - Soft delete category
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingCategory = await CategoryModel.findById(Number(id));

      if (!existingCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }

      await CategoryModel.softDelete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting category',
      });
    }
  },

  // POST /api/categories/:id/mantras/:mantraId - Add mantra to category
  async addMantraToCategory(req: Request, res: Response) {
    try {
      const { id, mantraId } = req.params;

      await CategoryModel.addMantraToCategory(Number(mantraId), Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Mantra added to category successfully',
      });
    } catch (error) {
      console.error('Add mantra to category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error adding mantra to category',
      });
    }
  },

  // DELETE /api/categories/:id/mantras/:mantraId - Remove mantra from category
  async removeMantraFromCategory(req: Request, res: Response) {
    try {
      const { id, mantraId } = req.params;

      await CategoryModel.removeMantraFromCategory(Number(mantraId), Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Mantra removed from category successfully',
      });
    } catch (error) {
      console.error('Remove mantra from category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error removing mantra from category',
      });
    }
  },

  // GET /api/categories/:id/mantras - Get all mantras in a category
  async getMantrasInCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const mantras = await CategoryModel.getMantrasInCategory(Number(id));

      return res.status(200).json({
        status: 'success',
        data: { mantras },
      });
    } catch (error) {
      console.error('Get mantras in category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantras in category',
      });
    }
  },
};
