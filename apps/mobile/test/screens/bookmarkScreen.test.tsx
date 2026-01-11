import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BookmarkScreen from '../../screens/bookmarkScreen';
import { storage } from '../../utils/storage';
import { SavedProvider } from '../../context/SavedContext';
import { collectionService } from '../../services/collection.service';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../services/collection.service', () => ({
  collectionService: {
    getCollectionById: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
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

describe('BookmarkScreen', () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();

  const mockNavigation = { navigate: mockNavigate, goBack: mockGoBack };

  const mockRoute = {
    params: {
      collectionId: 123,
      collectionName: 'My Collection',
    },
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('test-token');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
  });

  const renderScreen = () =>
    render(
      <SavedProvider>
        <BookmarkScreen navigation={mockNavigation} route={mockRoute} />
      </SavedProvider>,
    );

  it('renders the screen with collection title', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('My Collection')).toBeTruthy();
    });
  });

  it('displays empty state when no mantras', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('No Mantras Yet')).toBeTruthy();
      expect(getByText('Save mantras to this collection to see them here')).toBeTruthy();
    });
  });

  it('loads and displays mantras on mount', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockMantras },
    });

    const { getByText } = renderScreen();

    await waitFor(
      () => {
        expect(collectionService.getCollectionById).toHaveBeenCalledWith(123, 'test-token');
        expect(getByText('Test Mantra 1')).toBeTruthy();
        expect(getByText('Test Mantra 2')).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });

  it('uses fallback token when getToken returns null', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });

    renderScreen();

    await waitFor(() => {
      expect(collectionService.getCollectionById).toHaveBeenCalledWith(123, 'mock-token');
    });
  });

  it('handles error when loading mantras fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (collectionService.getCollectionById as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching collection mantras:',
        expect.any(Error),
      );
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load mantras');
      // After error, it should show empty state (mantras stays empty)
      expect(getByText('No Mantras Yet')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it('navigates to Focus screen when mantra is pressed', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockMantras },
    });

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Test Mantra 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Test Mantra 1'));

    expect(mockNavigate).toHaveBeenCalledWith('Focus', {
      mantra: mockMantras[0],
    });
  });

  it('truncates long mantra titles with numberOfLines prop', async () => {
    const longTitleMantras = [
      {
        mantra_id: 3,
        title: 'This is a very long mantra title that should be truncated after three lines',
        key_takeaway: 'Takeaway',
        created_at: '2024-01-03',
        is_active: true,
      },
    ];

    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: longTitleMantras },
    });

    const { getByText } = renderScreen();

    await waitFor(() => {
      const titleElement = getByText(longTitleMantras[0].title);
      expect(titleElement.props.numberOfLines).toBe(3);
    });
  });

  it('renders each mantra with correct styling', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockMantras },
    });

    const { getByText } = renderScreen();

    await waitFor(() => {
      const mantraText = getByText('Test Mantra 1');
      expect(mantraText.props.style).toBeDefined();
      expect(Array.isArray(mantraText.props.style)).toBe(true);
    });
  });

  it('calls goBack when back button is pressed (with mantras)', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockMantras },
    });

    const { getByTestId } = renderScreen();

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('back-button'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('calls goBack when back button is pressed (loading state)', async () => {
    // Keep the promise pending to keep loading state
    (collectionService.getCollectionById as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    const { getByText, getByTestId } = renderScreen();

    // Wait for the loading state to render
    await waitFor(() => {
      expect(getByText('Loading mantras...')).toBeTruthy();
    });

    // The back button should be present in the loading state
    const backButton = getByTestId('back-button-empty');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('refreshes mantras when pull-to-refresh is triggered', async () => {
    (collectionService.getCollectionById as jest.Mock)
      .mockResolvedValueOnce({
        status: 'success',
        data: { mantras: mockMantras },
      })
      .mockResolvedValueOnce({
        status: 'success',
        data: {
          mantras: [
            ...mockMantras,
            {
              mantra_id: 3,
              title: 'New Mantra',
              key_takeaway: 'New',
              created_at: '2024-01-03',
              is_active: true,
            },
          ],
        },
      });

    const { getByTestId } = renderScreen();

    await waitFor(() => {
      expect(getByTestId('mantra-list')).toBeTruthy();
    });

    // Trigger refresh
    const flatList = getByTestId('mantra-list');
    fireEvent(flatList, 'refresh');

    await waitFor(() => {
      expect(collectionService.getCollectionById).toHaveBeenCalledTimes(2);
    });
  });
});
