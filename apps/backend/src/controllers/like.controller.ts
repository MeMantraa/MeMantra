import { Request, Response } from 'express';
import { LikeModel } from '../models/like.model';
import { LikeMantraInput } from '../validators/like.validator';

export const LikeController = {
  // Like a mantra
  async likeMantra(req: Request, res: Response) {
    try {
      const { mantra_id } = req.body as LikeMantraInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if already liked
      const alreadyLiked = await LikeModel.exists(userId, mantra_id);

      if (alreadyLiked) {
        return res.status(400).json({
          status: 'error',
          message: 'Mantra already liked',
        });
      }

      const like = await LikeModel.create(userId, mantra_id);

      return res.status(201).json({
        status: 'success',
        message: 'Mantra liked successfully',
        data: { like },
      });
    } catch (error) {
      console.error('Like mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error liking mantra',
      });
    }
  },

  // Unlike a mantra
  async unlikeMantra(req: Request, res: Response) {
    try {
      const { mantra_id } = req.body as LikeMantraInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const success = await LikeModel.delete(userId, mantra_id);

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Like not found',
        });
      }

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

  // Toggle like on a mantra (like if not liked, unlike if already liked)
  async toggleLike(req: Request, res: Response) {
    try {
      const { mantra_id } = req.body as LikeMantraInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const alreadyLiked = await LikeModel.exists(userId, mantra_id);

      if (alreadyLiked) {
        // Unlike
        await LikeModel.delete(userId, mantra_id);
        return res.status(200).json({
          status: 'success',
          message: 'Mantra unliked successfully',
          data: { liked: false },
        });
      } else {
        // Like
        await LikeModel.create(userId, mantra_id);
        return res.status(200).json({
          status: 'success',
          message: 'Mantra liked successfully',
          data: { liked: true },
        });
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error toggling like',
      });
    }
  },

  // Get all liked mantras for the authenticated user
  async getUserLikedMantras(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const mantras = await LikeModel.getUserLikes(userId);

      return res.status(200).json({
        status: 'success',
        data: { mantras },
      });
    } catch (error) {
      console.error('Get user liked mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving liked mantras',
      });
    }
  },

  // Check if user has liked a specific mantra
  async checkLikeStatus(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const isLiked = await LikeModel.exists(userId, Number(mantraId));

      return res.status(200).json({
        status: 'success',
        data: { liked: isLiked },
      });
    } catch (error) {
      console.error('Check like status error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking like status',
      });
    }
  },

  // Get like count for a mantra
  async getMantraLikeCount(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;

      const count = await LikeModel.getMantraLikeCount(Number(mantraId));

      return res.status(200).json({
        status: 'success',
        data: { mantra_id: Number(mantraId), like_count: count },
      });
    } catch (error) {
      console.error('Get mantra like count error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving like count',
      });
    }
  },
};
