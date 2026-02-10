import { Router } from 'express';
import { JournalController } from '../controllers/journal.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createJournalSchema,
  updateJournalSchema,
  journalQuerySchema,
  journalIdSchema,
  mantraIdParamSchema,
} from '../validators/journal.validator';

const router = Router();

// auth for journal routes
router.use(authenticate);

// GET /api/journal/stats - Get journal statistics (must be before /:journalId)
router.get('/stats', JournalController.getJournalStats);

// GET /api/journal/mantra/:mantraId - Get journal entries for a specific mantra
router.get(
  '/mantra/:mantraId',
  validateRequest(mantraIdParamSchema),
  JournalController.getJournalEntriesByMantra
);

// GET /api/journal - Get all journal entries with filtering
router.get(
  '/',
  validateRequest(journalQuerySchema),
  JournalController.getAllJournalEntries
);

// GET /api/journal/:journalId - Get a single journal entry
router.get(
  '/:journalId',
  validateRequest(journalIdSchema),
  JournalController.getJournalEntryById
);

// POST /api/journal - Create a new journal entry
router.post(
  '/',
  validateRequest(createJournalSchema),
  JournalController.createJournalEntry
);

// PUT /api/journal/:journalId - Update a journal entry
router.put(
  '/:journalId',
  validateRequest(journalIdSchema),
  validateRequest(updateJournalSchema),
  JournalController.updateJournalEntry
);

// DELETE /api/journal/:journalId - Delete a journal entry
router.delete(
  '/:journalId',
  validateRequest(journalIdSchema),
  JournalController.deleteJournalEntry
);

export default router;
