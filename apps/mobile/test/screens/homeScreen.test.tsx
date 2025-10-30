import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../../screens/homeScreen';
import { Mantra } from '../../services/mantra.service';

const mockGetFeedMantras = jest.fn();
const mockLikeMantra = jest.fn().mockResolvedValue({ status: 'success' });
const mockUnlikeMantra = jest.fn().mockResolvedValue({ status: 'success' });
const mockSaveMantra = jest.fn().mockResolvedValue({ status: 'success' });
const mockUnsaveMantra = jest.fn().mockResolvedValue({ status: 'success' });
const mockGetToken = jest.fn();

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getFeedMantras: (...args: unknown[]) => mockGetFeedMantras(...args),
    likeMantra: (...args: unknown[]) => mockLikeMantra(...args),
    unlikeMantra: (...args: unknown[]) => mockUnlikeMantra(...args),
    saveMantra: (...args: unknown[]) => mockSaveMantra(...args),
    unsaveMantra: (...args: unknown[]) => mockUnsaveMantra(...args),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
  },
}));

jest.mock('../../components/carousel', () => {
  const React = jest.requireActual('react');
  const { Text, TouchableOpacity, View } = jest.requireActual('react-native');
  return ({ item, onLike, onSave }: any) =>
    React.createElement(
      View,
      null,
      React.createElement(Text, null, item.title),
      React.createElement(
        TouchableOpacity,
        { testID: `mock-like-${item.mantra_id}`, onPress: () => onLike(item.mantra_id) },
        React.createElement(Text, null, 'Like'),
      ),
      React.createElement(
        TouchableOpacity,
        { testID: `mock-save-${item.mantra_id}`, onPress: () => onSave(item.mantra_id) },
        React.createElement(Text, null, 'Save'),
      ),
    );
});

describe('HomeScreen', () => {
  const mantra: Mantra = {
    mantra_id: 10,
    title: 'Stay Focused',
    key_takeaway: 'Concentrate on the task in front of you.',
    created_at: '2024-01-01T00:00:00Z',
    is_active: true,
    isLiked: false,
    isSaved: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-123');
    mockGetFeedMantras.mockResolvedValue({ status: 'success', data: [mantra] });
  });

  it('shows loading state while fetching data', async () => {
    let resolveMantras: (value: unknown) => void = () => {};
    mockGetFeedMantras.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveMantras = resolve;
        }),
    );

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Loading mantras...')).toBeTruthy();

    await act(async () => {
      resolveMantras({ status: 'success', data: [] });
    });
  });

  it('renders the empty state when no mantras are returned', async () => {
    mockGetFeedMantras.mockResolvedValueOnce({ status: 'success', data: [] });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('No mantras available')).toBeTruthy();
    });

    fireEvent.press(getByText('Refresh'));
    await waitFor(() => expect(mockGetFeedMantras).toHaveBeenCalledTimes(2));
  });

  it('loads mantras and handles like/save interactions', async () => {
    const { getByText, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Stay Focused')).toBeTruthy();
    });

    fireEvent.press(getByTestId('mock-like-10'));
    await waitFor(() => {
      expect(mockLikeMantra).toHaveBeenCalledWith(10, 'token-123');
    });

    fireEvent.press(getByTestId('mock-like-10'));
    await waitFor(() => {
      expect(mockUnlikeMantra).toHaveBeenCalledWith(10, 'token-123');
    });

    fireEvent.press(getByTestId('mock-save-10'));
    await waitFor(() => {
      expect(mockSaveMantra).toHaveBeenCalledWith(10, 'token-123');
    });

    fireEvent.press(getByTestId('mock-save-10'));
    await waitFor(() => {
      expect(mockUnsaveMantra).toHaveBeenCalledWith(10, 'token-123');
    });
  });

  it('shows an alert when toggling like fails', async () => {
    mockLikeMantra.mockRejectedValueOnce(new Error('Network issue'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => expect(getByTestId('mock-like-10')).toBeTruthy());

    fireEvent.press(getByTestId('mock-like-10'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to update like status');
    });

    alertSpy.mockRestore();
  });
});
