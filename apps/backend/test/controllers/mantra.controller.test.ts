import request from 'supertest';
import express from 'express';
import { MantraController } from '../../src/controllers/mantra.controller';
import { MantraModel } from '../../src/models/mantra.model';
import { CollectionModel } from '../../src/models/collection.model';

jest.mock('../../src/models/mantra.model');
jest.mock('../../src/models/collection.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });

  app.get('/mantras/popular', MantraController.getPopularMantras);
  app.get('/mantras/category/:categoryId', MantraController.getMantrasByCategory);
  app.get('/mantras/saved', MantraController.getSavedMantras);
  app.get('/mantras', MantraController.getAllMantras);
  app.get('/mantras/:id', MantraController.getMantraById);
  app.post('/mantras', MantraController.createMantra);
  app.put('/mantras/:id', MantraController.updateMantra);
  app.delete('/mantras/:id', MantraController.deleteMantra);
  app.post('/mantras/:mantraId/save', MantraController.saveMantra);
  app.delete('/mantras/:mantraId/save', MantraController.unsaveMantra);
  return app;
}

describe('MantraController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error mock if it was set
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllMantras', () => {
    it('should get all mantras with default pagination', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Mantra 1', key_takeaway: 'Takeaway 1' },
        { mantra_id: 2, title: 'Mantra 2', key_takeaway: 'Takeaway 2' },
      ];
      (MantraModel.findAll as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          mantras: mockMantras,
          pagination: {
            limit: 20,
            offset: 0,
            count: 2,
          },
        },
      });
      expect(MantraModel.findAll).toHaveBeenCalledWith(20, 0);
    });

    it('should get mantras with custom pagination', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Mantra 1' }];
      (MantraModel.findAll as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras?limit=10&offset=5');

      expect(res.status).toBe(200);
      expect(MantraModel.findAll).toHaveBeenCalledWith(10, 5);
    });

    it('should search mantras when search query provided', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Confidence Mantra' }];
      (MantraModel.search as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras?search=confidence');

      expect(res.status).toBe(200);
      expect(MantraModel.search).toHaveBeenCalledWith('confidence', 20);
    });

    it('should handle errors', async () => {
      (MantraModel.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving mantras',
      });
    });
  });

  describe('getMantraById', () => {
    it('should get mantra by id', async () => {
      const mockMantra = { mantra_id: 1, title: 'Test Mantra' };
      (MantraModel.findById as jest.Mock).mockResolvedValue(mockMantra);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { mantra: mockMantra },
      });
      expect(MantraModel.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if mantra not found', async () => {
      (MantraModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Mantra not found',
      });
    });

    it('should handle errors', async () => {
      (MantraModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving mantra',
      });
    });
  });

  describe('createMantra', () => {
    it('should create mantra when authenticated', async () => {
      const newMantra = { title: 'New Mantra', key_takeaway: 'Takeaway' };
      const createdMantra = { mantra_id: 1, ...newMantra };
      (MantraModel.create as jest.Mock).mockResolvedValue(createdMantra);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/mantras')
        .send(newMantra);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra created successfully',
        data: { mantra: createdMantra },
      });
      expect(MantraModel.create).toHaveBeenCalledWith({
        ...newMantra,
        created_by: 1,
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app)
        .post('/mantras')
        .send({ title: 'Test', key_takeaway: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (MantraModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/mantras')
        .send({ title: 'Test', key_takeaway: 'Test' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error creating mantra',
      });
    });
  });

  describe('updateMantra', () => {
    it('should update mantra', async () => {
      const existingMantra = { mantra_id: 1, title: 'Old Title' };
      const updatedMantra = { mantra_id: 1, title: 'New Title' };
      (MantraModel.findById as jest.Mock).mockResolvedValue(existingMantra);
      (MantraModel.update as jest.Mock).mockResolvedValue(updatedMantra);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/mantras/1')
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra updated successfully',
        data: { mantra: updatedMantra },
      });
    });

    it('should return 404 if mantra not found', async () => {
      (MantraModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/mantras/999')
        .send({ title: 'New Title' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Mantra not found',
      });
    });

    it('should handle errors', async () => {
      (MantraModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/mantras/1')
        .send({ title: 'New Title' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error updating mantra',
      });
    });
  });

  describe('deleteMantra', () => {
    it('should soft delete mantra', async () => {
      const existingMantra = { mantra_id: 1, title: 'Test' };
      (MantraModel.findById as jest.Mock).mockResolvedValue(existingMantra);
      (MantraModel.softDelete as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra deleted successfully',
      });
      expect(MantraModel.softDelete).toHaveBeenCalledWith(1);
    });

    it('should return 404 if mantra not found', async () => {
      (MantraModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Mantra not found',
      });
    });

    it('should handle errors', async () => {
      (MantraModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting mantra',
      });
    });
  });

  describe('getMantrasByCategory', () => {
    it('should get mantras by category', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Mantra 1' },
        { mantra_id: 2, title: 'Mantra 2' },
      ];
      (MantraModel.findByCategory as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/category/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          mantras: mockMantras,
          count: 2,
        },
      });
      expect(MantraModel.findByCategory).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      (MantraModel.findByCategory as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/category/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving mantras by category',
      });
    });
  });

  describe('getPopularMantras', () => {
    it('should get popular mantras with default limit', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Popular 1', like_count: 100 },
        { mantra_id: 2, title: 'Popular 2', like_count: 80 },
      ];
      (MantraModel.findWithLikeCount as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/popular');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { mantras: mockMantras },
      });
      expect(MantraModel.findWithLikeCount).toHaveBeenCalledWith(10);
    });

    it('should get popular mantras with custom limit', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Popular', like_count: 100 }];
      (MantraModel.findWithLikeCount as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/popular?limit=5');

      expect(res.status).toBe(200);
      expect(MantraModel.findWithLikeCount).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      (MantraModel.findWithLikeCount as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/popular');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving popular mantras',
      });
    });
  });

  describe('saveMantra', () => {
    it('should save mantra when collection already exists', async () => {
      const mockMantra = { mantra_id: 1, title: 'Test Mantra' };
      const mockCollection = {
        collection_id: 10,
        user_id: 1,
        name: 'Saved Mantras',
        description: 'Your saved mantras',
      };

      (MantraModel.findById as jest.Mock).mockResolvedValue(mockMantra);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([mockCollection]);
      (CollectionModel.isMantraInCollection as jest.Mock).mockResolvedValue(false);
      (CollectionModel.addMantra as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/mantras/1/save');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra saved successfully',
      });
      expect(MantraModel.findById).toHaveBeenCalledWith(1);
      expect(CollectionModel.findByUserId).toHaveBeenCalledWith(1);
      expect(CollectionModel.isMantraInCollection).toHaveBeenCalledWith(10, 1);
      expect(CollectionModel.addMantra).toHaveBeenCalledWith(10, 1, 1);
    });

    it('should create collection and save mantra when collection does not exist', async () => {
      const mockMantra = { mantra_id: 1, title: 'Test Mantra' };
      const newCollection = {
        collection_id: 10,
        user_id: 1,
        name: 'Saved Mantras',
        description: 'Your saved mantras',
      };

      (MantraModel.findById as jest.Mock).mockResolvedValue(mockMantra);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);
      (CollectionModel.create as jest.Mock).mockResolvedValue(newCollection);
      (CollectionModel.isMantraInCollection as jest.Mock).mockResolvedValue(false);
      (CollectionModel.addMantra as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/mantras/1/save');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra saved successfully',
      });
      expect(CollectionModel.create).toHaveBeenCalledWith(1, 'Saved Mantras', 'Your saved mantras');
      expect(CollectionModel.addMantra).toHaveBeenCalledWith(10, 1, 1);
    });

    it('should return 200 with already saved message when mantra is already saved', async () => {
      const mockMantra = { mantra_id: 1, title: 'Test Mantra' };
      const mockCollection = {
        collection_id: 10,
        user_id: 1,
        name: 'Saved Mantras',
        description: 'Your saved mantras',
      };

      (MantraModel.findById as jest.Mock).mockResolvedValue(mockMantra);
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([mockCollection]);
      (CollectionModel.isMantraInCollection as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/mantras/1/save');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra already saved',
      });
      expect(CollectionModel.addMantra).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).post('/mantras/1/save');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if mantra not found', async () => {
      (MantraModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/mantras/999/save');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Mantra not found',
      });
    });

    it('should handle errors', async () => {
      (MantraModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/mantras/1/save');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error saving mantra',
      });
    });
  });

    describe('unsaveMantra', () => {
    it('should unsave mantra successfully (removes from at least one collection)', async () => {
      const collections = [
        { collection_id: 10, user_id: 1, name: 'Saved Mantras', description: 'Your saved mantras' },
        { collection_id: 11, user_id: 1, name: 'Other', description: 'Other collection' },
      ];

      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue(collections);

      // Simulate: removed from first collection, not removed from second
      (CollectionModel.removeMantra as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/1/save');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra unsaved successfully',
      });

      expect(CollectionModel.findByUserId).toHaveBeenCalledWith(1);

      // Called for each collection with (collection_id, mantraId)
      expect(CollectionModel.removeMantra).toHaveBeenCalledTimes(2);
      expect(CollectionModel.removeMantra).toHaveBeenNthCalledWith(1, 10, 1);
      expect(CollectionModel.removeMantra).toHaveBeenNthCalledWith(2, 11, 1);

      // No longer used by controller
      expect(CollectionModel.isMantraInCollection).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/mantras/1/save');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if user has no collections', async () => {
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/1/save');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'No collections found',
      });

      expect(CollectionModel.removeMantra).not.toHaveBeenCalled();
    });

    it('should return 404 if mantra is not in any collection', async () => {
      const collections = [
        { collection_id: 10, user_id: 1, name: 'Saved Mantras', description: 'Your saved mantras' },
        { collection_id: 11, user_id: 1, name: 'Other', description: 'Other collection' },
      ];

      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue(collections);

      // Not removed from any collection
      (CollectionModel.removeMantra as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/1/save');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Mantra not found in any collection',
      });

      expect(CollectionModel.removeMantra).toHaveBeenCalledTimes(2);
      expect(CollectionModel.removeMantra).toHaveBeenNthCalledWith(1, 10, 1);
      expect(CollectionModel.removeMantra).toHaveBeenNthCalledWith(2, 11, 1);

      expect(CollectionModel.isMantraInCollection).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      (CollectionModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/mantras/1/save');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error unsaving mantra',
      });
    });
  });


  describe('getSavedMantras', () => {
    it('should get saved mantras when collection exists', async () => {
      const mockCollection = {
        collection_id: 10,
        user_id: 1,
        name: 'Saved Mantras',
        description: 'Your saved mantras',
      };
      const mockMantras = [
        { mantra_id: 1, title: 'Saved Mantra 1', key_takeaway: 'Takeaway 1' },
        { mantra_id: 2, title: 'Saved Mantra 2', key_takeaway: 'Takeaway 2' },
      ];

      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([mockCollection]);
      (CollectionModel.getMantrasInCollection as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/mantras/saved');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: mockMantras,
      });
      expect(CollectionModel.findByUserId).toHaveBeenCalledWith(1);
      expect(CollectionModel.getMantrasInCollection).toHaveBeenCalledWith(10);
    });

    it('should return empty array when saved collection does not exist', async () => {
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue([]);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/mantras/saved');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: [],
      });
      expect(CollectionModel.findByUserId).toHaveBeenCalledWith(1);
      expect(CollectionModel.getMantrasInCollection).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/mantras/saved');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/mantras/saved');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving saved mantras',
      });
    });
  });
});