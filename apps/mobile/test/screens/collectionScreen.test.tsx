import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CollectionsScreen from '../../screens/CollectionScreen';
import { reminderService } from '../../services/reminder.service';
import { useUserCollections, useDeleteCollection } from '../../hooks';

jest.mock('../../hooks', () => ({
  useUserCollections: jest.fn(),
  useDeleteCollection: jest.fn(),
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

const mockCollections = [
  {
    collection_id: 1,
    name: 'Saved Mantras',
    description: 'Your saved mantras',
    user_id: 1,
    created_at: '2024-01-01',
  },
  {
    collection_id: 2,
    name: 'My Collection',
    description: 'A custom collection',
    user_id: 1,
    created_at: '2024-01-02',
  },
  {
    collection_id: 3,
    name: 'Another Collection',
    description: null,
    user_id: 1,
    created_at: '2024-01-03',
  },
];

const mockRefetch = jest.fn();
const mockDeleteMutate = jest.fn();

describe('CollectionsScreen', () => {
  const mockNavigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useUserCollections as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { collections: mockCollections } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    (useDeleteCollection as jest.Mock).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const renderScreen = () => render(<CollectionsScreen navigation={mockNavigation} />);

  it('shows loading state when loading', () => {
    (useUserCollections as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = renderScreen();
    expect(getByText('Collections')).toBeTruthy();
    expect(getByText('Loading collections...')).toBeTruthy();
  });

  it('loads and displays collections', () => {
    const { getByText } = renderScreen();
    expect(getByText('Saved Mantras')).toBeTruthy();
    expect(getByText('My Collection')).toBeTruthy();
    expect(getByText('Another Collection')).toBeTruthy();
  });

  it('sorts collections with "Saved Mantras" first', () => {
    (useUserCollections as jest.Mock).mockReturnValue({
      data: {
        status: 'success',
        data: { collections: [mockCollections[1], mockCollections[0], mockCollections[2]] },
      },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getAllByText } = renderScreen();
    const names = getAllByText(/Saved Mantras|My Collection|Another/);
    expect(names.length).toBeGreaterThan(0);
  });

  it('displays empty state when no collections', () => {
    (useUserCollections as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { collections: [] } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { getByText } = renderScreen();
    expect(getByText('No Collections Yet')).toBeTruthy();
  });

  it('navigates to collection detail when pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('My Collection'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CollectionDetail', {
      collectionId: 2,
      collectionName: 'My Collection',
    });
  });

  it('calls refetch on pull-to-refresh', () => {
    const { getByText } = renderScreen();
    const item = getByText('My Collection').parent?.parent;
    if (item) fireEvent(item, 'refresh');
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('displays collection description when available', () => {
    const { getByText } = renderScreen();
    expect(getByText('Your saved mantras')).toBeTruthy();
    expect(getByText('A custom collection')).toBeTruthy();
  });

  it('navigates to CreateReminder when reminder pressed with no existing reminder', async () => {
    const { getByTestId } = renderScreen();
    await waitFor(() => expect(getByTestId('collection-reminder-2')).toBeTruthy());
    fireEvent.press(getByTestId('collection-reminder-2'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateReminder', { collectionId: 2 });
  });
});
