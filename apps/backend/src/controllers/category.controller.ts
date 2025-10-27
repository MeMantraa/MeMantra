import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator';

export const CategoryController = {
  // Get all categories
  async listCategories(req: Request, res: Response) {
    try {
      const { with_count } = req.query;

      let categories;

      if (with_count === 'true') {
        categories = await CategoryModel.getCategoriesWithCount();
      } else {
        categories = await CategoryModel.findAll();
      }

      return res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      console.error('List categories error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving categories',
      });
    }
  },

  // Get a single category by ID
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

  // Get mantras in a category
  async getCategoryMantras(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const mantras = await CategoryModel.getMantrasInCategory(Number(id));

      return res.status(200).json({
        status: 'success',
        data: { mantras },
      });
    } catch (error) {
      console.error('Get category mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantras for category',
      });
    }
  },

  // Create a new category (admin only - add admin middleware to route)
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

  // Update a category (admin only)
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateCategoryInput;

      const updatedCategory = await CategoryModel.update(Number(id), updates);

      if (!updatedCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }

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

  // Delete a category (admin only)
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const success = await CategoryModel.delete(Number(id));

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }

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
};
