import { Request, Response } from 'express';
import { RecommendationModel } from '../models/recommendation.model';
import { CreateRecommendationInput } from '../validators/recommendation.validator';

export const RecommendationController = {
  // GET /api/recommendations - Get user's recommendation history
  async getUserRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { limit, offset } = req.query;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const limitNum = limit ? Number(limit) : 50;
      const offsetNum = offset ? Number(offset) : 0;

      const recommendations = await RecommendationModel.findByUserId(
        userId,
        limitNum,
        offsetNum
      );

      return res.status(200).json({
        status: 'success',
        data: {
          recommendations,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            count: recommendations.length,
          },
        },
      });
    } catch (error) {
      console.error('Get user recommendations error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving recommendations',
      });
    }
  },

  // GET /api/recommendations/detailed - Get recommendations with mantra details
  async getDetailedRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { limit = '20' } = req.query;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const recommendations = await RecommendationModel.findByUserIdWithMantras(
        userId,
        Number(limit)
      );

      return res.status(200).json({
        status: 'success',
        data: { recommendations },
      });
    } catch (error) {
      console.error('Get detailed recommendations error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving detailed recommendations',
      });
    }
  },

  // GET /api/recommendations/recent - Get recent recommendations
  async getRecentRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { days } = req.query;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const daysNum = days ? Number(days) : 7;
      const recommendations = await RecommendationModel.findRecent(userId, daysNum);

      return res.status(200).json({
        status: 'success',
        data: {
          recommendations,
          daysBack: daysNum,
        },
      });
    } catch (error) {
      console.error('Get recent recommendations error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving recent recommendations',
      });
    }
  },

  // GET /api/recommendations/:id - Get single recommendation
  async getRecommendationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const recommendation = await RecommendationModel.findById(Number(id));

      if (!recommendation) {
        return res.status(404).json({
          status: 'error',
          message: 'Recommendation not found',
        });
      }

      // Check if recommendation belongs to user
      if (recommendation.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { recommendation },
      });
    } catch (error) {
      console.error('Get recommendation by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving recommendation',
      });
    }
  },

  // POST /api/recommendations - Log a new recommendation
  async createRecommendation(req: Request, res: Response) {
    try {
      const recommendationData = req.body as CreateRecommendationInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const newRecommendation = await RecommendationModel.create({
        user_id: userId,
        mantra_id: recommendationData.mantra_id,
        reason: recommendationData.reason,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Recommendation logged successfully',
        data: { recommendation: newRecommendation },
      });
    } catch (error) {
      console.error('Create recommendation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error logging recommendation',
      });
    }
  },

  // DELETE /api/recommendations/:id - Delete a recommendation
  async deleteRecommendation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const existingRecommendation = await RecommendationModel.findById(Number(id));

      if (!existingRecommendation) {
        return res.status(404).json({
          status: 'error',
          message: 'Recommendation not found',
        });
      }

      // Check if recommendation belongs to user
      if (existingRecommendation.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      await RecommendationModel.delete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Recommendation deleted successfully',
      });
    } catch (error) {
      console.error('Delete recommendation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting recommendation',
      });
    }
  },

  // GET /api/recommendations/stats - Get recommendation statistics
  async getRecommendationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const totalCount = await RecommendationModel.countByUserId(userId);
      const recentCount = (await RecommendationModel.findRecent(userId, 7)).length;

      return res.status(200).json({
        status: 'success',
        data: {
          totalRecommendations: totalCount,
          recentRecommendations: recentCount,
          recentDays: 7,
        },
      });
    } catch (error) {
      console.error('Get recommendation stats error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving recommendation statistics',
      });
    }
  },
};
