import request from 'supertest';
import express from 'express';
import { RecommendationController } from '../../src/controllers/recommendation.controller';
import { RecommendationModel } from '../../src/models/recommendation.model';

jest.mock('../../src/models/recommendation.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });
  app.get('/recommendations', RecommendationController.getUserRecommendations);
  app.get('/recommendations/detailed', RecommendationController.getDetailedRecommendations);
  app.get('/recommendations/recent', RecommendationController.getRecentRecommendations);
  app.get('/recommendations/stats', RecommendationController.getRecommendationStats);
  app.get('/recommendations/:id', RecommendationController.getRecommendationById);
  app.post('/recommendations', RecommendationController.createRecommendation);
  app.delete('/recommendations/:id', RecommendationController.deleteRecommendation);
  return app;
}

describe('RecommendationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRecommendations', () => {
    it('should get user recommendations with default pagination', async () => {
      const mockRecommendations = [
        { rec_id: 1, user_id: 1, mantra_id: 5, reason: 'Test reason' },
        { rec_id: 2, user_id: 1, mantra_id: 6, reason: 'Another reason' },
      ];
      (RecommendationModel.findByUserId as jest.Mock).mockResolvedValue(mockRecommendations);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          recommendations: mockRecommendations,
          pagination: {
            limit: 50,
            offset: 0,
            count: 2,
          },
        },
      });
      expect(RecommendationModel.findByUserId).toHaveBeenCalledWith(1, 50, 0);
    });

    it('should get recommendations with custom pagination', async () => {
      const mockRecommendations = [{ rec_id: 1 }];
      (RecommendationModel.findByUserId as jest.Mock).mockResolvedValue(mockRecommendations);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations?limit=10&offset=5');

      expect(res.status).toBe(200);
      expect(RecommendationModel.findByUserId).toHaveBeenCalledWith(1, 10, 5);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/recommendations');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving recommendations',
      });
    });
  });

  describe('getDetailedRecommendations', () => {
    it('should get detailed recommendations with mantra titles', async () => {
      const mockRecommendations = [
        { rec_id: 1, user_id: 1, mantra_id: 5, reason: 'Test', mantra_title: 'Mantra Title' },
      ];
      (RecommendationModel.findByUserIdWithMantras as jest.Mock).mockResolvedValue(mockRecommendations);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/detailed');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { recommendations: mockRecommendations },
      });
      expect(RecommendationModel.findByUserIdWithMantras).toHaveBeenCalledWith(1, 20);
    });

    it('should get detailed recommendations with custom limit', async () => {
      const mockRecommendations = [{ rec_id: 1, mantra_title: 'Test' }];
      (RecommendationModel.findByUserIdWithMantras as jest.Mock).mockResolvedValue(mockRecommendations);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/detailed?limit=5');

      expect(res.status).toBe(200);
      expect(RecommendationModel.findByUserIdWithMantras).toHaveBeenCalledWith(1, 5);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/recommendations/detailed');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.findByUserIdWithMantras as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/detailed');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving detailed recommendations',
      });
    });
  });

  describe('getRecentRecommendations', () => {
    it('should get recent recommendations with default days', async () => {
      const mockRecommendations = [{ rec_id: 1 }];
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue(mockRecommendations);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/recent');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          recommendations: mockRecommendations,
          daysBack: 7,
        },
      });
      expect(RecommendationModel.findRecent).toHaveBeenCalledWith(1, 7);
    });

    it('should get recent recommendations with custom days', async () => {
      const mockRecommendations = [{ rec_id: 1 }];
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue(mockRecommendations);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/recent?days=30');

      expect(res.status).toBe(200);
      expect(res.body.data.daysBack).toBe(30);
      expect(RecommendationModel.findRecent).toHaveBeenCalledWith(1, 30);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/recommendations/recent');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.findRecent as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/recent');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving recent recommendations',
      });
    });
  });

  describe('getRecommendationById', () => {
    it('should get recommendation by id', async () => {
      const mockRecommendation = { rec_id: 1, user_id: 1, mantra_id: 5 };
      (RecommendationModel.findById as jest.Mock).mockResolvedValue(mockRecommendation);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { recommendation: mockRecommendation },
      });
      expect(RecommendationModel.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if recommendation not found', async () => {
      (RecommendationModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Recommendation not found',
      });
    });

    it('should return 403 if recommendation belongs to different user', async () => {
      const mockRecommendation = { rec_id: 1, user_id: 2, mantra_id: 5 };
      (RecommendationModel.findById as jest.Mock).mockResolvedValue(mockRecommendation);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/recommendations/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving recommendation',
      });
    });
  });

  describe('createRecommendation', () => {
    it('should create recommendation', async () => {
      const newRecommendation = { mantra_id: 5, reason: 'User expressed anxiety' };
      const createdRecommendation = { rec_id: 1, user_id: 1, ...newRecommendation };
      (RecommendationModel.create as jest.Mock).mockResolvedValue(createdRecommendation);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/recommendations')
        .send(newRecommendation);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Recommendation logged successfully',
        data: { recommendation: createdRecommendation },
      });
      expect(RecommendationModel.create).toHaveBeenCalledWith({
        user_id: 1,
        mantra_id: 5,
        reason: 'User expressed anxiety',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app)
        .post('/recommendations')
        .send({ mantra_id: 5, reason: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/recommendations')
        .send({ mantra_id: 5, reason: 'Test' });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error logging recommendation',
      });
    });
  });

  describe('deleteRecommendation', () => {
    it('should delete recommendation', async () => {
      const existingRecommendation = { rec_id: 1, user_id: 1 };
      (RecommendationModel.findById as jest.Mock).mockResolvedValue(existingRecommendation);
      (RecommendationModel.delete as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/recommendations/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Recommendation deleted successfully',
      });
      expect(RecommendationModel.delete).toHaveBeenCalledWith(1);
    });

    it('should return 404 if recommendation not found', async () => {
      (RecommendationModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/recommendations/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Recommendation not found',
      });
    });

    it('should return 403 if recommendation belongs to different user', async () => {
      const existingRecommendation = { rec_id: 1, user_id: 2 };
      (RecommendationModel.findById as jest.Mock).mockResolvedValue(existingRecommendation);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/recommendations/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/recommendations/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/recommendations/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting recommendation',
      });
    });
  });

  describe('getRecommendationStats', () => {
    it('should get recommendation statistics', async () => {
      (RecommendationModel.countByUserId as jest.Mock).mockResolvedValue(145);
      (RecommendationModel.findRecent as jest.Mock).mockResolvedValue(new Array(12));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/stats');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          totalRecommendations: 145,
          recentRecommendations: 12,
          recentDays: 7,
        },
      });
      expect(RecommendationModel.countByUserId).toHaveBeenCalledWith(1);
      expect(RecommendationModel.findRecent).toHaveBeenCalledWith(1, 7);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/recommendations/stats');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RecommendationModel.countByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/recommendations/stats');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving recommendation statistics',
      });
    });
  });
});
