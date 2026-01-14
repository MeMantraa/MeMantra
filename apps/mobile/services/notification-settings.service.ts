import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@memantra:notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format (e.g., "22:00")
  quietHoursEnd: string; // HH:mm format (e.g., "07:00")
}

export interface TimeRange {
  hours: number;
  minutes: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00', // 10 PM
  quietHoursEnd: '07:00', // 7 AM
};

export const notificationSettingsService = {
  /**
   * Get notification settings from storage
   * @returns Current notification settings or defaults
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);

      if (!settingsJson) {
        return DEFAULT_SETTINGS;
      }

      const settings = JSON.parse(settingsJson) as NotificationSettings;
      return settings;
    } catch (error) {
      console.error('Error reading notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Save notification settings to storage
   * @param settings - Settings object to save
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      const settingsJson = JSON.stringify(settings);
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, settingsJson);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  },

  /**
   * Update specific notification settings
   * @param updates - Partial settings to update
   */
  async updateSettings(updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...updates };
      await this.saveSettings(newSettings);
      return newSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
    } catch (error) {
      console.error('Error resetting notification settings:', error);
      throw error;
    }
  },

  /**
   * Check if current time is within quiet hours
   * @param settings - Notification settings to check against
   * @returns True if within quiet hours, false otherwise
   */
  isWithinQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = settings.quietHoursEnd.split(':').map(Number);

    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTimeMinutes > endTimeMinutes) {
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
    }

    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  },

  /**
   * Parse time string to hours and minutes
   * @param timeString - Time in HH:mm format
   * @returns Object with hours and minutes
   */
  parseTimeString(timeString: string): TimeRange {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  },

  /**
   * Format time range object to string
   * @param time - Time range object
   * @returns Time string in HH:mm format
   */
  formatTimeString(time: TimeRange): string {
    const hoursStr = time.hours.toString().padStart(2, '0');
    const minutesStr = time.minutes.toString().padStart(2, '0');
    return `${hoursStr}:${minutesStr}`;
  },

  /**
   * Get default settings
   * @returns Default notification settings
   */
  getDefaultSettings(): NotificationSettings {
    return { ...DEFAULT_SETTINGS };
  },
};
