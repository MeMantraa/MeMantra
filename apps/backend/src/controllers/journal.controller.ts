import { Request, Response } from 'express';
import { JournalModel } from '../models/journal.model';
import { CreateJournalInput, UpdateJournalInput, JournalQueryInput } from '../validators/journal.validator';
import { UserCategoryScoreModel } from '../models/user-category-score.model';

export const JournalController = {
  // GET /api/journal - Get all journal entries for the authenticated user
  async getAllJournalEntries(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { search, mood, mantra_id, limit, offset } = req.query as unknown as JournalQueryInput;
      const limitNum = limit ? Number(limit) : 20;
      const offsetNum = offset ? Number(offset) : 0;

      let entries;

      if (search) {
        entries = await JournalModel.search(userId, search, limitNum);
      } else if (mood) {
        entries = await JournalModel.findByMood(userId, mood);
      } else if (mantra_id) {
        entries = await JournalModel.findByMantraId(Number(mantra_id), userId);
      } else {
        entries = await JournalModel.findByUserIdWithMantra(userId, limitNum, offsetNum);
      }

      const totalCount = await JournalModel.countByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: {
          entries,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            count: entries.length,
            total: totalCount,
          },
        },
      });
    } catch (error) {
      console.error('Get all journal entries error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving journal entries',
      });
    }
  },

  // GET /api/journal/:journalId - Get a single journal entry by ID
  async getJournalEntryById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { journalId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const entry = await JournalModel.findById(Number(journalId));

      if (!entry) {
        return res.status(404).json({
          status: 'error',
          message: 'Journal entry not found',
        });
      }

      if (entry.user_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { entry },
      });
    } catch (error) {
      console.error('Get journal entry by ID error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving journal entry',
      });
    }
  },

  // GET /api/journal/mantra/:mantraId - Get journal entries for a specific mantra
  async getJournalEntriesByMantra(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { mantraId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const entries = await JournalModel.findByMantraId(Number(mantraId), userId);

      return res.status(200).json({
        status: 'success',
        data: {
          entries,
          count: entries.length,
        },
      });
    } catch (error) {
      console.error('Get journal entries by mantra error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving journal entries',
      });
    }
  },

  // POST /api/journal - Create a new journal entry
  async createJournalEntry(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const journalData = req.body as CreateJournalInput;

      const newEntry = await JournalModel.create({
        ...journalData,
        user_id: userId,
      });

      // Update algorithm: +2 points for all categories of the mantra
      if (journalData.mantra_id) {
        await UserCategoryScoreModel.addScoreForMantra(userId, journalData.mantra_id, 2).catch(() => {});
      }

      return res.status(201).json({
        status: 'success',
        message: 'Journal entry created successfully',
        data: { entry: newEntry },
      });
    } catch (error) {
      console.error('Create journal entry error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating journal entry',
      });
    }
  },

  // PUT /api/journal/:journalId - Update a journal entry
  async updateJournalEntry(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { journalId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const updates = req.body as UpdateJournalInput;

      const updatedEntry = await JournalModel.update(Number(journalId), userId, updates);

      if (!updatedEntry) {
        return res.status(404).json({
          status: 'error',
          message: 'Journal entry not found or access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Journal entry updated successfully',
        data: { entry: updatedEntry },
      });
    } catch (error) {
      console.error('Update journal entry error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating journal entry',
      });
    }
  },

  // DELETE /api/journal/:journalId - Delete a journal entry
  async deleteJournalEntry(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { journalId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const deleted = await JournalModel.delete(Number(journalId), userId);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Journal entry not found or access denied',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Journal entry deleted successfully',
      });
    } catch (error) {
      console.error('Delete journal entry error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting journal entry',
      });
    }
  },

  // GET /api/journal/stats - Get journal statistics for the user
  async getJournalStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const totalEntries = await JournalModel.countByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: {
          totalEntries,
        },
      });
    } catch (error) {
      console.error('Get journal stats error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving journal statistics',
      });
    }
  },
};
