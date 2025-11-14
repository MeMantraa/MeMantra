import { Request, Response } from 'express';
import { MantraModel } from '../models/mantra.model';
import { CreateMantraInput, UpdateMantraInput, MantraQueryInput } from '../validators/mantra.validator';
import { db } from '../db';

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
      console.error('Get all mantras error:', error);
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
      console.error('Get mantra by ID error:', error);
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

      return res.status(201).json({
        status: 'success',
        message: 'Mantra created successfully',
        data: { mantra: newMantra },
      });
    } catch (error) {
      console.error('Create mantra error:', error);
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

      return res.status(200).json({
        status: 'success',
        message: 'Mantra updated successfully',
        data: { mantra: updatedMantra },
      });
    } catch (error) {
      console.error('Update mantra error:', error);
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

      return res.status(200).json({
        status: 'success',
        message: 'Mantra deleted successfully',
      });
    } catch (error) {
      console.error('Delete mantra error:', error);
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
      console.error('Get mantras by category error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantras by category',
      });
    }
  },

  // GET /api/mantras/popular - Get most liked mantras
  async getPopularMantras(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;

      const mantras = await MantraModel.findWithLikeCount(Number(limit));

      return res.status(200).json({
        status: 'success',
        data: { mantras },
      });
    } catch (error) {
      console.error('Get popular mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving popular mantras',
      });
    }
  },

  // GET /api/mantras/feed - Get mantras with user's like/save status
async getFeedMantras(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const mantras = await MantraModel.findAll(limit, offset);

    // Get user's liked and saved mantras
    let likedMantraIds: number[] = [];
    let savedMantraIds: number[] = [];

    if (userId) {
      const liked = await db
        .selectFrom('Like')
        .where('user_id', '=', userId)
        .select('mantra_id')
        .execute();
      likedMantraIds = liked.map(l => l.mantra_id).filter((id): id is number => id !== null);

      const saved = await db
        .selectFrom('Collection')
        .innerJoin('CollectionMantra', 'Collection.collection_id', 'CollectionMantra.collection_id')
        .where('Collection.user_id', '=', userId)
        .select('CollectionMantra.mantra_id')
        .execute();
      savedMantraIds = saved.map(s => s.mantra_id).filter((id): id is number => id !== null);
    }

    const mantrasWithStatus = mantras.map(mantra => ({
      ...mantra,
      isLiked: likedMantraIds.includes(mantra.mantra_id),
      isSaved: savedMantraIds.includes(mantra.mantra_id),
    }));

    return res.status(200).json({
      status: 'success',
      data: mantrasWithStatus,
    });
  } catch (error) {
    console.error('Get feed mantras error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving feed mantras',
    });
  }
},
};
