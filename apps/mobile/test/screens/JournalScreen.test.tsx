import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import React from 'react';
import JournalScreen from '../../screens/JournalScreen';
import { useJournalEntries, useDeleteJournalEntry } from '../../hooks';

jest.mock('../../hooks', () => ({
  useJournalEntries: jest.fn(),
  useDeleteJournalEntry: jest.fn(),
}));

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

const mockHandleReminderPress = jest.fn();
const mockRemindersByJournal = new Map();

jest.mock('../../hooks/useReminders', () => ({
  useReminders: () => ({
    remindersByMantra: new Map(),
    remindersByCollection: new Map(),
    remindersByJournal: mockRemindersByJournal,
    getReminderForMantra: jest.fn(),
    getReminderForCollection: jest.fn(),
    getReminderForJournal: jest.fn(),
    showReminderActions: jest.fn(),
    handleReminderPress: mockHandleReminderPress,
    refresh: jest.fn(),
  }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      primaryDark: '#111111',
      secondary: '#FF6B6B',
      text: '#FFFFFF',
      lightText: '#CCCCCC',
    },
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockRefetch = jest.fn();
const mockDeleteMutate = jest.fn();

const mockEntries = [
  {
    journal_id: 1,
    user_id: 1,
    mantra_id: 10,
    mantra_title: 'Peace Begins Within',
    title: 'Morning Reflection',
    content: 'Today I practiced mindfulness and felt great peace.',
    mood: 'calm',
    tags: ['mindfulness', 'peace'],
    is_private: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
  },
  {
    journal_id: 2,
    user_id: 1,
    mantra_id: null,
    title: 'Evening Thoughts',
    content: 'Reflecting on the day and feeling grateful.',
    mood: 'grateful',
    tags: ['gratitude'],
    is_private: false,
    created_at: '2024-01-14T20:00:00Z',
    updated_at: '2024-01-14T20:00:00Z',
  },
];

describe('JournalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useJournalEntries as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { entries: mockEntries, pagination: { total: 2 } } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    (useDeleteJournalEntry as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state when isLoading', () => {
    (useJournalEntries as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByTestId } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByTestId('journal-loading')).toBeTruthy();
  });

  it('loads and displays journal entries', () => {
    const { getByText } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByText('Morning Reflection')).toBeTruthy();
    expect(getByText('Evening Thoughts')).toBeTruthy();
    expect(getByText('Peace Begins Within')).toBeTruthy();
  });

  it('displays empty state when no entries exist', () => {
    (useJournalEntries as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { entries: [], pagination: { total: 0 } } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByText(/Start Your Journal/i)).toBeTruthy();
  });

  it('navigates to JournalEditor when create button is pressed', () => {
    (useJournalEntries as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { entries: [], pagination: { total: 0 } } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByTestId } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByTestId('create-journal-button')).toBeTruthy();
    fireEvent.press(getByTestId('create-journal-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEditor', {});
  });

  it('navigates to JournalDetail when entry is pressed', () => {
    const { getByText } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByText('Morning Reflection')).toBeTruthy();
    fireEvent.press(getByText('Morning Reflection').parent!);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalDetail', {
      entry: mockEntries[0],
    });
  });

  it('shows delete confirmation when delete button pressed', async () => {
    const { getAllByTestId } = render(<JournalScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getAllByTestId('delete-button').length).toBeGreaterThan(0));
    await act(async () => {
      fireEvent.press(getAllByTestId('delete-button')[0]);
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      expect.any(Array),
    );
  });

  it('calls deleteEntry mutate when confirmed', async () => {
    const { getAllByTestId } = render(<JournalScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getAllByTestId('delete-button').length).toBeGreaterThan(0));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) buttons[1].onPress();
    });

    await act(async () => {
      fireEvent.press(getAllByTestId('delete-button')[0]);
    });

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ onError: expect.any(Function) }),
      );
    });
    alertSpy.mockRestore();
  });

  it('shows error when delete fails', async () => {
    mockDeleteMutate.mockImplementation((_id: any, options: any) => {
      options?.onError?.();
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) buttons[1].onPress();
    });

    const { getAllByTestId } = render(<JournalScreen navigation={mockNavigation} />);
    await waitFor(() => expect(getAllByTestId('delete-button').length).toBeGreaterThan(0));
    await act(async () => {
      fireEvent.press(getAllByTestId('delete-button')[0]);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete journal entry');
    });
    alertSpy.mockRestore();
  });

  it('formats date correctly', () => {
    const { getByText } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByText(/Jan 15, 2024/i)).toBeTruthy();
  });

  it('displays mood emoji correctly', () => {
    const { getByText } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByText('😌')).toBeTruthy();
  });

  it('displays tags correctly', () => {
    const { getByText } = render(<JournalScreen navigation={mockNavigation} />);
    expect(getByText('#mindfulness')).toBeTruthy();
    expect(getByText('#peace')).toBeTruthy();
  });

  it('calls refetch on focus', () => {
    render(<JournalScreen navigation={mockNavigation} />);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
