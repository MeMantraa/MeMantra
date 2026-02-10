import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useReminders } from '../../hooks/useReminders';
import { reminderService } from '../../services/reminder.service';
import { storage } from '../../utils/storage';

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
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

jest.spyOn(Alert, 'alert');

describe('useReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('test-token');
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });
  });

  it('loads reminders on mount and populates maps', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        reminders: [
          { reminder_id: 1, mantra_id: 10, collection_id: null, status: 'active' },
          { reminder_id: 2, mantra_id: null, collection_id: 20, status: 'paused' },
          { reminder_id: 3, mantra_id: 30, collection_id: 40, status: 'active' },
        ],
      },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.remindersByMantra.size).toBe(2);
      expect(result.current.remindersByCollection.size).toBe(2);
    });

    expect(result.current.remindersByMantra.get(10)).toEqual({
      reminder_id: 1,
      status: 'active',
    });
    expect(result.current.remindersByMantra.get(30)).toEqual({
      reminder_id: 3,
      status: 'active',
    });
    expect(result.current.remindersByCollection.get(20)).toEqual({
      reminder_id: 2,
      status: 'paused',
    });
    expect(result.current.remindersByCollection.get(40)).toEqual({
      reminder_id: 3,
      status: 'active',
    });
  });

  it('does not load reminders when no token', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(storage.getToken).toHaveBeenCalled();
    });

    expect(result.current.remindersByMantra.size).toBe(0);
    expect(result.current.remindersByCollection.size).toBe(0);
  });

  it('handles getReminders failure gracefully', async () => {
    (reminderService.getReminders as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    expect(result.current.remindersByMantra.size).toBe(0);
    expect(result.current.remindersByCollection.size).toBe(0);
  });

  it('getReminderForMantra returns the correct reminder', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        reminders: [{ reminder_id: 5, mantra_id: 42, collection_id: null, status: 'active' }],
      },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.remindersByMantra.size).toBe(1);
    });

    expect(result.current.getReminderForMantra(42)).toEqual({
      reminder_id: 5,
      status: 'active',
    });
    expect(result.current.getReminderForMantra(999)).toBeUndefined();
  });

  it('getReminderForCollection returns the correct reminder', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        reminders: [{ reminder_id: 7, mantra_id: null, collection_id: 15, status: 'paused' }],
      },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.remindersByCollection.size).toBe(1);
    });

    expect(result.current.getReminderForCollection(15)).toEqual({
      reminder_id: 7,
      status: 'paused',
    });
    expect(result.current.getReminderForCollection(999)).toBeUndefined();
  });

  it('handleReminderPress navigates to CreateReminder when no reminder exists for mantra', async () => {
    const mockNavigate = jest.fn();
    const navigation = { navigate: mockNavigate };

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.handleReminderPress('mantra', 42, navigation);
    });

    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder', { mantraId: 42 });
  });

  it('handleReminderPress navigates to CreateReminder when no reminder exists for collection', async () => {
    const mockNavigate = jest.fn();
    const navigation = { navigate: mockNavigate };

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.handleReminderPress('collection', 15, navigation);
    });

    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder', { collectionId: 15 });
  });

  it('handleReminderPress shows alert when reminder exists', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        reminders: [{ reminder_id: 1, mantra_id: 10, collection_id: null, status: 'active' }],
      },
    });

    const mockNavigate = jest.fn();
    const navigation = { navigate: mockNavigate };

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.remindersByMantra.size).toBe(1);
    });

    act(() => {
      result.current.handleReminderPress('mantra', 10, navigation);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Reminder', undefined, expect.any(Array));

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    expect(buttons).toHaveLength(3);
    expect(buttons[0].text).toBe('Pause');
    expect(buttons[1].text).toBe('Delete');
    expect(buttons[2].text).toBe('Cancel');
  });

  it('showReminderActions shows Resume when reminder is paused', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        reminders: [{ reminder_id: 2, mantra_id: null, collection_id: 20, status: 'paused' }],
      },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.remindersByCollection.size).toBe(1);
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 2, status: 'paused' });
    });

    expect(Alert.alert).toHaveBeenCalledWith('Reminder', undefined, expect.any(Array));

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    expect(buttons[0].text).toBe('Resume');
  });

  it('showReminderActions Pause button updates reminder to paused', async () => {
    (reminderService.updateReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: {} },
    });
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 1, status: 'active' });
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const pauseButton = buttons[0];

    await act(async () => {
      pauseButton.onPress();
    });

    await waitFor(() => {
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        1,
        { status: 'paused' },
        'test-token',
      );
    });
  });

  it('showReminderActions Resume button updates reminder to active', async () => {
    (reminderService.updateReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: {} },
    });
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 2, status: 'paused' });
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const resumeButton = buttons[0];

    await act(async () => {
      resumeButton.onPress();
    });

    await waitFor(() => {
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        2,
        { status: 'active' },
        'test-token',
      );
    });
  });

  it('showReminderActions Delete button deletes reminder', async () => {
    (reminderService.deleteReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Deleted',
    });
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 3, status: 'active' });
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const deleteButton = buttons[1];

    await act(async () => {
      deleteButton.onPress();
    });

    await waitFor(() => {
      expect(reminderService.deleteReminder).toHaveBeenCalledWith(3, 'test-token');
    });
  });

  it('showReminderActions shows error alert when update fails', async () => {
    (reminderService.updateReminder as jest.Mock).mockRejectedValue(new Error('fail'));
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 1, status: 'active' });
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];

    await act(async () => {
      buttons[0].onPress();
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update reminder');
    });
  });

  it('showReminderActions shows error alert when delete fails', async () => {
    (reminderService.deleteReminder as jest.Mock).mockRejectedValue(new Error('fail'));
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 1, status: 'active' });
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];

    await act(async () => {
      buttons[1].onPress();
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete reminder');
    });
  });

  it('refresh triggers loadReminders again', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(reminderService.getReminders).toHaveBeenCalledTimes(2);
  });

  it('Pause/Resume does nothing when token is null at press time', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 1, status: 'active' });
    });

    // Token becomes null after the hook has loaded
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];

    await act(async () => {
      buttons[0].onPress();
    });

    expect(reminderService.updateReminder).not.toHaveBeenCalled();
  });

  it('Delete does nothing when token is null at press time', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    act(() => {
      result.current.showReminderActions({ reminder_id: 1, status: 'active' });
    });

    // Token becomes null after the hook has loaded
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];

    await act(async () => {
      buttons[1].onPress();
    });

    expect(reminderService.deleteReminder).not.toHaveBeenCalled();
  });

  it('does not update state when response status is not success', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'error',
      data: { reminders: [] },
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    expect(result.current.remindersByMantra.size).toBe(0);
    expect(result.current.remindersByCollection.size).toBe(0);
  });
});
