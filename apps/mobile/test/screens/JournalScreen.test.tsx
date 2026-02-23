import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import React from 'react';
import JournalScreen from '../../screens/JournalScreen';
import { journalService } from '../../services/journal.service';
import { storage } from '../../utils/storage';

// Mock dependencies
jest.mock('../../services/journal.service', () => ({
  ...jest.requireActual('../../services/journal.service'),
  journalService: {
    getJournalEntries: jest.fn(),
    getJournalEntry: jest.fn(),
    createJournalEntry: jest.fn(),
    updateJournalEntry: jest.fn(),
    deleteJournalEntry: jest.fn(),
  },
}));
jest.mock('../../utils/storage');
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

describe('JournalScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {};

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

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons.length > 0) {
        // Auto-press the first button for testing
        const button = buttons[0];
        if (button.onPress) button.onPress();
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    (journalService.getJournalEntries as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const { getByTestId } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    expect(getByTestId('journal-loading')).toBeTruthy();
  });

  it('loads and displays journal entries successfully', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        entries: mockEntries,
        pagination: { total: 2, page: 1, limit: 10, pages: 1 },
      },
    });

    const { getByText, findByText } = render(
      <JournalScreen navigation={mockNavigation} route={mockRoute} />,
    );

    // Wait for journal entries to load
    await findByText('Morning Reflection');

    expect(getByText('Morning Reflection')).toBeTruthy();
    expect(getByText('Evening Thoughts')).toBeTruthy();
    expect(getByText('Peace Begins Within')).toBeTruthy();
  });

  it('navigates to Login when no token is found', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  it('shows error alert when loading entries fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (journalService.getJournalEntries as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to load journal entries');
    });
  });

  it('displays empty state when no entries exist', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        entries: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 },
      },
    });

    const { getByText } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(getByText(/Start Your Journal/i)).toBeTruthy();
    });
  });

  it('navigates to JournalEditor when create button is pressed', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: [], pagination: { total: 0 } },
    });

    const { getByTestId } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(getByTestId('create-journal-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('create-journal-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEditor', {});
  });

  it('navigates to JournalDetail when entry is pressed', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: mockEntries, pagination: { total: 2 } },
    });

    const { getByText } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(getByText('Morning Reflection')).toBeTruthy();
    });

    fireEvent.press(getByText('Morning Reflection').parent!);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalDetail', {
      entry: mockEntries[0],
    });
  });

  it('deletes entry when delete is confirmed', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: mockEntries, pagination: { total: 2 } },
    });
    (journalService.deleteJournalEntry as jest.Mock).mockResolvedValue({
      status: 'success',
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Call the delete button (second button)
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const { getAllByTestId } = render(
      <JournalScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getAllByTestId('delete-button').length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(getAllByTestId('delete-button')[0]);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
      expect(journalService.deleteJournalEntry).toHaveBeenCalledWith(1, 'mock-token');
    });
  });

  it('shows error when delete fails', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: mockEntries, pagination: { total: 2 } },
    });
    (journalService.deleteJournalEntry as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementationOnce((title, message, buttons) => {
        // First call - delete confirmation
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      })
      .mockImplementationOnce(() => {
        // Second call - error alert
      });

    const { getAllByTestId } = render(
      <JournalScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getAllByTestId('delete-button').length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(getAllByTestId('delete-button')[0]);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to delete journal entry');
    });
  });

  it('formats date correctly', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: mockEntries, pagination: { total: 2 } },
    });

    const { getByText } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(getByText(/Jan 15, 2024/i)).toBeTruthy();
    });
  });

  it('displays mood emoji correctly', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: mockEntries, pagination: { total: 2 } },
    });

    const { getByText } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      // Calm mood should show 😌 emoji
      expect(getByText('😌')).toBeTruthy();
    });
  });

  it('displays tags correctly', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: mockEntries, pagination: { total: 2 } },
    });

    const { getByText } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(getByText('#mindfulness')).toBeTruthy();
      expect(getByText('#peace')).toBeTruthy();
    });
  });

  it('truncates long content', async () => {
    const longContentEntry = {
      ...mockEntries[0],
      content: 'A'.repeat(200),
    };

    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { entries: [longContentEntry], pagination: { total: 1 } },
    });

    const { getByText } = render(<JournalScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      const truncatedText = getByText(/A{100,150}/);
      expect(truncatedText).toBeTruthy();
    });
  });
});
