import { Request, Response } from 'express';
import { MantraModel } from '../models/mantra.model';
import { CreateMantraInput, UpdateMantraInput } from '../validators/mantra.validator';

export const MantraController = {
  // Get all mantras with pagination and optional filtering
  async listMantras(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, category_id, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let mantras;

      if (search && typeof search === 'string') {
        // Search by title or key takeaway
        mantras = await MantraModel.search(search, Number(limit));
      } else if (category_id) {
        // Filter by category
        mantras = await MantraModel.findByCategory(Number(category_id));
      } else {
        // Get all active mantras
        mantras = await MantraModel.findAll(Number(limit), offset);
      }

      return res.status(200).json({
        status: 'success',
        data: {
          mantras,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: mantras.length,
          },
        },
      });
    } catch (error) {
      console.error('List mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving mantras',
      });
    }
  },

  // Get a single mantra by ID
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

  // Create a new mantra (admin only - add admin check middleware to route)
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

      // Extract category_ids if present
      const { category_ids, ...mantraFields } = mantraData;

      // Create the mantra
      const newMantra = await MantraModel.create({
        ...mantraFields,
        created_by: userId,
      });

      // TODO: Add mantra to categories if category_ids provided
      // This requires a MantraCategoryModel or additional method in MantraModel

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

  // Update a mantra (admin only)
  async updateMantra(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateMantraInput;

      const updatedMantra = await MantraModel.update(Number(id), updates);

      if (!updatedMantra) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

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

  // Soft delete a mantra (admin only)
  async deleteMantra(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const success = await MantraModel.softDelete(Number(id));

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found',
        });
      }

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

  // Search mantras
  async searchMantras(req: Request, res: Response) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Search query is required',
        });
      }

      const mantras = await MantraModel.search(q, Number(limit));

      return res.status(200).json({
        status: 'success',
        data: { mantras, count: mantras.length },
      });
    } catch (error) {
      console.error('Search mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error searching mantras',
      });
    }
  },

  // Get popular mantras (most liked)
  async getPopularMantras(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;

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
};
