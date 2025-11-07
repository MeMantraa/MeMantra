import { Request, Response } from 'express';
import { CollectionModel } from '../models/collection.model';
import { CreateCollectionInput, UpdateCollectionInput } from '../validators/collection.validator';

export const CollectionController = {
  // GET /api/collections - Get user's collections
  async getUserCollections(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const collections = await CollectionModel.findByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: { collections },
      });
    } catch (error) {
      console.error('Get user collections error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving collections',
      });
    }
  },

  // GET /api/collections/:id - Get collection with mantras
  async getCollectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const result = await CollectionModel.getCollectionWithMantras(Number(id));

      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      // Check if collection belongs to user
      if (result.collection.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('Get collection by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving collection',
      });
    }
  },

  // POST /api/collections - Create new collection
  async createCollection(req: Request, res: Response) {
    try {
      const collectionData = req.body as CreateCollectionInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const newCollection = await CollectionModel.create(
        userId,
        collectionData.name,
        collectionData.description
      );

      return res.status(201).json({
        status: 'success',
        message: 'Collection created successfully',
        data: { collection: newCollection },
      });
    } catch (error) {
      console.error('Create collection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating collection',
      });
    }
  },

  // PUT /api/collections/:id - Update collection
  async updateCollection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateCollectionInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const existingCollection = await CollectionModel.findById(Number(id));

      if (!existingCollection) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      // Check if collection belongs to user
      if (existingCollection.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const updatedCollection = await CollectionModel.update(Number(id), updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Collection updated successfully',
        data: { collection: updatedCollection },
      });
    } catch (error) {
      console.error('Update collection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating collection',
      });
    }
  },

  // DELETE /api/collections/:id - Delete collection
  async deleteCollection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const existingCollection = await CollectionModel.findById(Number(id));

      if (!existingCollection) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      // Check if collection belongs to user
      if (existingCollection.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      await CollectionModel.delete(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Collection deleted successfully',
      });
    } catch (error) {
      console.error('Delete collection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting collection',
      });
    }
  },

  // POST /api/collections/:id/mantras/:mantraId - Add mantra to collection
  async addMantraToCollection(req: Request, res: Response) {
    try {
      const { id, mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const collection = await CollectionModel.findById(Number(id));

      if (!collection) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      // Check if collection belongs to user
      if (collection.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      await CollectionModel.addMantra(Number(id), Number(mantraId), userId);

      return res.status(200).json({
        status: 'success',
        message: 'Mantra added to collection successfully',
      });
    } catch (error) {
      console.error('Add mantra to collection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error adding mantra to collection',
      });
    }
  },

  // DELETE /api/collections/:id/mantras/:mantraId - Remove mantra from collection
  async removeMantraFromCollection(req: Request, res: Response) {
    try {
      const { id, mantraId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const collection = await CollectionModel.findById(Number(id));

      if (!collection) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      // Check if collection belongs to user
      if (collection.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      await CollectionModel.removeMantra(Number(id), Number(mantraId));

      return res.status(200).json({
        status: 'success',
        message: 'Mantra removed from collection successfully',
      });
    } catch (error) {
      console.error('Remove mantra from collection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error removing mantra from collection',
      });
    }
  },
};
