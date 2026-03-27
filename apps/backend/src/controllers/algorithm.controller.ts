import { Request, Response } from 'express';
import { UserCategoryScoreModel } from '../models/user-category-score.model';

export const AlgorithmController = {
  /**
   * GET /api/algorithm/scores
   * Get the authenticated user's category scores
   */
  async getMyScores(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      const scores = await UserCategoryScoreModel.getScoresForUserWithNames(userId);

      return res.status(200).json({
        status: 'success',
        data: { scores },
      });
    } catch (error) {
      console.error('Get algorithm scores error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving algorithm scores',
      });
    }
  },

  /**
   * GET /api/algorithm/top
   * Get the user's top category scores.
   */
  async getTopCategories(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      const limit = Number(req.query.limit) || 10;
      const topCategories = await UserCategoryScoreModel.getTopCategories(userId, limit);

      return res.status(200).json({
        status: 'success',
        data: { categories: topCategories },
      });
    } catch (error) {
      console.error('Get top categories error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving top categories',
      });
    }
  },

  /**
   * PUT /api/algorithm/scores/:categoryId
   * Allow the user to manually set the score for a category
   */
  async updateScore(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      const categoryId = Number(req.params.categoryId);
      const { score } = req.body;

      if (score === undefined || typeof score !== 'number') {
        return res.status(400).json({
          status: 'error',
          message: 'score (number) is required in the request body',
        });
      }

      const updated = await UserCategoryScoreModel.setScore(userId, categoryId, score);

      return res.status(200).json({
        status: 'success',
        message: 'Score updated successfully',
        data: { score: updated },
      });
    } catch (error) {
      console.error('Update algorithm score error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating algorithm score',
      });
    }
  },

  /**
   * DELETE /api/algorithm/scores/:categoryId
   * Reset a single category score for the user.
   */
  async resetScore(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      const categoryId = Number(req.params.categoryId);
      const deleted = await UserCategoryScoreModel.resetScore(userId, categoryId);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Score not found for this category',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Score reset successfully',
      });
    } catch (error) {
      console.error('Reset algorithm score error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error resetting algorithm score',
      });
    }
  },

  /**
   * DELETE /api/algorithm/scores
   * Reset ALL category scores for the user (full algorithm reset).
   */
  async resetAllScores(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      await UserCategoryScoreModel.resetAllScores(userId);

      return res.status(200).json({
        status: 'success',
        message: 'All algorithm scores reset successfully',
      });
    } catch (error) {
      console.error('Reset all algorithm scores error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error resetting algorithm scores',
      });
    }
  },
};
