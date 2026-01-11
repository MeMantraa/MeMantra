import request from 'supertest';
import express from 'express';
import { CollectionController } from '../../src/controllers/collection.controller';
import { CollectionModel } from '../../src/models/collection.model';

jest.mock('../../src/models/collection.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req: express.Request & { user?: { userId: number, email: string } }, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });
  app.get('/collections', CollectionController.getUserCollections);
  app.get('/collections/:id', CollectionController.getCollectionById);
  app.post('/collections', CollectionController.createCollection);
  app.put('/collections/:id', CollectionController.updateCollection);
  app.delete('/collections/:id', CollectionController.deleteCollection);
  app.post('/collections/:id/mantras/:mantraId', CollectionController.addMantraToCollection);
  app.delete('/collections/:id/mantras/:mantraId', CollectionController.removeMantraFromCollection);
  return app;
}

describe('CollectionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Utility Helper Functions Coverage', () => {
    it('should test handleError utility', async () => {
      (CollectionModel.findByUserId as jest.Mock).mockRejectedValue(new Error('Test error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving collections',
      });
    });

    it('should test requireAuth utility when user is not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/collections');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should test verifyOwnership utility when collection is null', async () => {
      (CollectionModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/collections/999').send({ name: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Collection not found',
      });
    });

    it('should test verifyOwnership utility when user_id does not match', async () => {
      (CollectionModel.findById as jest.Mock).mockResolvedValue({
        collection_id: 1,
        user_id: 999,
        name: 'Test',
      });

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/collections/1').send({ name: 'Updated' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });
  });

  describe('getUserCollections', () => {
    it('should get user collections', async () => {
      const mockCollections = [
        { collection_id: 1, name: 'Morning Mantras', user_id: 1 },
        { collection_id: 2, name: 'Evening Mantras', user_id: 1 },
      ];
      (CollectionModel.findByUserId as jest.Mock).mockResolvedValue(mockCollections);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { collections: mockCollections },
      });
      expect(CollectionModel.findByUserId).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/collections');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving collections',
      });
    });
  });

  describe('getCollectionById', () => {
    it('should get collection with mantras', async () => {
      const mockResult = {
        collection: { collection_id: 1, name: 'Test', user_id: 1 },
        mantras: [{ mantra_id: 1, title: 'Mantra 1' }],
      };
      (CollectionModel.getCollectionWithMantras as jest.Mock).mockResolvedValue(mockResult);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: mockResult,
      });
    });

    it('should return 404 if collection not found', async () => {
      (CollectionModel.getCollectionWithMantras as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Collection not found',
      });
    }, 15000);


    it('should return 403 if collection belongs to different user', async () => {
      const mockResult = {
        collection: { collection_id: 1, name: 'Test', user_id: 2 },
        mantras: [],
      };
      (CollectionModel.getCollectionWithMantras as jest.Mock).mockResolvedValue(mockResult);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/collections/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.getCollectionWithMantras as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/collections/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving collection',
      });
    });
  });

  describe('createCollection', () => {
    it('should create collection', async () => {
      const newCollection = { name: 'New Collection', description: 'Test' };
      const createdCollection = { collection_id: 1, ...newCollection, user_id: 1 };
      (CollectionModel.create as jest.Mock).mockResolvedValue(createdCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/collections')
        .send(newCollection);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Collection created successfully',
        data: { collection: createdCollection },
      });
      expect(CollectionModel.create).toHaveBeenCalledWith(1, 'New Collection', 'Test');
    });

    it('should create collection without description', async () => {
      const newCollection = { name: 'New Collection' };
      const createdCollection = { collection_id: 1, name: 'New Collection', user_id: 1 };
      (CollectionModel.create as jest.Mock).mockResolvedValue(createdCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/collections')
        .send(newCollection);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Collection created successfully',
        data: { collection: createdCollection },
      });
      expect(CollectionModel.create).toHaveBeenCalledWith(1, 'New Collection', undefined);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app)
        .post('/collections')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/collections')
        .send({ name: 'Test' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error creating collection',
      });
    });
  });

  describe('updateCollection', () => {
    it('should update collection', async () => {
      const existingCollection = { collection_id: 1, name: 'Old Name', user_id: 1 };
      const updatedCollection = { collection_id: 1, name: 'New Name', user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.update as jest.Mock).mockResolvedValue(updatedCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/collections/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Collection updated successfully',
        data: { collection: updatedCollection },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app)
        .put('/collections/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if collection not found', async () => {
      (CollectionModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/collections/999')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Collection not found',
      });
    });

    it('should return 403 if collection belongs to different user', async () => {
      const existingCollection = { collection_id: 1, name: 'Test', user_id: 2 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/collections/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .put('/collections/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error updating collection',
      });
    });
  });

  describe('deleteCollection', () => {
    it('should delete collection', async () => {
      const existingCollection = { collection_id: 1, name: 'Test', user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.delete as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Collection deleted successfully',
      });
      expect(CollectionModel.delete).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/collections/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if collection not found', async () => {
      (CollectionModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Collection not found',
      });
    });

    it('should return 403 if collection belongs to different user', async () => {
      const existingCollection = { collection_id: 1, name: 'Test', user_id: 2 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting collection',
      });
    });
  });

  describe('addMantraToCollection', () => {
    it('should add mantra to collection', async () => {
      const existingCollection = { collection_id: 1, user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.isMantraInCollection as jest.Mock).mockResolvedValue(false);
      (CollectionModel.addMantra as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/collections/1/mantras/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra added to collection successfully',
        alreadyExists: false,
      });
      expect(CollectionModel.isMantraInCollection).toHaveBeenCalledWith(1, 5);
      expect(CollectionModel.addMantra).toHaveBeenCalledWith(1, 5, 1);
    });

    it('should return success if mantra already exists in collection', async () => {
      const existingCollection = { collection_id: 1, user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.isMantraInCollection as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/collections/1/mantras/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra already in collection',
        alreadyExists: true,
      });
      expect(CollectionModel.isMantraInCollection).toHaveBeenCalledWith(1, 5);
      expect(CollectionModel.addMantra).not.toHaveBeenCalled();
    });

    it('should handle PostgreSQL duplicate key error gracefully', async () => {
      const existingCollection = { collection_id: 1, user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.isMantraInCollection as jest.Mock).mockResolvedValue(false);
      
      const pgError = new Error('Duplicate key') as any;
      pgError.code = '23505';
      (CollectionModel.addMantra as jest.Mock).mockRejectedValue(pgError);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/collections/1/mantras/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra already in collection',
        alreadyExists: true,
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).post('/collections/1/mantras/5');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if collection not found', async () => {
      (CollectionModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/collections/999/mantras/5');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Collection not found',
      });
    });

    it('should return 403 if collection belongs to different user', async () => {
      const existingCollection = { collection_id: 1, user_id: 2 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/collections/1/mantras/5');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/collections/1/mantras/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error adding mantra to collection',
      });
    });
  });

  describe('removeMantraFromCollection', () => {
    it('should remove mantra from collection', async () => {
      const existingCollection = { collection_id: 1, user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.removeMantra as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1/mantras/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra removed from collection successfully',
      });
      expect(CollectionModel.removeMantra).toHaveBeenCalledWith(1, 5);
    });

    it('should return 404 if mantra not found in collection', async () => {
      const existingCollection = { collection_id: 1, user_id: 1 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);
      (CollectionModel.removeMantra as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1/mantras/5');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Mantra not found in collection',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/collections/1/mantras/5');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if collection not found', async () => {
      (CollectionModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/999/mantras/5');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Collection not found',
      });
    });

    it('should return 403 if collection belongs to different user', async () => {
      const existingCollection = { collection_id: 1, user_id: 2 };
      (CollectionModel.findById as jest.Mock).mockResolvedValue(existingCollection);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1/mantras/5');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should handle errors', async () => {
      (CollectionModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/collections/1/mantras/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error removing mantra from collection',
      });
    });
  });
});
