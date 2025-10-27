import { Request, Response } from 'express';
import { CollectionModel } from '../models/collection.model';
import { CreateCollectionInput, UpdateCollectionInput, AddMantraToCollectionInput } from '../validators/collection.validator';

export const CollectionController = {
  // Get all collections for the authenticated user
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

  // Get a single collection by ID with its mantras
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

      const collection = await CollectionModel.getCollectionWithMantras(Number(id));

      if (!collection) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

      // Check ownership
      if (collection.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { collection },
      });
    } catch (error) {
      console.error('Get collection by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving collection',
      });
    }
  },

  // Create a new collection
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

      const newCollection = await CollectionModel.create({
        ...collectionData,
        user_id: userId,
      });

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

  // Update a collection
  async updateCollection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateCollectionInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check ownership
      const isOwner = await CollectionModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const updatedCollection = await CollectionModel.update(Number(id), updates);

      if (!updatedCollection) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

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

  // Delete a collection
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

      // Check ownership
      const isOwner = await CollectionModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const success = await CollectionModel.delete(Number(id));

      if (!success) {
        return res.status(404).json({
          status: 'error',
          message: 'Collection not found',
        });
      }

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

  // Add a mantra to a collection
  async addMantraToCollection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { mantra_id } = req.body as AddMantraToCollectionInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check ownership
      const isOwner = await CollectionModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      // Check if mantra is already in collection
      const hasMantra = await CollectionModel.hasMantra(Number(id), mantra_id);
      if (hasMantra) {
        return res.status(400).json({
          status: 'error',
          message: 'Mantra already in collection',
        });
      }

      await CollectionModel.addMantra(Number(id), mantra_id);

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

  // Remove a mantra from a collection
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

      // Check ownership
      const isOwner = await CollectionModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const success = await CollectionModel.removeMantra(Number(id), Number(mantraId));

      if (!success) {
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
      console.error('Remove mantra from collection error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error removing mantra from collection',
      });
    }
  },

  // Get all mantras in a collection
  async getCollectionMantras(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check ownership
      const isOwner = await CollectionModel.isOwner(Number(id), userId);
      if (!isOwner) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const mantras = await CollectionModel.getMantras(Number(id));

      return res.status(200).json({
        status: 'success',
        data: { mantras },
      });
    } catch (error) {
      console.error('Get collection mantras error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving collection mantras',
      });
    }
  },
};
