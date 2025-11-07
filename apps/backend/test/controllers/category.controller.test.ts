import request from 'supertest';
import express from 'express';
import { CategoryController } from '../../src/controllers/category.controller';
import { CategoryModel } from '../../src/models/category.model';

jest.mock('../../src/models/category.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });
  app.get('/categories', CategoryController.getAllCategories);
  app.get('/categories/type/:type', CategoryController.getCategoriesByType);
  app.get('/categories/:id', CategoryController.getCategoryById);
  app.get('/categories/:id/mantras', CategoryController.getMantrasInCategory);
  app.post('/categories', CategoryController.createCategory);
  app.put('/categories/:id', CategoryController.updateCategory);
  app.delete('/categories/:id', CategoryController.deleteCategory);
  app.post('/categories/:id/mantras/:mantraId', CategoryController.addMantraToCategory);
  app.delete('/categories/:id/mantras/:mantraId', CategoryController.removeMantraFromCategory);
  return app;
}

describe('CategoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should get all categories', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Anxiety', category_type: 'emotion' },
        { category_id: 2, name: 'CBT', category_type: 'cbt' },
      ];
      (CategoryModel.findAll as jest.Mock).mockResolvedValue(mockCategories);

      const app = setupAppWithUser();
      const res = await request(app).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { categories: mockCategories },
      });
    });

    it('should handle errors', async () => {
      (CategoryModel.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/categories');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving categories',
      });
    });
  });

  describe('getCategoryById', () => {
    it('should get category by id', async () => {
      const mockCategory = { category_id: 1, name: 'Anxiety' };
      (CategoryModel.findById as jest.Mock).mockResolvedValue(mockCategory);

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { category: mockCategory },
      });
      expect(CategoryModel.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if category not found', async () => {
      (CategoryModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Category not found',
      });
    });

    it('should handle errors', async () => {
      (CategoryModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving category',
      });
    });
  });

  describe('getCategoriesByType', () => {
    it('should get categories by type', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Anxiety', category_type: 'emotion' },
      ];
      (CategoryModel.findByType as jest.Mock).mockResolvedValue(mockCategories);

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/type/emotion');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { categories: mockCategories },
      });
      expect(CategoryModel.findByType).toHaveBeenCalledWith('emotion');
    });

    it('should handle errors', async () => {
      (CategoryModel.findByType as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/type/emotion');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving categories by type',
      });
    });
  });

  describe('createCategory', () => {
    it('should create category when authenticated', async () => {
      const newCategory = { name: 'New Category', category_type: 'emotion' };
      const createdCategory = { category_id: 1, ...newCategory };
      (CategoryModel.create as jest.Mock).mockResolvedValue(createdCategory);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/categories')
        .send(newCategory);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Category created successfully',
        data: { category: createdCategory },
      });
    });

    it('should handle errors', async () => {
      (CategoryModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/categories')
        .send({ name: 'Test', category_type: 'emotion' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error creating category',
      });
    });
  });

  describe('updateCategory', () => {
    it('should update category', async () => {
      const existingCategory = { category_id: 1, name: 'Old Name' };
      const updatedCategory = { category_id: 1, name: 'New Name' };
      (CategoryModel.findById as jest.Mock).mockResolvedValue(existingCategory);
      (CategoryModel.update as jest.Mock).mockResolvedValue(updatedCategory);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/categories/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Category updated successfully',
        data: { category: updatedCategory },
      });
    });

    it('should return 404 if category not found', async () => {
      (CategoryModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/categories/999')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Category not found',
      });
    });

    it('should handle errors', async () => {
      (CategoryModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/categories/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error updating category',
      });
    });
  });

  describe('deleteCategory', () => {
    it('should soft delete category', async () => {
      const existingCategory = { category_id: 1, name: 'Test' };
      (CategoryModel.findById as jest.Mock).mockResolvedValue(existingCategory);
      (CategoryModel.softDelete as jest.Mock).mockResolvedValue(existingCategory);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/categories/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Category deleted successfully',
      });
      expect(CategoryModel.softDelete).toHaveBeenCalledWith(1);
    });

    it('should return 404 if category not found', async () => {
      (CategoryModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/categories/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Category not found',
      });
    });

    it('should handle errors', async () => {
      (CategoryModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/categories/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting category',
      });
    });
  });

  describe('addMantraToCategory', () => {
    it('should add mantra to category', async () => {
      (CategoryModel.addMantraToCategory as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/categories/1/mantras/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra added to category successfully',
      });
      expect(CategoryModel.addMantraToCategory).toHaveBeenCalledWith(5, 1);
    });

    it('should handle errors', async () => {
      (CategoryModel.addMantraToCategory as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/categories/1/mantras/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error adding mantra to category',
      });
    });
  });

  describe('removeMantraFromCategory', () => {
    it('should remove mantra from category', async () => {
      (CategoryModel.removeMantraFromCategory as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/categories/1/mantras/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra removed from category successfully',
      });
      expect(CategoryModel.removeMantraFromCategory).toHaveBeenCalledWith(5, 1);
    });

    it('should handle errors', async () => {
      (CategoryModel.removeMantraFromCategory as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/categories/1/mantras/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error removing mantra from category',
      });
    });
  });

  describe('getMantrasInCategory', () => {
    it('should get all mantras in a category', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Mantra 1' },
        { mantra_id: 2, title: 'Mantra 2' },
      ];
      (CategoryModel.getMantrasInCategory as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/1/mantras');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { mantras: mockMantras },
      });
      expect(CategoryModel.getMantrasInCategory).toHaveBeenCalledWith(1);
    });

    it('should handle errors', async () => {
      (CategoryModel.getMantrasInCategory as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/categories/1/mantras');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving mantras in category',
      });
    });
  });
});
