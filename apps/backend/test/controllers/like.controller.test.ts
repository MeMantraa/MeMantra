import request from 'supertest';
import express from 'express';
import { LikeController } from '../../src/controllers/like.controller';
import { LikeModel } from '../../src/models/like.model';

jest.mock('../../src/models/like.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });
  app.get('/likes/popular', LikeController.getMostLikedMantras);
  app.post('/likes/:mantraId', LikeController.likeMantra);
  app.delete('/likes/:mantraId', LikeController.unlikeMantra);
  app.get('/likes/mantras', LikeController.getLikedMantras);
  app.get('/likes/:mantraId/check', LikeController.checkIfLiked);
  return app;
}

describe('LikeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('likeMantra', () => {
    it('should like a mantra', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockResolvedValue(false);
      (LikeModel.create as jest.Mock).mockResolvedValue({ like_id: 1 });

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/likes/5');

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra liked successfully',
      });
      expect(LikeModel.hasUserLiked).toHaveBeenCalledWith(1, 5);
      expect(LikeModel.create).toHaveBeenCalledWith(1, 5);
    });

    it('should return 400 if already liked', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/likes/5');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'You have already liked this mantra',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).post('/likes/5');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/likes/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error liking mantra',
      });
    });
  });

  describe('unlikeMantra', () => {
    it('should unlike a mantra', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockResolvedValue(true);
      (LikeModel.remove as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/likes/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Mantra unliked successfully',
      });
      expect(LikeModel.remove).toHaveBeenCalledWith(1, 5);
    });

    it('should return 400 if not liked', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/likes/5');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'You have not liked this mantra',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/likes/5');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/likes/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error unliking mantra',
      });
    });
  });

  describe('getLikedMantras', () => {
    it('should get user liked mantras', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Mantra 1' },
        { mantra_id: 2, title: 'Mantra 2' },
      ];
      (LikeModel.getUserLikedMantras as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/likes/mantras');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { mantras: mockMantras },
      });
      expect(LikeModel.getUserLikedMantras).toHaveBeenCalledWith(1);
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/likes/mantras');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (LikeModel.getUserLikedMantras as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/likes/mantras');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving liked mantras',
      });
    });
  });

  describe('getMostLikedMantras', () => {
    it('should get most liked mantras with default limit', async () => {
      const mockMantras = [
        { mantra_id: 1, title: 'Popular 1', like_count: 100 },
        { mantra_id: 2, title: 'Popular 2', like_count: 80 },
      ];
      (LikeModel.getMostLikedMantras as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/likes/popular');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { mantras: mockMantras },
      });
      expect(LikeModel.getMostLikedMantras).toHaveBeenCalledWith(10);
    });

    it('should get most liked mantras with custom limit', async () => {
      const mockMantras = [{ mantra_id: 1, title: 'Popular', like_count: 100 }];
      (LikeModel.getMostLikedMantras as jest.Mock).mockResolvedValue(mockMantras);

      const app = setupAppWithUser();
      const res = await request(app).get('/likes/popular?limit=5');

      expect(res.status).toBe(200);
      expect(LikeModel.getMostLikedMantras).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      (LikeModel.getMostLikedMantras as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser();
      const res = await request(app).get('/likes/popular');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving most liked mantras',
      });
    });
  });

  describe('checkIfLiked', () => {
    it('should check if user liked a mantra (true)', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/likes/5/check');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { hasLiked: true },
      });
      expect(LikeModel.hasUserLiked).toHaveBeenCalledWith(1, 5);
    });

    it('should check if user liked a mantra (false)', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/likes/5/check');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: { hasLiked: false },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/likes/5/check');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors', async () => {
      (LikeModel.hasUserLiked as jest.Mock).mockRejectedValue(new Error('DB error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/likes/5/check');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error checking like status',
      });
    });
  });
});
