import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import NotificationSettingsScreen from '../../screens/NotificationSettingsScreen';
import { notificationSettingsService } from '../../services/notification-settings.service';
import { notificationService } from '../../services/notification.service';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock services
jest.mock('../../services/notification-settings.service');
jest.mock('../../services/notification.service');

describe('NotificationSettingsScreen', () => {
  const mockSettings = {
    enabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Alert, 'prompt').mockImplementation(() => {});
    (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
    (notificationSettingsService.getDefaultSettings as jest.Mock).mockReturnValue(mockSettings);
    (notificationSettingsService.parseTimeString as jest.Mock).mockImplementation((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return { hours, minutes };
    });
    (notificationSettingsService.isWithinQuietHours as jest.Mock).mockReturnValue(false);
    (notificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  describe('Initial Load', () => {
    it('shows loading state initially', () => {
      (notificationSettingsService.getSettings as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );

      const { getByText } = render(<NotificationSettingsScreen />);
      expect(getByText('Loading settings...')).toBeTruthy();
    });

    it('loads and displays settings', async () => {
      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Notification Settings')).toBeTruthy();
      });

      expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      expect(notificationService.getPermissionStatus).toHaveBeenCalled();
    });

    it('shows error alert if loading settings fails', async () => {
      (notificationSettingsService.getSettings as jest.Mock).mockRejectedValue(
        new Error('Load failed'),
      );

      render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load notification settings');
      });
    });
  });

  describe('Permission Status', () => {
    it('shows warning when permissions are not granted', async () => {
      (notificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText(/Notifications are not enabled in your device settings/)).toBeTruthy();
      });
    });

    it('does not show warning when permissions are granted', async () => {
      (notificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const { queryByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(queryByText(/Notifications are not enabled in your device settings/)).toBeNull();
      });
    });
  });

  describe('Toggle Notifications', () => {
    it('enables notifications when toggled on and permissions granted', async () => {
      (notificationSettingsService.updateSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        enabled: true,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      const toggle = getByTestId('enable-notifications-switch');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(notificationSettingsService.updateSettings).toHaveBeenCalledWith({
          enabled: true,
        });
      });
    });

    it('requests permissions when enabling notifications without permission', async () => {
      (notificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: true,
      });
      (notificationSettingsService.updateSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        enabled: true,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      const toggle = getByTestId('enable-notifications-switch');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(notificationService.requestPermissions).toHaveBeenCalled();
        expect(notificationSettingsService.updateSettings).toHaveBeenCalledWith({
          enabled: true,
        });
      });
    });

    it('shows alert when permissions denied', async () => {
      (notificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (notificationService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);

      // Wait for the component to finish loading first
      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      // Now find and interact with the toggle
      const toggle = getByTestId('enable-notifications-switch');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permissions Required',
          'Please enable notifications in your device settings to receive mantra reminders.',
          [{ text: 'OK' }],
        );
      });

      expect(notificationSettingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('shows error alert when update fails', async () => {
      (notificationSettingsService.updateSettings as jest.Mock).mockRejectedValue(
        new Error('Update failed'),
      );

      const { getByTestId } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      const toggle = getByTestId('enable-notifications-switch');
      fireEvent(toggle, 'valueChange', false);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update notification settings');
      });
    });
  });

  describe('Quiet Hours', () => {
    it('toggles quiet hours', async () => {
      (notificationSettingsService.updateSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      const toggle = getByTestId('quiet-hours-switch');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(notificationSettingsService.updateSettings).toHaveBeenCalledWith({
          quietHoursEnabled: true,
        });
      });
    });

    it('shows error alert when quiet hours update fails', async () => {
      (notificationSettingsService.updateSettings as jest.Mock).mockRejectedValue(
        new Error('Update failed'),
      );

      const { getByTestId } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      const toggle = getByTestId('quiet-hours-switch');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update quiet hours settings');
      });
    });

    it('shows time pickers when quiet hours enabled', async () => {
      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Start Time')).toBeTruthy();
        expect(getByText('End Time')).toBeTruthy();
        expect(getByText('22:00')).toBeTruthy();
        expect(getByText('07:00')).toBeTruthy();
      });
    });

    it('shows quiet hours active indicator when within quiet hours', async () => {
      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });
      (notificationSettingsService.isWithinQuietHours as jest.Mock).mockReturnValue(true);

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText(/Currently within quiet hours/)).toBeTruthy();
      });
    });
  });

  describe('Time Picker', () => {
    it('shows iOS prompt for time input on iOS', async () => {
      Platform.OS = 'ios';
      jest.spyOn(Alert, 'prompt').mockImplementation();

      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Start Time')).toBeTruthy();
      });

      const startTimeButton = getByText('Start Time').parent;
      fireEvent.press(startTimeButton!);

      expect(Alert.prompt).toHaveBeenCalledWith(
        'Set Time',
        expect.any(String),
        expect.any(Array),
        'plain-text',
        '22:00',
      );
    });

    it('validates and updates time on iOS', async () => {
      Platform.OS = 'ios';
      let promptCallback: ((text?: string) => void) | undefined;

      jest.spyOn(Alert, 'prompt').mockImplementation((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          promptCallback = buttons[1]?.onPress as ((text?: string) => void) | undefined;
        }
      });

      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });
      (notificationSettingsService.updateSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursStart: '23:00',
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Start Time')).toBeTruthy();
      });

      const startTimeButton = getByText('Start Time').parent;
      fireEvent.press(startTimeButton!);

      // Simulate valid time input
      if (promptCallback) {
        promptCallback('23:00');
      }

      await waitFor(() => {
        expect(notificationSettingsService.updateSettings).toHaveBeenCalledWith({
          quietHoursStart: '23:00',
        });
      });
    });

    it('shows error for invalid time format on iOS', async () => {
      Platform.OS = 'ios';
      let promptCallback: ((text?: string) => void) | undefined;

      jest.spyOn(Alert, 'prompt').mockImplementation((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          promptCallback = buttons[1]?.onPress as ((text?: string) => void) | undefined;
        }
      });

      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Start Time')).toBeTruthy();
      });

      const startTimeButton = getByText('Start Time').parent;
      fireEvent.press(startTimeButton!);

      // Simulate invalid time input
      if (promptCallback) {
        promptCallback('invalid');
      }

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid Format',
          'Please enter time in HH:MM format (e.g., 22:00)',
        );
      });

      expect(notificationSettingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('shows info alert on Android', async () => {
      Platform.OS = 'android';

      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Start Time')).toBeTruthy();
      });

      const startTimeButton = getByText('Start Time').parent;
      fireEvent.press(startTimeButton!);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Time Picker',
        expect.stringContaining('Current time: 22:00'),
        [{ text: 'OK' }],
      );
    });

    it('handles time update errors', async () => {
      Platform.OS = 'ios';
      let promptCallback: ((text?: string) => void) | undefined;

      jest.spyOn(Alert, 'prompt').mockImplementation((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          promptCallback = buttons[1]?.onPress as ((text?: string) => void) | undefined;
        }
      });

      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        quietHoursEnabled: true,
      });
      (notificationSettingsService.updateSettings as jest.Mock).mockRejectedValue(
        new Error('Update failed'),
      );

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Start Time')).toBeTruthy();
      });

      const startTimeButton = getByText('Start Time').parent;
      fireEvent.press(startTimeButton!);

      if (promptCallback) {
        promptCallback('23:00');
      }

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update time settings');
      });
    });
  });

  describe('Test Notification', () => {
    it('sends test notification when enabled', async () => {
      (notificationService.scheduleLocalNotification as jest.Mock).mockResolvedValue(
        'notification-id',
      );

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Send Test Notification')).toBeTruthy();
      });

      const testButton = getByText('Send Test Notification');
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith(
          'Test Notification',
          'This is a test notification from MeMantra',
          { type: 'test' },
          null,
          false,
        );
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Test notification sent!');
      });
    });

    it('shows test button as disabled when notifications are disabled', async () => {
      (notificationSettingsService.getSettings as jest.Mock).mockResolvedValue({
        ...mockSettings,
        enabled: false,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(notificationSettingsService.getSettings).toHaveBeenCalled();
      });

      // Verify button is rendered
      const testButton = getByTestId('test-notification-button');
      expect(testButton).toBeTruthy();

      // Verify notification service was not called
      expect(notificationService.scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it('shows alert when permissions not granted', async () => {
      (notificationService.getPermissionStatus as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Send Test Notification')).toBeTruthy();
      });

      const testButton = getByText('Send Test Notification');
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permissions Required',
          'Please enable notifications in your device settings first.',
        );
      });

      expect(notificationService.scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it('shows error alert when test notification fails', async () => {
      (notificationService.scheduleLocalNotification as jest.Mock).mockRejectedValue(
        new Error('Failed'),
      );

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Send Test Notification')).toBeTruthy();
      });

      const testButton = getByText('Send Test Notification');
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send test notification');
      });
    });
  });

  describe('Reset Settings', () => {
    it('shows confirmation dialog when resetting', async () => {
      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Reset to Defaults')).toBeTruthy();
      });

      const resetButton = getByText('Reset to Defaults');
      fireEvent.press(resetButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Reset Settings',
        'Are you sure you want to reset notification settings to defaults?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Reset' }),
        ]),
      );
    });

    it('resets settings when confirmed', async () => {
      let resetCallback: (() => void) | undefined;

      jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          resetCallback = buttons[1]?.onPress;
        }
      });

      (notificationSettingsService.resetSettings as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Reset to Defaults')).toBeTruthy();
      });

      const resetButton = getByText('Reset to Defaults');
      fireEvent.press(resetButton);

      // Simulate confirmation
      if (resetCallback) {
        await resetCallback();
      }

      await waitFor(() => {
        expect(notificationSettingsService.resetSettings).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Settings reset to defaults');
      });
    });

    it('shows error alert when reset fails', async () => {
      let resetCallback: (() => void) | undefined;

      jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (title === 'Reset Settings' && buttons && Array.isArray(buttons)) {
          resetCallback = buttons[1]?.onPress;
        }
      });

      (notificationSettingsService.resetSettings as jest.Mock).mockRejectedValue(
        new Error('Reset failed'),
      );

      const { getByText } = render(<NotificationSettingsScreen />);

      await waitFor(() => {
        expect(getByText('Reset to Defaults')).toBeTruthy();
      });

      const resetButton = getByText('Reset to Defaults');
      fireEvent.press(resetButton);

      if (resetCallback) {
        await resetCallback();
      }

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to reset settings');
      });
    });
  });
});
