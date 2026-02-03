import { journalService, MOOD_OPTIONS } from '../../services/journal.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('journalService', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getJournalEntries', () => {
    it('should fetch journal entries without query parameters', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [
            {
              journal_id: 1,
              user_id: 1,
              mantra_id: 10,
              title: 'Morning Reflection',
              content: 'Today I practiced mindfulness',
              mood: 'calm',
              tags: ['mindfulness', 'peace'],
              is_private: false,
              created_at: '2024-01-15T08:00:00Z',
              updated_at: '2024-01-15T08:00:00Z',
              mantra_title: 'Peace Begins Within',
            },
          ],
          pagination: {
            limit: 10,
            offset: 0,
            count: 1,
            total: 1,
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.getJournalEntries(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/journal', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data.entries).toHaveLength(1);
    });

    it('should fetch journal entries with search parameter', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [],
          pagination: { limit: 10, offset: 0, count: 0, total: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await journalService.getJournalEntries(mockToken, { search: 'mindfulness' });

      expect(apiClient.get).toHaveBeenCalledWith('/journal?search=mindfulness', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });

    it('should fetch journal entries with mood filter', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [],
          pagination: { limit: 10, offset: 0, count: 0, total: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await journalService.getJournalEntries(mockToken, { mood: 'calm' });

      expect(apiClient.get).toHaveBeenCalledWith('/journal?mood=calm', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });

    it('should fetch journal entries with mantra_id filter', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [],
          pagination: { limit: 10, offset: 0, count: 0, total: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await journalService.getJournalEntries(mockToken, { mantra_id: 42 });

      expect(apiClient.get).toHaveBeenCalledWith('/journal?mantra_id=42', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });

    it('should fetch journal entries with limit and offset', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [],
          pagination: { limit: 20, offset: 10, count: 0, total: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await journalService.getJournalEntries(mockToken, { limit: 20, offset: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/journal?limit=20&offset=10', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });

    it('should fetch journal entries with multiple filters', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [],
          pagination: { limit: 10, offset: 0, count: 0, total: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await journalService.getJournalEntries(mockToken, {
        search: 'peace',
        mood: 'calm',
        mantra_id: 10,
        limit: 5,
        offset: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/journal?search=peace&mood=calm&mantra_id=10&limit=5&offset=10',
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(journalService.getJournalEntries(mockToken)).rejects.toThrow('Network error');
    });
  });

  describe('getJournalEntryById', () => {
    it('should fetch a specific journal entry by ID', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entry: {
            journal_id: 1,
            user_id: 1,
            mantra_id: 10,
            title: 'Evening Reflection',
            content: 'Grateful for today',
            mood: 'grateful',
            tags: ['gratitude'],
            is_private: false,
            created_at: '2024-01-15T20:00:00Z',
            updated_at: '2024-01-15T20:00:00Z',
            mantra_title: 'Gratitude Changes Everything',
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.getJournalEntryById(1, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/journal/1', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data.entry.journal_id).toBe(1);
    });

    it('should handle not found error', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Entry not found'));

      await expect(journalService.getJournalEntryById(999, mockToken)).rejects.toThrow(
        'Entry not found',
      );
    });
  });

  describe('getJournalEntriesByMantra', () => {
    it('should fetch journal entries for a specific mantra', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [
            {
              journal_id: 1,
              user_id: 1,
              mantra_id: 10,
              title: 'Reflection on Peace',
              content: 'This mantra brought me peace',
              mood: 'calm',
              tags: ['peace'],
              is_private: false,
              created_at: '2024-01-15T08:00:00Z',
              updated_at: '2024-01-15T08:00:00Z',
              mantra_title: 'Peace Begins Within',
            },
          ],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.getJournalEntriesByMantra(10, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/journal/mantra/10', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data.entries[0].mantra_id).toBe(10);
    });

    it('should handle empty results for mantra', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          entries: [],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.getJournalEntriesByMantra(999, mockToken);

      expect(result.data.entries).toHaveLength(0);
    });
  });

  describe('createJournalEntry', () => {
    it('should create a journal entry with all fields', async () => {
      const payload = {
        title: 'New Entry',
        content: 'This is my journal entry',
        mood: 'happy' as const,
        tags: ['test', 'new'],
        mantra_id: 10,
        is_private: false,
      };

      const mockResponse = {
        status: 'success',
        message: 'Journal entry created successfully',
        data: {
          entry: {
            journal_id: 1,
            user_id: 1,
            ...payload,
            created_at: '2024-01-15T08:00:00Z',
            updated_at: '2024-01-15T08:00:00Z',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.createJournalEntry(payload, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/journal', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
    });

    it('should create a journal entry with only required content field', async () => {
      const payload = {
        content: 'Simple entry',
      };

      const mockResponse = {
        status: 'success',
        data: {
          entry: {
            journal_id: 2,
            user_id: 1,
            mantra_id: null,
            title: null,
            content: 'Simple entry',
            mood: null,
            tags: null,
            is_private: false,
            created_at: '2024-01-15T08:00:00Z',
            updated_at: '2024-01-15T08:00:00Z',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.createJournalEntry(payload, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/journal', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.status).toBe('success');
      expect(result.data.entry.content).toBe('Simple entry');
    });

    it('should handle validation errors', async () => {
      const payload = {
        content: '',
      };

      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Content is required'));

      await expect(journalService.createJournalEntry(payload, mockToken)).rejects.toThrow(
        'Content is required',
      );
    });
  });

  describe('updateJournalEntry', () => {
    it('should update a journal entry', async () => {
      const payload = {
        title: 'Updated Title',
        content: 'Updated content',
        mood: 'motivated' as const,
      };

      const mockResponse = {
        status: 'success',
        message: 'Journal entry updated successfully',
        data: {
          entry: {
            journal_id: 1,
            user_id: 1,
            mantra_id: null,
            title: 'Updated Title',
            content: 'Updated content',
            mood: 'motivated',
            tags: null,
            is_private: false,
            created_at: '2024-01-15T08:00:00Z',
            updated_at: '2024-01-15T09:00:00Z',
          },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.updateJournalEntry(1, payload, mockToken);

      expect(apiClient.put).toHaveBeenCalledWith('/journal/1', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data.entry.title).toBe('Updated Title');
    });

    it('should update only specific fields', async () => {
      const payload = {
        mood: 'calm' as const,
      };

      const mockResponse = {
        status: 'success',
        data: {
          entry: {
            journal_id: 1,
            user_id: 1,
            mantra_id: null,
            title: 'Original Title',
            content: 'Original content',
            mood: 'calm',
            tags: null,
            is_private: false,
            created_at: '2024-01-15T08:00:00Z',
            updated_at: '2024-01-15T09:00:00Z',
          },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.updateJournalEntry(1, payload, mockToken);

      expect(result.data.entry.mood).toBe('calm');
    });

    it('should handle update errors', async () => {
      const payload = {
        content: 'Updated',
      };

      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Entry not found'));

      await expect(journalService.updateJournalEntry(999, payload, mockToken)).rejects.toThrow(
        'Entry not found',
      );
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete a journal entry', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Journal entry deleted successfully',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.deleteJournalEntry(1, mockToken);

      expect(apiClient.delete).toHaveBeenCalledWith('/journal/1', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
    });

    it('should handle deletion errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Entry not found'));

      await expect(journalService.deleteJournalEntry(999, mockToken)).rejects.toThrow(
        'Entry not found',
      );
    });
  });

  describe('getJournalStats', () => {
    it('should fetch journal statistics', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          totalEntries: 42,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await journalService.getJournalStats(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/journal/stats', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data.totalEntries).toBe(42);
    });

    it('should handle stats errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await expect(journalService.getJournalStats(mockToken)).rejects.toThrow('Unauthorized');
    });
  });

  describe('MOOD_OPTIONS', () => {
    it('should export mood options array', () => {
      expect(MOOD_OPTIONS).toBeDefined();
      expect(Array.isArray(MOOD_OPTIONS)).toBe(true);
      expect(MOOD_OPTIONS.length).toBe(10);
    });

    it('should have correct mood structure', () => {
      MOOD_OPTIONS.forEach((mood) => {
        expect(mood).toHaveProperty('value');
        expect(mood).toHaveProperty('label');
        expect(mood).toHaveProperty('emoji');
        expect(typeof mood.value).toBe('string');
        expect(typeof mood.label).toBe('string');
        expect(typeof mood.emoji).toBe('string');
      });
    });

    it('should include all expected moods', () => {
      const moodValues = MOOD_OPTIONS.map((m) => m.value);
      expect(moodValues).toContain('happy');
      expect(moodValues).toContain('calm');
      expect(moodValues).toContain('grateful');
      expect(moodValues).toContain('motivated');
      expect(moodValues).toContain('anxious');
      expect(moodValues).toContain('sad');
      expect(moodValues).toContain('stressed');
      expect(moodValues).toContain('hopeful');
      expect(moodValues).toContain('reflective');
      expect(moodValues).toContain('neutral');
    });

    it('should have corresponding emojis for each mood', () => {
      const expectedEmojis = {
        happy: '😊',
        calm: '😌',
        grateful: '🙏',
        motivated: '💪',
        anxious: '😰',
        sad: '😢',
        stressed: '😫',
        hopeful: '🌟',
        reflective: '🤔',
        neutral: '😐',
      };

      MOOD_OPTIONS.forEach((mood) => {
        expect(mood.emoji).toBe(expectedEmojis[mood.value as keyof typeof expectedEmojis]);
      });
    });
  });
});
