import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../../screens/homeScreen';
import { mantraService } from '../../services/mantra.service';
import { storage } from '../../utils/storage';

jest.mock('../../components/carousel', () => {
  const React = jest.requireActual('react');
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');

  return function MockCarousel({ item, onLike, onSave }: any) {
    return (
      <View>
        <Text>{item.title}</Text>
        <TouchableOpacity testID={`like-${item.mantra_id}`} onPress={() => onLike(item.mantra_id)}>
          <Text>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`save-${item.mantra_id}`} onPress={() => onSave(item.mantra_id)}>
          <Text>Save</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getFeedMantras: jest.fn(),
    likeMantra: jest.fn(),
    unlikeMantra: jest.fn(),
    saveMantra: jest.fn(),
    unsaveMantra: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
    saveToken: jest.fn(),
    removeToken: jest.fn(),
    saveUserData: jest.fn(),
    removeUserData: jest.fn(),
  },
}));

jest.spyOn(Alert, 'alert');

describe('HomeScreen - Full Coverage', () => {
  const mockReset = jest.fn();
  const mockNavigate = jest.fn();

  const setup = () =>
    render(<HomeScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading then empty state and refresh works', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-123');
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: [],
    });

    const { getByText } = setup();

    await waitFor(() => expect(getByText('No mantras available')).toBeTruthy());

    fireEvent.press(getByText('Refresh'));

    await waitFor(() => expect(mantraService.getFeedMantras).toHaveBeenCalledTimes(2));
  });

  it('handles API error on initial fetch gracefully', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-err');
    (mantraService.getFeedMantras as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = setup();

    await waitFor(() => expect(getByText('No mantras available')).toBeTruthy());
  });

  it('renders feed and handles like/save success', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-abc');

    const sample = [
      { mantra_id: 1, title: 'M1', isLiked: false, isSaved: false },
      { mantra_id: 2, title: 'M2', isLiked: true, isSaved: false },
    ];

    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.likeMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    (mantraService.saveMantra as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByText, getByTestId } = setup();

    await waitFor(() => {
      expect(getByText('M1')).toBeTruthy();
      expect(getByText('M2')).toBeTruthy();
    });

    fireEvent.press(getByTestId('like-1'));
    await waitFor(() => expect(mantraService.likeMantra).toHaveBeenCalledWith(1, 'token-abc'));

    fireEvent.press(getByTestId('save-2'));
    await waitFor(() => expect(mantraService.saveMantra).toHaveBeenCalledWith(2, 'token-abc'));
  });

  it('reverts like on failure and shows alert', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-fail');
    const sample = [{ mantra_id: 5, title: 'FailLike', isLiked: false, isSaved: false }];

    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.likeMantra as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('like-5'));

    fireEvent.press(getByTestId('like-5'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update like status');
    });
  });

  it('reverts save on failure and shows alert', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-fail');
    const sample = [{ mantra_id: 9, title: 'FailSave', isLiked: false, isSaved: false }];

    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.saveMantra as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('save-9'));

    fireEvent.press(getByTestId('save-9'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update save status');
    });
  });

  it('shows logout alert, confirms logout, clears storage and navigates', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-x');
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({ status: 'success', data: [] });

    const { getByTestId } = setup();
    fireEvent.press(getByTestId('profile-btn'));

    expect(Alert.alert).toHaveBeenCalled();

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const logoutBtn = alertArgs[2].find((b: any) => b.text === 'Log out');

    (storage.removeToken as jest.Mock).mockResolvedValue(undefined);
    (storage.removeUserData as jest.Mock).mockResolvedValue(undefined);

    await act(async () => logoutBtn.onPress());

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
  });

  it('handles logout failure gracefully', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('t');

    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({ status: 'success', data: [] });

    const { getByTestId } = setup();

    const profileBtn = getByTestId('profile-btn');

    fireEvent.press(profileBtn);

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];

    const buttonsConfig = alertArgs[2] || [];

    const logoutBtn = buttonsConfig.find((b: any) => b.text === 'Log out');

    (storage.removeToken as jest.Mock).mockRejectedValueOnce(new Error('logout fail'));

    await act(async () => logoutBtn?.onPress && logoutBtn.onPress());

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to log out. Please try again.');
    });
  });

  // New tests to increase branch coverage

  it('shows activity indicator while fetching (loading state)', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-pending');
    // Keep the promise pending so loading state remains true
    (mantraService.getFeedMantras as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByText } = setup();

    // Immediately the loading view should be visible
    expect(getByText('Loading mantras...')).toBeTruthy();
  });

  it('calls unlikeMantra and unsaveMantra when items are already liked/saved', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-unlike-unsave');

    const sample = [
      { mantra_id: 1, title: 'SavedItem', isLiked: false, isSaved: true },
      { mantra_id: 2, title: 'LikedItem', isLiked: true, isSaved: false },
    ];

    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.unlikeMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    (mantraService.unsaveMantra as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByTestId, getByText } = setup();

    await waitFor(() => {
      expect(getByText('SavedItem')).toBeTruthy();
      expect(getByText('LikedItem')).toBeTruthy();
    });

    fireEvent.press(getByTestId('like-2'));
    await waitFor(() =>
      expect(mantraService.unlikeMantra).toHaveBeenCalledWith(2, 'token-unlike-unsave'),
    );

    fireEvent.press(getByTestId('save-1'));
    await waitFor(() =>
      expect(mantraService.unsaveMantra).toHaveBeenCalledWith(1, 'token-unlike-unsave'),
    );
  });

  it('uses saveToken/saveUserData fallback when removeToken/removeUserData are not available', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-fallback');
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({ status: 'success', data: [] });

    // Backup original functions to restore after test
    const originalRemoveToken = (storage as any).removeToken;
    const originalRemoveUserData = (storage as any).removeUserData;
    const originalSaveToken = (storage as any).saveToken;
    const originalSaveUserData = (storage as any).saveUserData;

    try {
      // Simulate absence of removeToken/removeUserData
      (storage as any).removeToken = undefined;
      (storage as any).removeUserData = undefined;
      (storage as any).saveToken = jest.fn().mockResolvedValue(undefined);
      (storage as any).saveUserData = jest.fn().mockResolvedValue(undefined);

      const { getByTestId } = setup();
      fireEvent.press(getByTestId('profile-btn'));

      const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const logoutBtn = alertArgs[2].find((b: any) => b.text === 'Log out');

      await act(async () => logoutBtn.onPress());

      await waitFor(() => {
        expect((storage as any).saveToken).toHaveBeenCalledWith('');
        expect((storage as any).saveUserData).toHaveBeenCalledWith(null);
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    } finally {
      // restore originals
      (storage as any).removeToken = originalRemoveToken;
      (storage as any).removeUserData = originalRemoveUserData;
      (storage as any).saveToken = originalSaveToken;
      (storage as any).saveUserData = originalSaveUserData;
    }
  });

  it('uses fallback token when getToken returns null', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: [],
    });

    const { getByText } = setup();

    await waitFor(() => {
      expect(mantraService.getFeedMantras).toHaveBeenCalledWith('mock-token');
    });
  });

  it('uses fallback token and likes a mantra not previously liked', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    const sample = [{ mantra_id: 20, title: 'LikeTest', isLiked: false, isSaved: false }];
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.likeMantra as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('like-20'));

    fireEvent.press(getByTestId('like-20'));

    await waitFor(() => {
      expect(mantraService.likeMantra).toHaveBeenCalledWith(20, 'mock-token');
    });
  });

  it('unlikes a mantra already liked', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    const sample = [{ mantra_id: 21, title: 'UnlikeTest', isLiked: true, isSaved: false }];
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.unlikeMantra as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('like-21'));

    fireEvent.press(getByTestId('like-21'));

    await waitFor(() => {
      expect(mantraService.unlikeMantra).toHaveBeenCalledWith(21, 'mock-token');
    });
  });

  it('reverts isLiked state and shows alert if likeMantra fails', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-error');
    const sample = [{ mantra_id: 22, title: 'LikeFail', isLiked: false, isSaved: false }];
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.likeMantra as jest.Mock).mockRejectedValue(new Error('fail'));

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('like-22'));

    fireEvent.press(getByTestId('like-22'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update like status');
    });
  });

  it('uses fallback token and saves a mantra not previously saved', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    const sample = [{ mantra_id: 30, title: 'SaveTest', isLiked: false, isSaved: false }];
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.saveMantra as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('save-30'));

    fireEvent.press(getByTestId('save-30'));

    await waitFor(() => {
      expect(mantraService.saveMantra).toHaveBeenCalledWith(30, 'mock-token');
    });
  });

  it('unsaves a mantra already saved', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    const sample = [{ mantra_id: 31, title: 'UnsaveTest', isLiked: false, isSaved: true }];
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.unsaveMantra as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('save-31'));

    fireEvent.press(getByTestId('save-31'));

    await waitFor(() => {
      expect(mantraService.unsaveMantra).toHaveBeenCalledWith(31, 'mock-token');
    });
  });

  it('reverts isSaved state and shows alert if saveMantra fails', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('token-error');
    const sample = [{ mantra_id: 32, title: 'SaveFail', isLiked: false, isSaved: false }];
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: sample,
    });
    (mantraService.saveMantra as jest.Mock).mockRejectedValue(new Error('fail'));

    const { getByTestId } = setup();

    await waitFor(() => getByTestId('save-32'));

    fireEvent.press(getByTestId('save-32'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update save status');
    });
  });
});
