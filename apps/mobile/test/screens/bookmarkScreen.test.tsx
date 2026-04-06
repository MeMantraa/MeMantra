import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BookmarkScreen from '../../screens/BookmarkScreen';
import { SavedProvider } from '../../context/SavedContext';
import { reminderService } from '../../services/reminder.service';
import { useCollectionById } from '../../hooks';

jest.mock('../../hooks', () => ({
  useCollectionById: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

jest.mock('../../services/reminder.service', () => ({
  reminderService: {
    getReminders: jest.fn().mockResolvedValue({ status: 'success', data: { reminders: [] } }),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
  },
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: { primary: '#1a1a1a', primaryDark: '#2a2a2a', text: '#ffffff', secondary: '#ff9900' },
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

const mockMantras = [
  {
    mantra_id: 1,
    title: 'Test Mantra 1',
    key_takeaway: 'Takeaway 1',
    created_at: '2024-01-01',
    is_active: true,
  },
  {
    mantra_id: 2,
    title: 'Test Mantra 2',
    key_takeaway: 'Takeaway 2',
    created_at: '2024-01-02',
    is_active: true,
  },
];

const mockRefetch = jest.fn();

describe('BookmarkScreen', () => {
  const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
  const mockRoute = { params: { collectionId: 123, collectionName: 'My Collection' } };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useCollectionById as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { mantras: mockMantras } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const renderScreen = () =>
    render(
      <SavedProvider>
        <BookmarkScreen navigation={mockNavigation} route={mockRoute} />
      </SavedProvider>,
    );

  it('renders the screen with collection title', () => {
    const { getByText } = renderScreen();
    expect(getByText('My Collection')).toBeTruthy();
  });

  it('displays empty state when no mantras', () => {
    (useCollectionById as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { mantras: [] } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = renderScreen();
    expect(getByText('No Mantras Yet')).toBeTruthy();
    expect(getByText('Save mantras to this collection to see them here')).toBeTruthy();
  });

  it('loads and displays mantras', () => {
    const { getByText } = renderScreen();
    expect(getByText('Test Mantra 1')).toBeTruthy();
    expect(getByText('Test Mantra 2')).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    (useCollectionById as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = renderScreen();
    expect(getByText('Loading mantras...')).toBeTruthy();
  });

  it('navigates to Focus screen when mantra is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Test Mantra 1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Focus', { mantra: mockMantras[0] });
  });

  it('truncates long mantra titles with numberOfLines prop', () => {
    const longTitleMantras = [
      {
        mantra_id: 3,
        title: 'This is a very long mantra title that should be truncated after three lines',
        key_takeaway: 'Takeaway',
        created_at: '2024-01-03',
        is_active: true,
      },
    ];
    (useCollectionById as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { mantras: longTitleMantras } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = renderScreen();
    const titleElement = getByText(longTitleMantras[0].title);
    expect(titleElement.props.numberOfLines).toBe(3);
  });

  it('calls goBack when back button is pressed (with mantras)', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('back-button'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('calls goBack when back button is pressed in loading state', () => {
    (useCollectionById as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('back-button-empty'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('calls refetch on pull-to-refresh', () => {
    const { getByTestId } = renderScreen();
    fireEvent(getByTestId('mantra-list'), 'refresh');
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('navigates to CreateReminder when mantra reminder pressed with no existing reminder', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('mantra-reminder-1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReminder', { mantraId: 1 });
  });

  it('navigates to CreateReminder when collection reminder pressed with no existing reminder', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('collection-reminder-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReminder', { collectionId: 123 });
  });
});
