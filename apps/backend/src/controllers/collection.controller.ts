import { Request, Response } from 'express';
import { CollectionModel } from '../models/collection.model';
import { CreateCollectionInput, UpdateCollectionInput } from '../validators/collection.validator';

// --- Utility helpers ---
const handleError = (res: Response, message: string, error?: any, status = 500) => {
  console.error(message, error);
  return res.status(status).json({ status: 'error', message });
};

const requireAuth = (req: Request, res: Response): number | undefined => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
    return;
  }
  return userId;
};

const verifyOwnership = (
  res: Response,
  collection: any,
  userId: number
): boolean => {
  if (!collection) {
    res.status(404).json({
      status: 'error',
      message: 'Collection not found',
    });
    return false;
  }

  if (collection.user_id !== userId) {
    res.status(403).json({
      status: 'error',
      message: 'Access denied',
    });
    return false;
  }

  return true;
};

// --- Controller ---
export const CollectionController = {
  // GET /api/collections
  async getUserCollections(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const collections = await CollectionModel.findByUserId(userId);
      return res.status(200).json({
        status: 'success',
        data: { collections },
      });
    } catch (error) {
      return handleError(res, 'Error retrieving collections', error);
    }
  },

  // GET /api/collections/:id
  async getCollectionById(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { id } = req.params;
      const result = await CollectionModel.getCollectionWithMantras(Number(id));

      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      if (!verifyOwnership(res, result.collection, userId)) return;

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return handleError(res, 'Error retrieving collection', error);
    }
  },

  // POST /api/collections
  async createCollection(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const data = req.body as CreateCollectionInput;
      const newCollection = await CollectionModel.create(
        userId,
        data.name,
        data.description
      );

      return res.status(201).json({
        status: 'success',
        message: 'Collection created successfully',
        data: { collection: newCollection },
      });
    } catch (error) {
      return handleError(res, 'Error creating collection', error);
    }
  },

  // PUT /api/collections/:id
  async updateCollection(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { id } = req.params;
      const updateData = req.body as UpdateCollectionInput;
      const existingCollection = await CollectionModel.findById(Number(id));

      if (!verifyOwnership(res, existingCollection, userId)) return;

      const updatedCollection = await CollectionModel.update(
        Number(id),
        updateData
      );

      return res.status(200).json({
        status: 'success',
        message: 'Collection updated successfully',
        data: { collection: updatedCollection },
      });
    } catch (error) {
      return handleError(res, 'Error updating collection', error);
    }
  },

  // DELETE /api/collections/:id
  async deleteCollection(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { id } = req.params;
      const collection = await CollectionModel.findById(Number(id));

      if (!verifyOwnership(res, collection, userId)) return;

      await CollectionModel.delete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Collection deleted successfully',
      });
    } catch (error) {
      return handleError(res, 'Error deleting collection', error);
    }
  },

  // POST /api/collections/:id/mantras/:mantraId
  async addMantraToCollection(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { id, mantraId } = req.params;
      const collection = await CollectionModel.findById(Number(id));

      if (!verifyOwnership(res, collection, userId)) return;

      // CRITICAL: Check if mantra is already in collection BEFORE trying to insert
      const exists = await CollectionModel.isMantraInCollection(
        Number(id),
        Number(mantraId)
      );

      if (exists) {
        return res.status(200).json({
          status: 'success',
          message: 'Mantra already in collection',
          alreadyExists: true,
        });
      }

      await CollectionModel.addMantra(Number(id), Number(mantraId), userId);

      return res.status(200).json({
        status: 'success',
        message: 'Mantra added to collection successfully',
        alreadyExists: false,
      });
    } catch (error) {
      // Handle duplicate key error gracefully (backup check)
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as { code: string };
        if (pgError.code === '23505') { // PostgreSQL unique violation
          return res.status(200).json({
            status: 'success',
            message: 'Mantra already in collection',
            alreadyExists: true,
          });
        }
      }
      return handleError(res, 'Error adding mantra to collection', error);
    }
  },

  // DELETE /api/collections/:id/mantras/:mantraId
  async removeMantraFromCollection(req: Request, res: Response) {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const { id, mantraId } = req.params;
      const collection = await CollectionModel.findById(Number(id));

      if (!verifyOwnership(res, collection, userId)) return;

      const removed = await CollectionModel.removeMantra(Number(id), Number(mantraId));

      if (!removed) {
        return res.status(404).json({
          status: 'error',
          message: 'Mantra not found in collection',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Mantra removed from collection successfully',
      });
    } catch (error) {
      return handleError(res, 'Error removing mantra from collection', error);
    }
  },
};