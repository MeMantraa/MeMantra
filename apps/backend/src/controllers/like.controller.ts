import { Request, Response } from 'express';
import { LikeModel } from '../models/like.model';

export const LikeController = {
  // POST /api/likes/:mantraId - Like a mantra
  async likeMantra(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user already liked this mantra
      const hasLiked = await LikeModel.hasUserLiked(userId, Number(mantraId));

      if (hasLiked) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already liked this mantra',
        });
      }

      await LikeModel.create(userId, Number(mantraId));

      return res.status(201).json({
        status: 'success',
        message: 'Mantra liked successfully',
      });
    } catch (error) {
      console.error('Like mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error liking mantra',
      });
    }
  },

  // DELETE /api/likes/:mantraId - Unlike a mantra
  async unlikeMantra(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user has liked this mantra
      const hasLiked = await LikeModel.hasUserLiked(userId, Number(mantraId));

      if (!hasLiked) {
        return res.status(400).json({
          status: 'error',
          message: 'You have not liked this mantra',
        });
      }

      await LikeModel.remove(userId, Number(mantraId));

      return res.status(200).json({
        status: 'success',
        message: 'Mantra unliked successfully',
      });
    } catch (error) {
      console.error('Unlike mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error unliking mantra',
      });
    }
  },

  // GET /api/likes/mantras - Get user's liked mantras
  async getLikedMantras(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const likedMantras = await LikeModel.getUserLikedMantras(userId);

      return res.status(200).json({
        status: 'success',
        data: { mantras: likedMantras },
      });
    } catch (error) {
      console.error('Get liked mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving liked mantras',
      });
    }
  },

  // GET /api/likes/popular - Get most liked mantras (alternative to /api/mantras/popular)
  async getMostLikedMantras(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;

      const popularMantras = await LikeModel.getMostLikedMantras(Number(limit));

      return res.status(200).json({
        status: 'success',
        data: { mantras: popularMantras },
      });
    } catch (error) {
      console.error('Get most liked mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving most liked mantras',
      });
    }
  },

  // GET /api/likes/:mantraId/check - Check if user has liked a mantra
  async checkIfLiked(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const hasLiked = await LikeModel.hasUserLiked(userId, Number(mantraId));

      return res.status(200).json({
        status: 'success',
        data: { hasLiked },
      });
    } catch (error) {
      console.error('Check if liked error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking like status',
      });
    }
  },
};
