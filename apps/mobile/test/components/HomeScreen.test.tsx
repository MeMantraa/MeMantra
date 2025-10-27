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

    const { findAllByRole } = setup();

    const buttons = await findAllByRole('button');
    const profileBtn = buttons[1];

    fireEvent.press(profileBtn);
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

    const { findAllByRole } = setup();
    const buttons = await findAllByRole('button');
    const profileBtn = buttons[1];

    fireEvent.press(profileBtn);

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const logoutBtn = alertArgs[2].find((b: any) => b.text === 'Log out');

    (storage.removeToken as jest.Mock).mockRejectedValueOnce(new Error('logout fail'));

    await act(async () => logoutBtn.onPress());

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to log out. Please try again.');
    });
  });
});
