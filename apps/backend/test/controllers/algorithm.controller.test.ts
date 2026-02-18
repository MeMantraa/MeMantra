import request from 'supertest';
import express from 'express';
import { AlgorithmController } from '../../src/controllers/algorithm.controller';
import { UserCategoryScoreModel } from '../../src/models/user-category-score.model';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email: string };
    }
  }
}

jest.mock('../../src/models/user-category-score.model');

function setupApp(userId?: number) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: 'test@test.com' };
    next();
  });

  app.get('/algorithm/scores', AlgorithmController.getMyScores);
  app.get('/algorithm/top-categories', AlgorithmController.getTopCategories);
  app.put('/algorithm/scores/:categoryId', AlgorithmController.updateScore);
  app.delete('/algorithm/scores/:categoryId', AlgorithmController.resetScore);
  app.delete('/algorithm/scores', AlgorithmController.resetAllScores);
  return app;
}

describe('AlgorithmController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMyScores', () => {
    it('should return 401 if not authenticated', async () => {
      const app = setupApp();
      const res = await request(app).get('/algorithm/scores');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return scores for authenticated user', async () => {
      const mockScores = [
        { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 10 },
        { category_id: 2, name: 'Calm', category_type: 'essential', score: 5 },
      ];
      (UserCategoryScoreModel.getScoresForUserWithNames as jest.Mock).mockResolvedValue(mockScores);

      const app = setupApp(1);
      const res = await request(app).get('/algorithm/scores');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { scores: mockScores },
      });
      expect(UserCategoryScoreModel.getScoresForUserWithNames).toHaveBeenCalledWith(1);
    });

    it('should handle errors', async () => {
      (UserCategoryScoreModel.getScoresForUserWithNames as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupApp(1);
      const res = await request(app).get('/algorithm/scores');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving algorithm scores',
      });
    });
  });

  describe('getTopCategories', () => {
    it('should return 401 if not authenticated', async () => {
      const app = setupApp();
      const res = await request(app).get('/algorithm/top-categories');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return top categories with default limit', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 10 },
      ];
      (UserCategoryScoreModel.getTopCategories as jest.Mock).mockResolvedValue(mockCategories);

      const app = setupApp(1);
      const res = await request(app).get('/algorithm/top-categories');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { categories: mockCategories },
      });
      expect(UserCategoryScoreModel.getTopCategories).toHaveBeenCalledWith(1, 10);
    });

    it('should accept custom limit', async () => {
      (UserCategoryScoreModel.getTopCategories as jest.Mock).mockResolvedValue([]);

      const app = setupApp(1);
      const res = await request(app).get('/algorithm/top-categories?limit=5');

      expect(res.status).toBe(200);
      expect(UserCategoryScoreModel.getTopCategories).toHaveBeenCalledWith(1, 5);
    });

    it('should handle errors', async () => {
      (UserCategoryScoreModel.getTopCategories as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupApp(1);
      const res = await request(app).get('/algorithm/top-categories');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving top categories',
      });
    });
  });

  describe('updateScore', () => {
    it('should return 401 if not authenticated', async () => {
      const app = setupApp();
      const res = await request(app).put('/algorithm/scores/1').send({ score: 5 });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 400 if score is missing', async () => {
      const app = setupApp(1);
      const res = await request(app).put('/algorithm/scores/1').send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'score (number) is required in the request body',
      });
    });

    it('should return 400 if score is not a number', async () => {
      const app = setupApp(1);
      const res = await request(app).put('/algorithm/scores/1').send({ score: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'score (number) is required in the request body',
      });
    });

    it('should update score successfully', async () => {
      const mockResult = { user_id: 1, category_id: 1, score: 5, updated_at: '2024-01-01' };
      (UserCategoryScoreModel.setScore as jest.Mock).mockResolvedValue(mockResult);

      const app = setupApp(1);
      const res = await request(app).put('/algorithm/scores/1').send({ score: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Score updated successfully',
        data: { score: mockResult },
      });
      expect(UserCategoryScoreModel.setScore).toHaveBeenCalledWith(1, 1, 5);
    });

    it('should handle errors', async () => {
      (UserCategoryScoreModel.setScore as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupApp(1);
      const res = await request(app).put('/algorithm/scores/1').send({ score: 5 });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error updating algorithm score',
      });
    });
  });

  describe('resetScore', () => {
    it('should return 401 if not authenticated', async () => {
      const app = setupApp();
      const res = await request(app).delete('/algorithm/scores/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should reset score successfully', async () => {
      (UserCategoryScoreModel.resetScore as jest.Mock).mockResolvedValue(true);

      const app = setupApp(1);
      const res = await request(app).delete('/algorithm/scores/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Score reset successfully',
      });
      expect(UserCategoryScoreModel.resetScore).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 when score not found', async () => {
      (UserCategoryScoreModel.resetScore as jest.Mock).mockResolvedValue(false);

      const app = setupApp(1);
      const res = await request(app).delete('/algorithm/scores/1');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Score not found for this category',
      });
    });

    it('should handle errors', async () => {
      (UserCategoryScoreModel.resetScore as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupApp(1);
      const res = await request(app).delete('/algorithm/scores/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error resetting algorithm score',
      });
    });
  });

  describe('resetAllScores', () => {
    it('should return 401 if not authenticated', async () => {
      const app = setupApp();
      const res = await request(app).delete('/algorithm/scores');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should reset all scores successfully', async () => {
      (UserCategoryScoreModel.resetAllScores as jest.Mock).mockResolvedValue(undefined);

      const app = setupApp(1);
      const res = await request(app).delete('/algorithm/scores');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'All algorithm scores reset successfully',
      });
      expect(UserCategoryScoreModel.resetAllScores).toHaveBeenCalledWith(1);
    });

    it('should handle errors', async () => {
      (UserCategoryScoreModel.resetAllScores as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupApp(1);
      const res = await request(app).delete('/algorithm/scores');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error resetting algorithm scores',
      });
    });
  });
});
