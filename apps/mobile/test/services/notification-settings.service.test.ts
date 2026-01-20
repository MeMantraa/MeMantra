import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  notificationSettingsService,
  NotificationSettings,
} from '../../services/notification-settings.service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('notificationSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings when no settings are stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const settings = await notificationSettingsService.getSettings();

      expect(settings).toEqual({
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@memantra:notification_settings');
    });

    it('should return stored settings when available', async () => {
      const storedSettings: NotificationSettings = {
        enabled: false,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '08:00',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedSettings));

      const settings = await notificationSettingsService.getSettings();

      expect(settings).toEqual(storedSettings);
    });

    it('should return default settings on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const settings = await notificationSettingsService.getSettings();

      expect(settings).toEqual({
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });
    });
  });

  describe('saveSettings', () => {
    it('should save settings to storage', async () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      await notificationSettingsService.saveSettings(settings);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@memantra:notification_settings',
        JSON.stringify(settings),
      );
    });

    it('should throw error when save fails', async () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(notificationSettingsService.saveSettings(settings)).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('updateSettings', () => {
    it('should update specific settings', async () => {
      const currentSettings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(currentSettings));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const updatedSettings = await notificationSettingsService.updateSettings({
        quietHoursEnabled: true,
      });

      expect(updatedSettings).toEqual({
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@memantra:notification_settings',
        JSON.stringify({
          enabled: true,
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        }),
      );
    });

    it('should update multiple settings at once', async () => {
      const currentSettings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(currentSettings));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const updatedSettings = await notificationSettingsService.updateSettings({
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '08:00',
      });

      expect(updatedSettings).toEqual({
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '08:00',
      });
    });

    it('should throw error when update fails', async () => {
      const currentSettings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(currentSettings));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        notificationSettingsService.updateSettings({ quietHoursEnabled: true }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('resetSettings', () => {
    it('should remove settings from storage', async () => {
      await notificationSettingsService.resetSettings();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@memantra:notification_settings');
    });

    it('should throw error when reset fails', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Reset failed'));

      await expect(notificationSettingsService.resetSettings()).rejects.toThrow('Reset failed');
    });
  });

  describe('isWithinQuietHours', () => {
    it('should return false when quiet hours are disabled', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(false);
    });

    it('should return true when current time is within overnight quiet hours', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00', // 10 PM
        quietHoursEnd: '07:00', // 7 AM
      };

      // Mock current time to be 11 PM (23:00)
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(true);

      jest.restoreAllMocks();
    });

    it('should return true when current time is in early morning within quiet hours', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00', // 10 PM
        quietHoursEnd: '07:00', // 7 AM
      };

      // Mock current time to be 3 AM (03:00)
      const mockDate = new Date();
      mockDate.setHours(3, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(true);

      jest.restoreAllMocks();
    });

    it('should return false when current time is outside overnight quiet hours', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00', // 10 PM
        quietHoursEnd: '07:00', // 7 AM
      };

      // Mock current time to be 10 AM (10:00)
      const mockDate = new Date();
      mockDate.setHours(10, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(false);

      jest.restoreAllMocks();
    });

    it('should return true when current time is within same-day quiet hours', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '12:00', // 12 PM
        quietHoursEnd: '14:00', // 2 PM
      };

      // Mock current time to be 1 PM (13:00)
      const mockDate = new Date();
      mockDate.setHours(13, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(true);

      jest.restoreAllMocks();
    });

    it('should return false when current time is outside same-day quiet hours', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '12:00', // 12 PM
        quietHoursEnd: '14:00', // 2 PM
      };

      // Mock current time to be 3 PM (15:00)
      const mockDate = new Date();
      mockDate.setHours(15, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(false);

      jest.restoreAllMocks();
    });

    it('should handle edge case at exact start time', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      // Mock current time to be exactly 10 PM (22:00)
      const mockDate = new Date();
      mockDate.setHours(22, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(true);

      jest.restoreAllMocks();
    });

    it('should handle edge case at exact end time', () => {
      const settings: NotificationSettings = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      // Mock current time to be exactly 7 AM (07:00)
      const mockDate = new Date();
      mockDate.setHours(7, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const result = notificationSettingsService.isWithinQuietHours(settings);

      expect(result).toBe(false); // End time is exclusive

      jest.restoreAllMocks();
    });
  });

  describe('parseTimeString', () => {
    it('should parse time string correctly', () => {
      const result = notificationSettingsService.parseTimeString('22:30');

      expect(result).toEqual({ hours: 22, minutes: 30 });
    });

    it('should handle single digit hours and minutes', () => {
      const result = notificationSettingsService.parseTimeString('09:05');

      expect(result).toEqual({ hours: 9, minutes: 5 });
    });
  });

  describe('formatTimeString', () => {
    it('should format time range to string with padding', () => {
      const result = notificationSettingsService.formatTimeString({ hours: 9, minutes: 5 });

      expect(result).toBe('09:05');
    });

    it('should format time range without extra padding', () => {
      const result = notificationSettingsService.formatTimeString({ hours: 22, minutes: 30 });

      expect(result).toBe('22:30');
    });

    it('should handle midnight correctly', () => {
      const result = notificationSettingsService.formatTimeString({ hours: 0, minutes: 0 });

      expect(result).toBe('00:00');
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const defaults = notificationSettingsService.getDefaultSettings();

      expect(defaults).toEqual({
        enabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });
    });

    it('should return a copy of defaults (not reference)', () => {
      const defaults1 = notificationSettingsService.getDefaultSettings();
      const defaults2 = notificationSettingsService.getDefaultSettings();

      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2); // Different objects
    });
  });
});
