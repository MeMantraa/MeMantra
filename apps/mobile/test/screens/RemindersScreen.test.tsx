import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RemindersScreen from '../../screens/RemindersScreen';
import { useAllReminders, useUpdateReminder, useDeleteReminder } from '../../hooks';

jest.mock('../../hooks', () => ({
  useAllReminders: jest.fn(),
  useUpdateReminder: jest.fn(),
  useDeleteReminder: jest.fn(),
}));

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

jest.mock('../../services/schedule-suggestions.service', () => ({
  scheduleSuggestionsService: {
    formatTimeForDisplay: (t: string) => t,
    formatDaysForDisplay: () => 'Mon–Fri',
    formatTimezoneDisplay: (tz: string) => tz,
  },
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1a1a1a',
      primaryDark: '#2a2a2a',
      text: '#ffffff',
      secondary: '#ff9900',
    },
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

const mockRefetch = jest.fn();
const mockUpdateMutate = jest.fn();
const mockDeleteMutate = jest.fn();

const mockReminders = [
  {
    reminder_id: 1,
    user_id: 1,
    mantra_id: 10,
    collection_id: null,
    time: '2024-06-15T10:00:00Z',
    frequency: 'daily',
    status: 'active',
    last_sent_at: null,
    mantra_title: 'Be Present',
    collection_name: null,
  },
  {
    reminder_id: 2,
    user_id: 1,
    mantra_id: null,
    collection_id: 5,
    time: '2024-06-15T14:30:00Z',
    frequency: 'weekly',
    status: 'paused',
    last_sent_at: null,
    mantra_title: null,
    collection_name: 'Morning Mantras',
  },
];

describe('RemindersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useAllReminders as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { reminders: mockReminders } },
      isLoading: false,
      refetch: mockRefetch,
    });
    (useUpdateReminder as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    });
    (useDeleteReminder as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    });
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
  });

  it('renders empty state when no reminders', () => {
    (useAllReminders as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { reminders: [] } },
      isLoading: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<RemindersScreen />);
    expect(getByText('No reminders yet')).toBeTruthy();
    expect(
      getByText('Create a reminder to get notified about your favourite mantras or collections.'),
    ).toBeTruthy();
    expect(getByText('Create Reminder')).toBeTruthy();
  });

  it('loads and displays reminders', () => {
    const { getByText } = render(<RemindersScreen />);
    expect(getByText('Be Present')).toBeTruthy();
    expect(getByText('Morning Mantras')).toBeTruthy();
    expect(getByText('Mantra')).toBeTruthy();
    expect(getByText('Collection')).toBeTruthy();
  });

  it('displays formatted frequency', () => {
    const { getByText } = render(<RemindersScreen />);
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Weekly')).toBeTruthy();
  });

  it('navigates to CreateReminder when Create Reminder button pressed', () => {
    (useAllReminders as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { reminders: [] } },
      isLoading: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<RemindersScreen />);
    fireEvent.press(getByText('Create Reminder'));
    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder');
  });

  it('shows loading indicator when loading', () => {
    (useAllReminders as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetch,
    });
    const { UNSAFE_root } = render(<RemindersScreen />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('calls refetch on focus', () => {
    render(<RemindersScreen />);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('toggles reminder from active to paused', () => {
    const { getByText } = render(<RemindersScreen />);
    fireEvent.press(getByText('Pause'));
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { reminderId: 1, data: { status: 'paused' } },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('toggles reminder from paused to active', () => {
    const { getByText } = render(<RemindersScreen />);
    fireEvent.press(getByText('Resume'));
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { reminderId: 2, data: { status: 'active' } },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('shows error alert when toggle fails', () => {
    mockUpdateMutate.mockImplementation((_args: any, options: any) => {
      options?.onError?.();
    });
    const { getByText } = render(<RemindersScreen />);
    fireEvent.press(getByText('Pause'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update reminder');
  });

  it('shows delete confirmation alert', () => {
    const { getAllByText } = render(<RemindersScreen />);
    fireEvent.press(getAllByText('Delete')[0]);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      expect.any(Array),
    );
  });

  it('calls deleteReminder mutate when confirmed', () => {
    const { getAllByText } = render(<RemindersScreen />);
    fireEvent.press(getAllByText('Delete')[0]);
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Delete Reminder',
    );
    const deleteButton = alertCall[2].find((btn: any) => btn.text === 'Delete');
    deleteButton.onPress();
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it('shows error when delete fails', () => {
    mockDeleteMutate.mockImplementation((_id: any, options: any) => {
      options?.onError?.();
    });
    const { getAllByText } = render(<RemindersScreen />);
    fireEvent.press(getAllByText('Delete')[0]);
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Delete Reminder',
    );
    const deleteButton = alertCall[2].find((btn: any) => btn.text === 'Delete');
    deleteButton.onPress();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete reminder');
  });

  it('does not show action buttons for completed reminders', () => {
    const completedReminder = { ...mockReminders[0], reminder_id: 99, status: 'completed' };
    (useAllReminders as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { reminders: [completedReminder] } },
      isLoading: false,
      refetch: mockRefetch,
    });
    const { queryByText } = render(<RemindersScreen />);
    expect(queryByText('Pause')).toBeNull();
    expect(queryByText('Resume')).toBeNull();
  });

  it('handles null frequency', () => {
    const noFreq = { ...mockReminders[0], frequency: null };
    (useAllReminders as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { reminders: [noFreq] } },
      isLoading: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<RemindersScreen />);
    expect(getByText('Unknown')).toBeTruthy();
  });

  it('handles null time', () => {
    const noTime = { ...mockReminders[0], time: null };
    (useAllReminders as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { reminders: [noTime] } },
      isLoading: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<RemindersScreen />);
    expect(getByText('No time set')).toBeTruthy();
  });

  it('navigates back when back button pressed', async () => {
    const { getByTestId } = render(<RemindersScreen />);
    await waitFor(() => expect(getByTestId('back-button')).toBeTruthy());
    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('navigates to CreateReminder when header add button pressed', async () => {
    const { getByTestId } = render(<RemindersScreen />);
    await waitFor(() => expect(getByTestId('add-reminder-button')).toBeTruthy());
    fireEvent.press(getByTestId('add-reminder-button'));
    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder');
  });
});
