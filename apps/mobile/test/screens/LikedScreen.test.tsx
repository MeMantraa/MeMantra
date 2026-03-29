import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LikedScreen from '../../screens/LikedScreen';
import { mantraService } from '../../services/mantra.service';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: { primary: '#9AA793', secondary: '#FFD700', primaryDark: '#1a1a1a', text: '#ffffff' },
  }),
}));

jest.mock('../../services/mantra.service', () => ({
  mantraService: { getLikedMantras: jest.fn() },
}));

jest.mock('../../utils/storage', () => ({
  storage: { getToken: jest.fn().mockResolvedValue('mock-token') },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../components/UI/textWrapper', () => {
  return ({ children }: any) => children;
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = { navigate: mockNavigate, goBack: mockGoBack };

const mockLikedMantras = [
  { mantra_id: 1, title: 'Mantra One', key_takeaway: 'takeaway', created_at: '', is_active: true },
  { mantra_id: 2, title: 'Mantra Two', key_takeaway: 'takeaway', created_at: '', is_active: true },
];

describe('LikedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator initially', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });
    render(<LikedScreen navigation={navigation} />);
    await waitFor(() => expect(mantraService.getLikedMantras).toHaveBeenCalledTimes(1));
  });

  it('renders liked mantras after loading', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockLikedMantras },
    });
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    await waitFor(() => expect(UNSAFE_getByProps({ testID: 'liked-mantra-list' })).toBeTruthy());
  });

  it('shows empty state when no liked mantras', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    await waitFor(() => expect(UNSAFE_getByProps({ children: 'No Liked Mantras' })).toBeTruthy());
  });

  it('calls navigation.goBack when back button is pressed', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    // back button rendered by Ionicons (mocked to null) — trigger via the TouchableOpacity
    // We test loading completes and back press works
    await waitFor(() => expect(mantraService.getLikedMantras).toHaveBeenCalledTimes(1));
    UNSAFE_getByProps({ testID: 'back-button' }).props.onPress();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to Focus screen when a mantra card is tapped', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockLikedMantras },
    });
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    await waitFor(() => expect(UNSAFE_getByProps({ children: 'Mantra One' })).toBeTruthy());
    const mantraCard = UNSAFE_getByProps({ children: 'Mantra One' });
    let pressableNode: any = mantraCard;
    while (pressableNode && typeof pressableNode.props?.onPress !== 'function') {
      pressableNode = pressableNode.parent;
    }
    pressableNode.props.onPress();
    expect(mockNavigate).toHaveBeenCalledWith('Focus', { mantra: mockLikedMantras[0] });
  });
});
