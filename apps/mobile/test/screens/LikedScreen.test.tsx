import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
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

  it('shows loading indicator initially', () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });
    const { queryByText } = render(<LikedScreen navigation={navigation} />);
    // title still visible during load
    expect(queryByText('Liked Mantras')).toBeTruthy();
  });

  it('renders liked mantras after loading', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockLikedMantras },
    });
    const { getByTestId } = render(<LikedScreen navigation={navigation} />);
    await waitFor(() => expect(getByTestId('liked-mantra-list')).toBeTruthy());
  });

  it('shows empty state when no liked mantras', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });
    const { findByText } = render(<LikedScreen navigation={navigation} />);
    expect(await findByText('No Liked Mantras')).toBeTruthy();
  });

  it('calls navigation.goBack when back button is pressed', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: [] },
    });
    const { getByTestId } = render(<LikedScreen navigation={navigation} />);
    // back button rendered by Ionicons (mocked to null) — trigger via the TouchableOpacity
    // We test loading completes and back press works
    await waitFor(() => expect(mantraService.getLikedMantras).toHaveBeenCalledTimes(1));
    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to Focus screen when a mantra card is tapped', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantras: mockLikedMantras },
    });
    const { findByText } = render(<LikedScreen navigation={navigation} />);
    fireEvent.press(await findByText('Mantra One'));
    expect(mockNavigate).toHaveBeenCalledWith('Focus', { mantra: mockLikedMantras[0] });
  });
});
