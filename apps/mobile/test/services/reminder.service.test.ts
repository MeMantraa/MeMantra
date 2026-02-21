import { reminderService } from '../../services/reminder.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('reminderService', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReminders', () => {
    it('should fetch all reminders', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          reminders: [
            { reminder_id: 1, mantra_id: 1, collection_id: null, status: 'active' },
            { reminder_id: 2, mantra_id: null, collection_id: 5, status: 'paused' },
          ],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getReminders(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/reminders', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.reminders).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(reminderService.getReminders(mockToken)).rejects.toThrow('Network error');
    });
  });

  describe('getActiveReminders', () => {
    it('should fetch active reminders', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          reminders: [{ reminder_id: 1, mantra_id: 1, status: 'active' }],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getActiveReminders(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/reminders/active', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Server error'));

      await expect(reminderService.getActiveReminders(mockToken)).rejects.toThrow('Server error');
    });
  });

  describe('getUpcomingReminders', () => {
    it('should fetch upcoming reminders without hours parameter', async () => {
      const mockResponse = {
        status: 'success',
        data: { reminders: [] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getUpcomingReminders(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/reminders/upcoming', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch upcoming reminders with hours parameter', async () => {
      const mockResponse = {
        status: 'success',
        data: { reminders: [{ reminder_id: 3 }] },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getUpcomingReminders(mockToken, 24);

      expect(apiClient.get).toHaveBeenCalledWith('/reminders/upcoming?hours=24', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Timeout'));

      await expect(reminderService.getUpcomingReminders(mockToken)).rejects.toThrow('Timeout');
    });
  });

  describe('getReminderById', () => {
    it('should fetch a specific reminder', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          reminder: {
            reminder_id: 5,
            mantra_id: 1,
            collection_id: null,
            time: '2024-06-01T10:00:00Z',
            frequency: 'daily',
            status: 'active',
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getReminderById(5, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/reminders/5', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(reminderService.getReminderById(999, mockToken)).rejects.toThrow('Not found');
    });
  });

  describe('createReminder', () => {
    it('should create a reminder for a mantra', async () => {
      const input = {
        mantra_id: 1,
        time: '2024-06-01T10:00:00Z',
        frequency: 'daily' as const,
        status: 'active' as const,
      };

      const mockResponse = {
        status: 'success',
        data: {
          reminder: { reminder_id: 10, ...input },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.createReminder(input, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/reminders', input, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create a reminder for a collection', async () => {
      const input = {
        collection_id: 3,
        time: '2024-06-01T10:00:00Z',
        frequency: 'weekly' as const,
      };

      const mockResponse = {
        status: 'success',
        data: {
          reminder: { reminder_id: 11, ...input },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.createReminder(input, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/reminders', input, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      await expect(
        reminderService.createReminder(
          { time: '2024-06-01T10:00:00Z', frequency: 'daily' },
          mockToken,
        ),
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('updateReminder', () => {
    it('should update reminder status', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          reminder: { reminder_id: 5, status: 'paused' },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.updateReminder(5, { status: 'paused' }, mockToken);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/reminders/5',
        { status: 'paused' },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update reminder time and frequency', async () => {
      const updateData = { time: '2024-07-01T12:00:00Z', frequency: 'monthly' as const };
      const mockResponse = {
        status: 'success',
        data: {
          reminder: { reminder_id: 5, ...updateData },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.updateReminder(5, updateData, mockToken);

      expect(apiClient.put).toHaveBeenCalledWith('/reminders/5', updateData, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        reminderService.updateReminder(5, { status: 'paused' }, mockToken),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteReminder', () => {
    it('should delete a reminder', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Reminder deleted successfully',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.deleteReminder(5, mockToken);

      expect(apiClient.delete).toHaveBeenCalledWith('/reminders/5', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('Reminder deleted successfully');
    });

    it('should handle API errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(reminderService.deleteReminder(5, mockToken)).rejects.toThrow('Delete failed');
    });
  });

  describe('getSchedulePreview', () => {
    it('should post schedule preview data', async () => {
      const previewData = {
        schedule_times: ['07:00', '12:00'],
        schedule_days: [1, 2, 3, 4, 5],
        timezone: 'America/New_York',
      };
      const mockResponse = {
        status: 'success',
        data: {
          timezone: 'America/New_York',
          preview: [{ day: 'Monday, Jan 1', date: '2024-01-01', times: ['07:00', '12:00'] }],
          total_notifications_per_week: 10,
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getSchedulePreview(previewData, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/reminders/preview-schedule', previewData, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Server error'));

      await expect(
        reminderService.getSchedulePreview(
          { schedule_times: ['07:00'], timezone: 'UTC' },
          mockToken,
        ),
      ).rejects.toThrow('Server error');
    });
  });

  describe('getSuggestions', () => {
    it('should fetch suggestions', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          suggestions: {
            templates: [],
            recommended_times: ['07:00'],
            day_presets: [],
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await reminderService.getSuggestions(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/reminders/suggestions', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(reminderService.getSuggestions(mockToken)).rejects.toThrow('Network error');
    });
  });
});
