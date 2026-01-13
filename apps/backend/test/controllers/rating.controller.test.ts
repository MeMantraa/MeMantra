import request from 'supertest';
import express from 'express';
import { RatingController } from '../../src/controllers/rating.controller';
import { RatingModel } from '../../src/models/rating.model';

jest.mock('../../src/models/rating.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });

  app.post('/ratings', RatingController.rateMantra);
  app.get('/ratings/mantra/:mantraId', RatingController.getUserRating);
  app.get('/ratings/mantra/:mantraId/average', RatingController.getAverageRating);
  app.delete('/ratings/:ratingId', RatingController.deleteRating);
  return app;
}

describe('RatingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rateMantra', () => {
    it('should create/update rating successfully', async () => {
      const mockRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4, review_text: 'Great!' };
      (RatingModel.upsert as jest.Mock).mockResolvedValue(mockRating);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/ratings')
        .send({ mantra_id: 5, rating: 4, review_text: 'Great!' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Rating saved successfully',
        data: { rating: mockRating },
      });
      expect(RatingModel.upsert).toHaveBeenCalledWith(1, 5, 4, 'Great!');
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app)
        .post('/ratings')
        .send({ mantra_id: 5, rating: 4 });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 400 if mantra_id missing', async () => {
      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/ratings')
        .send({ rating: 4 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'mantra_id and rating are required',
      });
    });

    it('should return 400 if rating missing', async () => {
      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/ratings')
        .send({ mantra_id: 5 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'mantra_id and rating are required',
      });
    });

    it('should return 400 if rating below 1', async () => {
      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/ratings')
        .send({ mantra_id: 5, rating: 0 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'mantra_id and rating are required',
      });
    });

    it('should return 400 if rating above 5', async () => {
      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/ratings')
        .send({ mantra_id: 5, rating: 6 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Rating must be between 1 and 5',
      });
    });

    it('should handle errors', async () => {
      (RatingModel.upsert as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app)
        .post('/ratings')
        .send({ mantra_id: 5, rating: 4 });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error saving rating',
      });
    });
  });

  describe('getUserRating', () => {
    it('should get user rating successfully', async () => {
      const mockRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 };
      (RatingModel.findByUserAndMantra as jest.Mock).mockResolvedValue(mockRating);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/ratings/mantra/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { rating: mockRating },
      });
      expect(RatingModel.findByUserAndMantra).toHaveBeenCalledWith(1, 5);
    });

    it('should return null if no rating found', async () => {
      (RatingModel.findByUserAndMantra as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/ratings/mantra/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { rating: null },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/ratings/mantra/5');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (RatingModel.findByUserAndMantra as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/ratings/mantra/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving rating',
      });
    });
  });

  describe('getAverageRating', () => {
    it('should get average rating successfully', async () => {
      const mockResult = { average: 4.2, count: 10 };
      (RatingModel.getAverageRating as jest.Mock).mockResolvedValue(mockResult);

      const app = setupAppWithUser();
      const res = await request(app).get('/ratings/mantra/5/average');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: mockResult,
      });
      expect(RatingModel.getAverageRating).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      (RatingModel.getAverageRating as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/ratings/mantra/5/average');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving average rating',
      });
    });
  });

  describe('deleteRating', () => {
    it('should delete rating successfully', async () => {
      const mockRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 };
      (RatingModel.findByUserAndMantra as jest.Mock).mockResolvedValue(mockRating);
      (RatingModel.delete as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/ratings/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Rating deleted successfully',
      });
      expect(RatingModel.findByUserAndMantra).toHaveBeenCalledWith(1, 1);
      expect(RatingModel.delete).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/ratings/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should return 404 if rating not found in verification', async () => {
      (RatingModel.findByUserAndMantra as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/ratings/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Rating not found',
      });
      expect(RatingModel.delete).not.toHaveBeenCalled();
    });

    it('should return 404 if delete returns false', async () => {
      const mockRating = { rating_id: 1, user_id: 1, mantra_id: 5, rating: 4 };
      (RatingModel.findByUserAndMantra as jest.Mock).mockResolvedValue(mockRating);
      (RatingModel.delete as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/ratings/1');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Rating not found',
      });
    });

    it('should handle errors', async () => {
      (RatingModel.findByUserAndMantra as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/ratings/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting rating',
      });
    });
  });
});