import { Request, Response } from 'express';
import { MantraModel } from '../models/mantra.model';
import { CollectionModel } from '../models/collection.model';
import { CategoryModel } from '../models/category.model';
import {
  CreateMantraInput,
  UpdateMantraInput,
  MantraQueryInput,
} from '../validators/mantra.validator';
import { db } from '../db';
import { UserCategoryScoreModel } from '../models/user-category-score.model';
import { LikeModel } from '../models/like.model';
import { sanitizeForLog } from '../utils/sanitize.utils';
import { cacheDelete } from '../services/cache.service';
import { logger } from '../utils/logger';

export const MantraController = {
  // GET /api/mantras - List all mantras with optional search and pagination
  async getAllMantras(req: Request, res: Response) {
    try {
      const { search, limit, offset } = req.query as unknown as MantraQueryInput;
      const limitNum = limit ? Number(limit) : 20;
      const offsetNum = offset ? Number(offset) : 0;

      let mantras;

      if (search) {
        mantras = await MantraModel.search(search, limitNum);
      } else {
        mantras = await MantraModel.findAll(limitNum, offsetNum);
      }

      return res.status(200).json({
        status: 'success',
        data: {
          mantras,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            count: mantras.length,
          },
        },
      });
    } catch (error) {
      logger.error('Get all mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantras',
      });
    }
  },

  // GET /api/mantras/:id - Get single mantra by ID
  async getMantraById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const mantra = await MantraModel.findById(Number(id));

      if (!mantra) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { mantra },
      });
    } catch (error) {
      logger.error('Get mantra by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantra',
      });
    }
  },

  // POST /api/mantras - Create new mantra
  async createMantra(req: Request, res: Response) {
    try {
      const mantraData = req.body as CreateMantraInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const newMantra = await MantraModel.create({
        ...mantraData,
        created_by: userId,
      });

      await cacheDelete('cache:/api/mantras*');

      return res.status(201).json({
        status: 'success',
        message: 'Mantra created successfully',
        data: { mantra: newMantra },
      });
    } catch (error) {
      logger.error('Create mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating mantra',
      });
    }
  },

  // PUT /api/mantras/:id - Update mantra
  async updateMantra(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateMantraInput;

      const existingMantra = await MantraModel.findById(Number(id));

      if (!existingMantra) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

      const updatedMantra = await MantraModel.update(Number(id), updateData);

      await cacheDelete('cache:/api/mantras*');

      return res.status(200).json({
        status: 'success',
        message: 'Mantra updated successfully',
        data: { mantra: updatedMantra },
      });
    } catch (error) {
      logger.error('Update mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating mantra',
      });
    }
  },

  // DELETE /api/mantras/:id - Soft delete mantra
  async deleteMantra(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingMantra = await MantraModel.findById(Number(id));

      if (!existingMantra) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

      await MantraModel.softDelete(Number(id));

      await cacheDelete('cache:/api/mantras*');

      return res.status(200).json({
        status: 'success',
        message: 'Mantra deleted successfully',
      });
    } catch (error) {
      logger.error('Delete mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting mantra',
      });
    }
  },

  // GET /api/mantras/category/:categoryId - Get mantras by category
  async getMantrasByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;

      const mantras = await MantraModel.findByCategory(Number(categoryId));

      return res.status(200).json({
        status: 'success',
        data: {
          mantras,
          count: mantras.length,
        },
      });
    } catch (error) {
      logger.error('Get mantras by category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantras by category',
      });
    }
  },

  // GET /api/mantras/:id/categories - Get categories for a specific mantra
  async getCategoriesForMantra(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const mantra = await MantraModel.findById(Number(id));
      if (!mantra) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

      const categories = await CategoryModel.getCategoriesForMantra(Number(id));

      return res.status(200).json({
        status: 'success',
        data: { categories },
      });
    } catch (error) {
      logger.error('Get categories for mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving categories for mantra',
      });
    }
  },

  // GET /api/mantras/popular - Get most liked mantras
  async getPopularMantras(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;

      const mantras = await MantraModel.findWithLikeCount(Number(limit), 0);

      return res.status(200).json({
        status: 'success',
        data: { mantras },
      });
    } catch (error) {
      logger.error('Get popular mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving popular mantras',
      });
    }
  },

  // GET /api/mantras/feed - Personalised feed based on user's category scores
  async getFeedMantras(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const mood = req.query.mood as string | undefined;

      // Get user's liked and saved mantra IDs for status flags
      let likedMantraIds: number[] = [];
      let savedMantraIds: number[] = [];

      if (userId) {
        const [liked, saved] = await Promise.all([
          db.selectFrom('Like').where('user_id', '=', userId).select('mantra_id').execute(),
          db
            .selectFrom('Collection')
            .innerJoin(
              'CollectionMantra',
              'Collection.collection_id',
              'CollectionMantra.collection_id',
            )
            .where('Collection.user_id', '=', userId)
            .select('CollectionMantra.mantra_id')
            .execute(),
        ]);
        likedMantraIds = liked.map((l) => l.mantra_id).filter((id): id is number => id !== null);
        savedMantraIds = [
          ...new Set(saved.map((s) => s.mantra_id).filter((id): id is number => id !== null)),
        ];
      }

      // Try personalised ordering when user is authenticated
      if (userId) {
        try {
          const { RecommendationEngine } = await import(
            '../services/recommendation-engine.service'
          );
          const recommendations = await RecommendationEngine.generateRecommendations(userId, {
            limit,
            mood,
          });

          if (recommendations.length > 0) {
            const mantraIds = recommendations.map((rec) => rec.mantra.mantra_id);
            const likeCounts = await LikeModel.getCountsByMantraIds(mantraIds);

            const feedMantras = recommendations.map((rec) => ({
              ...rec.mantra,
              like_count: likeCounts.get(rec.mantra.mantra_id) ?? 0,
              isLiked: likedMantraIds.includes(rec.mantra.mantra_id),
              isSaved: savedMantraIds.includes(rec.mantra.mantra_id),
              categories: rec.categories,
              score: Math.round(rec.score * 100) / 100,
              reason: rec.reason,
            }));

            return res.status(200).json({
              status: 'success',
              data: feedMantras,
            });
          }
        } catch {
          // Fall back to non-personalised feed if engine fails
        }
      }

      // Fallback: non-personalised (popularity-based) feed
      const mantras = await MantraModel.findWithLikeCount(limit, offset);

      const mantrasWithStatus = mantras.map((mantra) => ({
        ...mantra,
        isLiked: likedMantraIds.includes(mantra.mantra_id),
        isSaved: savedMantraIds.includes(mantra.mantra_id),
      }));

      return res.status(200).json({
        status: 'success',
        data: mantrasWithStatus,
      });
    } catch (error) {
      logger.error('Get feed mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving feed mantras',
      });
    }
  },

  // POST /api/mantras/:mantraId/save - Save mantra to user's "Saved Mantras" collection
  async saveMantra(req: Request, res: Response) {
    try {
      // 1. Check authentication
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // 2. Get mantra ID from URL
      const mantraId = Number(req.params.mantraId);

      // 3. Verify mantra exists
      const mantra = await MantraModel.findById(mantraId);
      if (!mantra) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

      // 4. Find or create "Saved Mantras" collection (lazy creation)
      const allCollections = await CollectionModel.findByUserId(userId);
      let savedCollection = allCollections.find((c) => c.name === 'Saved Mantras');

      savedCollection ??= await CollectionModel.create(
        userId,
        'Saved Mantras',
        'Your saved mantras',
      );

      // 5. Check if mantra is already saved (prevent duplicates)
      const isAlreadySaved = await CollectionModel.isMantraInCollection(
        savedCollection.collection_id,
        mantraId,
      );

      if (isAlreadySaved) {
        return res.status(200).json({
          status: 'success',
          message: 'Mantra already saved',
        });
      }

      // 6. Add mantra to collection
      await CollectionModel.addMantra(savedCollection.collection_id, mantraId, userId);

      // Update algorithm: +3 points for all categories of this mantra
      await UserCategoryScoreModel.addScoreForMantra(userId, mantraId, 3).catch((err) => {
        logger.error(
          'Failed to update category score for user:',
          sanitizeForLog(userId),
          'mantra:',
          sanitizeForLog(mantraId),
          err,
        );
      });

      // Invalidate caches for this user's feed, saved, and collections
      await cacheDelete(
        `cache:/api/mantras/feed:user:${userId}*`,
        `cache:/api/mantras/saved*user:${userId}*`,
        `cache:/api/collections*user:${userId}*`,
      );

      return res.status(200).json({
        status: 'success',
        message: 'Mantra saved successfully',
      });
    } catch (error) {
      logger.error('Save mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error saving mantra',
      });
    }
  },

  // DELETE /api/mantras/:mantraId/save - Remove mantra from ALL user's collections
  async unsaveMantra(req: Request, res: Response) {
    try {
      // 1. Check authentication
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // 2. Get mantra ID from URL
      const mantraId = Number(req.params.mantraId);

      // 3. UPDATED: Get ALL user's collections
      const allCollections = await CollectionModel.findByUserId(userId);

      if (allCollections.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No collections found',
        });
      }

      // 4. UPDATED: Remove mantra from ALL collections
      let removedCount = 0;
      for (const collection of allCollections) {
        const removed = await CollectionModel.removeMantra(collection.collection_id, mantraId);
        if (removed) {
          removedCount++;
        }
      }

      // Update algorithm: -3 points (undo save)
      if (removedCount > 0) {
        await UserCategoryScoreModel.removeScoreForMantra(userId, mantraId, 3).catch((err) => {
          logger.error(
            'Failed to remove category score for user:',
            sanitizeForLog(userId),
            'mantra:',
            sanitizeForLog(mantraId),
            err,
          );
        });
      }

      // 5. If not found in any collection, return error
      if (removedCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found in any collection',
        });
      }

      await cacheDelete(
        `cache:/api/mantras/feed:user:${userId}*`,
        `cache:/api/mantras/saved*user:${userId}*`,
        `cache:/api/collections*user:${userId}*`,
      );

      return res.status(200).json({
        status: 'success',
        message: 'Mantra unsaved successfully',
      });
    } catch (error) {
      logger.error('Unsave mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error unsaving mantra',
      });
    }
  },

  async getSavedMantras(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Find user's "Saved Mantras" collection
      const allCollections = await CollectionModel.findByUserId(userId);
      const savedCollection = allCollections.find((c) => c.name === 'Saved Mantras');

      if (!savedCollection) {
        return res.status(200).json({
          status: 'success',
          data: [],
        });
      }

      const mantras = await CollectionModel.getMantrasInCollection(savedCollection.collection_id);

      return res.status(200).json({
        status: 'success',
        data: mantras,
      });
    } catch (error) {
      logger.error('Get saved mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving saved mantras',
      });
    }
  },
};
