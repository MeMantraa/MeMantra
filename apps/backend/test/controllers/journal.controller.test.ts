import request from 'supertest';
import express from 'express';
import { JournalController } from '../../src/controllers/journal.controller';
import { JournalModel } from '../../src/models/journal.model';

jest.mock('../../src/models/journal.model');

function setupAppWithUser(userId?: number, email?: string) {
  const app = express();
  app.use(express.json());
  app.use((req: express.Request & { user?: { userId: number, email: string } }, _res, next) => {
    if (userId) req.user = { userId, email: email ?? '' };
    next();
  });
  app.get('/journals', JournalController.getAllJournalEntries);
  app.get('/journals/:journalId', JournalController.getJournalEntryById);
  app.get('/journals/mantra/:mantraId', JournalController.getJournalEntriesByMantra);
  app.post('/journals', JournalController.createJournalEntry);
  app.put('/journals/:journalId', JournalController.updateJournalEntry);
  app.delete('/journals/:journalId', JournalController.deleteJournalEntry);
  app.get('/journals/stats/summary', JournalController.getJournalStats);
  return app;
}

describe('JournalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Utility Helper Functions Coverage', () => {
    it('should test handleError utility', async () => {
      (JournalModel.findByUserIdWithMantra as jest.Mock).mockRejectedValue(new Error('Test error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving journal entries',
      });
    });

    it('should test requireAuth utility when user is not authenticated', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/journals');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should test ownership check when updating', async () => {
      (JournalModel.update as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/journals/999').send({ title: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found or access denied',
      });
    });

    it('should test ownership check when deleting', async () => {
      (JournalModel.delete as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/journals/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found or access denied',
      });
    });
  });

  describe('getAllJournalEntries', () => {
    it('should return all journal entries for authenticated user', async () => {
      const mockEntries = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Entry 1',
          content: 'Content 1',
          mood: 'happy',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          journal_id: 2,
          user_id: 1,
          title: 'Entry 2',
          content: 'Content 2',
          mood: 'calm',
          is_private: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (JournalModel.findByUserIdWithMantra as jest.Mock).mockResolvedValue(mockEntries);
      (JournalModel.countByUserId as jest.Mock).mockResolvedValue(2);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          entries: mockEntries,
          pagination: {
            limit: 20,
            offset: 0,
            count: 2,
            total: 2,
          },
        },
      });
      expect(JournalModel.findByUserIdWithMantra).toHaveBeenCalledWith(1, 20, 0);
      expect(JournalModel.countByUserId).toHaveBeenCalledWith(1);
    });

    it('should handle search query parameter', async () => {
      const mockEntries = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Meditation',
          content: 'Today I meditated',
          mood: 'calm',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (JournalModel.search as jest.Mock).mockResolvedValue(mockEntries);
      (JournalModel.countByUserId as jest.Mock).mockResolvedValue(1);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals?search=meditation');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.entries).toEqual(mockEntries);
      expect(JournalModel.search).toHaveBeenCalledWith(1, 'meditation', 20);
    });

    it('should handle mood query parameter', async () => {
      const mockEntries = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Happy Day',
          content: 'Feeling great',
          mood: 'happy',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (JournalModel.findByMood as jest.Mock).mockResolvedValue(mockEntries);
      (JournalModel.countByUserId as jest.Mock).mockResolvedValue(1);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals?mood=happy');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.entries).toEqual(mockEntries);
      expect(JournalModel.findByMood).toHaveBeenCalledWith(1, 'happy');
    });

    it('should handle mantra_id query parameter', async () => {
      const mockEntries = [
        {
          journal_id: 1,
          user_id: 1,
          mantra_id: 5,
          title: 'Mantra Reflection',
          content: 'Reflecting on my mantra',
          mood: 'peaceful',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (JournalModel.findByMantraId as jest.Mock).mockResolvedValue(mockEntries);
      (JournalModel.countByUserId as jest.Mock).mockResolvedValue(1);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals?mantra_id=5');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.entries).toEqual(mockEntries);
      expect(JournalModel.findByMantraId).toHaveBeenCalledWith(5, 1);
    });

    it('should handle pagination with limit and offset', async () => {
      const mockEntries = [
        {
          journal_id: 11,
          user_id: 1,
          title: 'Entry 11',
          content: 'Content 11',
          mood: 'neutral',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (JournalModel.findByUserIdWithMantra as jest.Mock).mockResolvedValue(mockEntries);
      (JournalModel.countByUserId as jest.Mock).mockResolvedValue(20);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals?limit=10&offset=10');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.entries).toEqual(mockEntries);
      expect(JournalModel.findByUserIdWithMantra).toHaveBeenCalledWith(1, 10, 10);
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/journals');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.findByUserIdWithMantra as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving journal entries',
      });
    });
  });

  describe('getJournalEntryById', () => {
    it('should return journal entry by id for owner', async () => {
      const mockEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'My Entry',
        content: 'My content',
        mood: 'happy',
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (JournalModel.findById as jest.Mock).mockResolvedValue(mockEntry);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          entry: mockEntry,
        },
      });
      expect(JournalModel.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when entry not found', async () => {
      (JournalModel.findById as jest.Mock).mockResolvedValue(null);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found',
      });
    });

    it('should return 403 when user is not the owner', async () => {
      const mockEntry = {
        journal_id: 1,
        user_id: 999,
        title: 'Not My Entry',
        content: 'Not my content',
        mood: 'happy',
        is_private: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (JournalModel.findById as jest.Mock).mockResolvedValue(mockEntry);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/1');

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Access denied',
      });
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/journals/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving journal entry',
      });
    });
  });

  describe('getJournalEntriesByMantra', () => {
    it('should return journal entries for a specific mantra', async () => {
      const mockEntries = [
        {
          journal_id: 1,
          user_id: 1,
          mantra_id: 5,
          title: 'Mantra Reflection',
          content: 'Reflecting on my mantra',
          mood: 'peaceful',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (JournalModel.findByMantraId as jest.Mock).mockResolvedValue(mockEntries);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/mantra/5');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          entries: mockEntries,
          count: 1,
        },
      });
      expect(JournalModel.findByMantraId).toHaveBeenCalledWith(5, 1);
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/journals/mantra/5');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.findByMantraId as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/mantra/5');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving journal entries',
      });
    });
  });

  describe('createJournalEntry', () => {
    it('should create a new journal entry with all fields', async () => {
      const newEntry = {
        title: 'New Entry',
        content: 'New content',
        mood: 'happy',
        mantra_id: 5,
        is_private: true,
      };

      const mockCreatedEntry = {
        journal_id: 1,
        user_id: 1,
        ...newEntry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (JournalModel.create as jest.Mock).mockResolvedValue(mockCreatedEntry);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/journals').send(newEntry);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Journal entry created successfully',
        data: {
          entry: mockCreatedEntry,
        },
      });
      expect(JournalModel.create).toHaveBeenCalledWith({
        ...newEntry,
        user_id: 1,
      });
    });

    it('should create a new journal entry with minimal fields', async () => {
      const newEntry = {
        title: 'Minimal Entry',
        content: 'Minimal content',
      };

      const mockCreatedEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'Minimal Entry',
        content: 'Minimal content',
        mood: null,
        mantra_id: null,
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (JournalModel.create as jest.Mock).mockResolvedValue(mockCreatedEntry);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/journals').send(newEntry);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Journal entry created successfully',
        data: {
          entry: mockCreatedEntry,
        },
      });
      expect(JournalModel.create).toHaveBeenCalledWith({
        ...newEntry,
        user_id: 1,
      });
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).post('/journals').send({
        title: 'Test',
        content: 'Test content',
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).post('/journals').send({
        title: 'Test',
        content: 'Test content',
      });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error creating journal entry',
      });
    });
  });

  describe('updateJournalEntry', () => {
    it('should update a journal entry', async () => {
      const updatedEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'New Title',
        content: 'New content',
        mood: 'excited',
        mantra_id: null,
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (JournalModel.update as jest.Mock).mockResolvedValue(updatedEntry);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/journals/1').send({
        title: 'New Title',
        content: 'New content',
        mood: 'excited',
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Journal entry updated successfully',
        data: {
          entry: updatedEntry,
        },
      });
      expect(JournalModel.update).toHaveBeenCalledWith(1, 1, {
        title: 'New Title',
        content: 'New content',
        mood: 'excited',
      });
    });

    it('should return 404 when entry not found or not owned', async () => {
      (JournalModel.update as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/journals/999').send({
        title: 'New Title',
      });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found or access denied',
      });
    });

    it('should return 404 when trying to update someone else\'s entry', async () => {
      (JournalModel.update as jest.Mock).mockResolvedValue(undefined);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/journals/1').send({
        title: 'Updated',
      });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found or access denied',
      });
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).put('/journals/1').send({
        title: 'New Title',
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).put('/journals/1').send({
        title: 'New Title',
      });

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error updating journal entry',
      });
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete a journal entry', async () => {
      (JournalModel.delete as jest.Mock).mockResolvedValue(true);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/journals/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        message: 'Journal entry deleted successfully',
      });
      expect(JournalModel.delete).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 when entry not found or not owned', async () => {
      (JournalModel.delete as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/journals/999');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found or access denied',
      });
    });

    it('should return 404 when trying to delete someone else\'s entry', async () => {
      (JournalModel.delete as jest.Mock).mockResolvedValue(false);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/journals/1');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Journal entry not found or access denied',
      });
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).delete('/journals/1');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).delete('/journals/1');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error deleting journal entry',
      });
    });
  });

  describe('getJournalStats', () => {
    it('should return journal statistics for user', async () => {
      const mockCount = 42;

      (JournalModel.countByUserId as jest.Mock).mockResolvedValue(mockCount);

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/stats/summary');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'success',
        data: {
          totalEntries: mockCount,
        },
      });
      expect(JournalModel.countByUserId).toHaveBeenCalledWith(1);
    });

    it('should require authentication', async () => {
      const app = setupAppWithUser();
      const res = await request(app).get('/journals/stats/summary');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Authentication required',
      });
    });

    it('should handle errors from model', async () => {
      (JournalModel.countByUserId as jest.Mock).mockRejectedValue(new Error('Database error'));

      const app = setupAppWithUser(1, 'test@test.com');
      const res = await request(app).get('/journals/stats/summary');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Error retrieving journal statistics',
      });
    });
  });
});
