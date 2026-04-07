import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LikedScreen from '../../screens/LikedScreen';
import { useLikedMantras } from '../../hooks';

jest.mock('../../hooks', () => ({
  useLikedMantras: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: { primary: '#9AA793', secondary: '#FFD700', primaryDark: '#1a1a1a', text: '#ffffff' },
  }),
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

const mockRefetch = jest.fn();

describe('LikedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLikedMantras as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { mantras: mockLikedMantras } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  it('shows loading indicator when loading', () => {
    (useLikedMantras as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { UNSAFE_root } = render(<LikedScreen navigation={navigation} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders liked mantras after loading', () => {
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    expect(UNSAFE_getByProps({ testID: 'liked-mantra-list' })).toBeTruthy();
  });

  it('shows empty state when no liked mantras', () => {
    (useLikedMantras as jest.Mock).mockReturnValue({
      data: { status: 'success', data: { mantras: [] } },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    expect(UNSAFE_getByProps({ children: 'No Liked Mantras' })).toBeTruthy();
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    UNSAFE_getByProps({ testID: 'back-button' }).props.onPress();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to Focus screen when a mantra card is tapped', () => {
    const { UNSAFE_getByProps } = render(<LikedScreen navigation={navigation} />);
    const mantraCard = UNSAFE_getByProps({ children: 'Mantra One' });
    let pressableNode: any = mantraCard;
    while (pressableNode && typeof pressableNode.props?.onPress !== 'function') {
      pressableNode = pressableNode.parent;
    }
    pressableNode.props.onPress();
    expect(mockNavigate).toHaveBeenCalledWith('Focus', { mantra: mockLikedMantras[0] });
  });
});
