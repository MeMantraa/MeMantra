import { Request, Response } from 'express';
import { RatingModel } from '../models/rating.model';
import { UserCategoryScoreModel } from '../models/user-category-score.model';
import { sanitizeForLog } from '../utils/sanitize.utils';

export const RatingController = {
  /**
   * POST /api/ratings
   * Rate a mantra (creates or updates)
   */
  async rateMantra(req: Request, res: Response) {
    try {
      const { mantra_id, rating, review_text } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (!mantra_id || !rating) {
        return res.status(400).json({
          status: 'error',
          message: 'mantra_id and rating are required',
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          status: 'error',
          message: 'Rating must be between 1 and 5',
        });
      }

      // Check for existing rating to handle score 
      const existing = await RatingModel.findByUserAndMantra(userId, mantra_id);
      const oldPoints = existing && existing.rating >= 4 ? existing.rating : 0;
      const newPoints = rating >= 4 ? rating : 0;

      const result = await RatingModel.upsert(
        userId,
        mantra_id,
        rating,
        review_text
      );

      // Update algorithm: add  (new - old) points for all categories
      const delta = newPoints - oldPoints;
      if (delta > 0) {
        await UserCategoryScoreModel.addScoreForMantra(userId, mantra_id, delta).catch((err) => {
          console.error('Failed to update category score for user:', sanitizeForLog(userId), 'mantra:', sanitizeForLog(mantra_id), err);
        });
      } else if (delta < 0) {
        await UserCategoryScoreModel.removeScoreForMantra(userId, mantra_id, Math.abs(delta)).catch((err) => {
          console.error('Failed to remove category score for user:', sanitizeForLog(userId), 'mantra:', sanitizeForLog(mantra_id), err);
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Rating saved successfully',
        data: { rating: result },
      });
    } catch (error) {
      console.error('Rate mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error saving rating',
      });
    }
  },

  /**
   * GET /api/ratings/mantra/:mantraId
   * Get user's rating for a specific mantra
   */
  async getUserRating(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const rating = await RatingModel.findByUserAndMantra(
        userId,
        Number(mantraId)
      );

      return res.status(200).json({
        status: 'success',
        data: { rating: rating || null },
      });
    } catch (error) {
      console.error('Get user rating error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving rating',
      });
    }
  },

  /**
   * GET /api/ratings/mantra/:mantraId/average
   * Get average rating for a mantra
   */
  async getAverageRating(req: Request, res: Response) {
    try {
      const { mantraId } = req.params;

      const result = await RatingModel.getAverageRating(Number(mantraId));

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('Get average rating error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving average rating',
      });
    }
  },

  /**
   * DELETE /api/ratings/:ratingId
   * Delete a rating
   */
  async deleteRating(req: Request, res: Response) {
    try {
      const { ratingId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Verify the rating belongs to the user
      const rating = await RatingModel.findByUserAndMantra(userId, Number(ratingId));
      
      if (!rating) {
        return res.status(404).json({
          status: 'error',
          message: 'Rating not found',
        });
      }

      const deleted = await RatingModel.delete(Number(ratingId));

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Rating not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Rating deleted successfully',
      });
    } catch (error) {
      console.error('Delete rating error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting rating',
      });
    }
  },
};