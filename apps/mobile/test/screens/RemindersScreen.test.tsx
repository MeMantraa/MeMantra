import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RemindersScreen from '../../screens/RemindersScreen';
import { reminderService } from '../../services/reminder.service';
import { storage } from '../../utils/storage';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

jest.mock('../../services/reminder.service', () => ({
  reminderService: {
    getReminders: jest.fn(),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
  },
}));

describe('RemindersScreen', () => {
  const mockReminders = [
    {
      reminder_id: 1,
      user_id: 1,
      mantra_id: 10,
      collection_id: null,
      journal_id: null,
      time: '2024-06-15T10:00:00Z',
      frequency: 'daily',
      status: 'active',
      last_sent_at: null,
      mantra_title: 'Be Present',
      collection_name: null,
      journal_title: null,
    },
    {
      reminder_id: 2,
      user_id: 1,
      mantra_id: null,
      collection_id: 5,
      journal_id: null,
      time: '2024-06-15T14:30:00Z',
      frequency: 'weekly',
      status: 'paused',
      last_sent_at: null,
      mantra_title: null,
      collection_name: 'Morning Mantras',
      journal_title: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('test-token');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
  });

  it('renders empty state when no reminders', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('No reminders yet')).toBeTruthy();
      expect(
        getByText(
          'Create a reminder to get notified about your favourite mantras, collections, or journal entries.',
        ),
      ).toBeTruthy();
      expect(getByText('Create Reminder')).toBeTruthy();
    });
  });

  it('loads and displays reminders', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
      expect(getByText('Morning Mantras')).toBeTruthy();
      expect(getByText('Mantra')).toBeTruthy();
      expect(getByText('Collection')).toBeTruthy();
    });
  });

  it('displays formatted frequency as capitalized string', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Daily')).toBeTruthy();
      expect(getByText('Weekly')).toBeTruthy();
    });
  });

  it('navigates to CreateReminder when add button is pressed', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Create Reminder')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Reminder'));

    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder');
  });

  it('shows error alert when loading fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (reminderService.getReminders as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<RemindersScreen />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading reminders:', expect.any(Error));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load reminders');
    });

    consoleErrorSpy.mockRestore();
  });

  it('returns early when token is null during load', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    render(<RemindersScreen />);

    await waitFor(() => {
      expect(reminderService.getReminders).not.toHaveBeenCalled();
    });
  });

  it('toggles reminder status from active to paused', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });
    (reminderService.updateReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: { ...mockReminders[0], status: 'paused' } },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Press the Pause button for the active reminder
    fireEvent.press(getByText('Pause'));

    await waitFor(() => {
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        1,
        { status: 'paused' },
        'test-token',
      );
    });
  });

  it('toggles reminder status from paused to active', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });
    (reminderService.updateReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: { ...mockReminders[1], status: 'active' } },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Morning Mantras')).toBeTruthy();
    });

    // Press the Resume button for the paused reminder
    fireEvent.press(getByText('Resume'));

    await waitFor(() => {
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        2,
        { status: 'active' },
        'test-token',
      );
    });
  });

  it('shows error alert when toggling status fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });
    (reminderService.updateReminder as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Pause'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating reminder:', expect.any(Error));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update reminder');
    });

    consoleErrorSpy.mockRestore();
  });

  it('returns early when token is null during toggle', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Set token to null for the toggle call
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    fireEvent.press(getByText('Pause'));

    await waitFor(() => {
      expect(reminderService.updateReminder).not.toHaveBeenCalled();
    });
  });

  it('shows delete confirmation alert', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });

    const { getAllByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getAllByText('Delete').length).toBeGreaterThan(0);
    });

    fireEvent.press(getAllByText('Delete')[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      expect.any(Array),
    );
  });

  it('deletes reminder when confirmed', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });
    (reminderService.deleteReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Deleted',
    });

    const { getAllByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getAllByText('Delete').length).toBeGreaterThan(0);
    });

    fireEvent.press(getAllByText('Delete')[0]);

    // Get the delete confirmation handler from the Alert call
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Delete Reminder',
    );
    const deleteButton = alertCall[2].find((btn: any) => btn.text === 'Delete');
    await deleteButton.onPress();

    await waitFor(() => {
      expect(reminderService.deleteReminder).toHaveBeenCalledWith(1, 'test-token');
    });
  });

  it('shows error alert when delete fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });
    (reminderService.deleteReminder as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const { getAllByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getAllByText('Delete').length).toBeGreaterThan(0);
    });

    fireEvent.press(getAllByText('Delete')[0]);

    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Delete Reminder',
    );
    const deleteButton = alertCall[2].find((btn: any) => btn.text === 'Delete');
    await deleteButton.onPress();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting reminder:', expect.any(Error));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete reminder');
    });

    consoleErrorSpy.mockRestore();
  });

  it('returns early when token is null during delete', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });

    const { getAllByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getAllByText('Delete').length).toBeGreaterThan(0);
    });

    // Set token to null for the delete call
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    fireEvent.press(getAllByText('Delete')[0]);

    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Delete Reminder',
    );
    const deleteButton = alertCall[2].find((btn: any) => btn.text === 'Delete');
    await deleteButton.onPress();

    await waitFor(() => {
      expect(reminderService.deleteReminder).not.toHaveBeenCalled();
    });
  });

  it('does not show action buttons for completed reminders', async () => {
    const completedReminder = {
      ...mockReminders[0],
      reminder_id: 99,
      status: 'completed',
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [completedReminder] },
    });

    const { getByText, queryByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Completed reminders should not have Pause/Resume or Delete buttons
    // The active reminder had "Pause", so with only completed there should be none
    expect(queryByText('Pause')).toBeNull();
    expect(queryByText('Resume')).toBeNull();
  });

  it('handles reminder with null frequency', async () => {
    const reminderNoFreq = {
      ...mockReminders[0],
      frequency: null,
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [reminderNoFreq] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Unknown')).toBeTruthy();
    });
  });

  it('handles reminder with null time', async () => {
    const reminderNoTime = {
      ...mockReminders[0],
      time: null,
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [reminderNoTime] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('No time set')).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { getByTestId } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('back-button'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('navigates to CreateReminder when header add button is pressed', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: mockReminders },
    });

    const { getByTestId } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByTestId('add-reminder-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('add-reminder-button'));

    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder');
  });

  it('handles reminder without linked name', async () => {
    const reminderNoName = {
      ...mockReminders[0],
      mantra_title: null,
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [reminderNoName] },
    });

    const { queryByText, getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Mantra')).toBeTruthy();
    });

    // "Be Present" should not be displayed since mantra_title is null
    expect(queryByText('Be Present')).toBeNull();
  });

  it('displays schedule times for routine reminders', async () => {
    const routineReminder = {
      reminder_id: 3,
      user_id: 1,
      mantra_id: 10,
      collection_id: null,
      time: null,
      frequency: 'routine',
      status: 'active',
      last_sent_at: null,
      mantra_title: 'Be Present',
      collection_name: null,
      schedule_times: ['07:00', '12:00'],
      schedule_days: [1, 2, 3, 4, 5],
      timezone: 'America/New_York',
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [routineReminder] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('7:00 AM, 12:00 PM')).toBeTruthy();
    });
  });

  it('displays journal type reminder correctly', async () => {
    const journalReminder = {
      reminder_id: 5,
      user_id: 1,
      mantra_id: null,
      collection_id: null,
      journal_id: 7,
      time: '2024-06-15T10:00:00Z',
      frequency: 'daily',
      status: 'active',
      last_sent_at: null,
      mantra_title: null,
      collection_name: null,
      journal_title: 'My Journal Entry',
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [journalReminder] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Journal')).toBeTruthy();
      expect(getByText('My Journal Entry')).toBeTruthy();
    });
  });

  it('displays journal reminder without title (no linked name shown)', async () => {
    const journalReminder = {
      reminder_id: 6,
      user_id: 1,
      mantra_id: null,
      collection_id: null,
      journal_id: 8,
      time: '2024-06-15T10:00:00Z',
      frequency: 'weekly',
      status: 'active',
      last_sent_at: null,
      mantra_title: null,
      collection_name: null,
      journal_title: null,
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [journalReminder] },
    });

    const { getByText, queryByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('Journal')).toBeTruthy();
    });

    // No linked name should be shown
    expect(queryByText('My Journal Entry')).toBeNull();
  });

  it('displays "No times set" for routine reminders without schedule_times', async () => {
    const routineReminder = {
      reminder_id: 4,
      user_id: 1,
      mantra_id: 10,
      collection_id: null,
      time: null,
      frequency: 'routine',
      status: 'active',
      last_sent_at: null,
      mantra_title: 'Be Present',
      collection_name: null,
      schedule_times: null,
      schedule_days: null,
      timezone: null,
    };

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [routineReminder] },
    });

    const { getByText } = render(<RemindersScreen />);

    await waitFor(() => {
      expect(getByText('No times set')).toBeTruthy();
    });
  });
});
