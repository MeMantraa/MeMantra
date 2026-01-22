import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LikedScreen from '../../screens/LikedScreen';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#9AA793',
      text: '#ffffff',
    },
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('LikedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<LikedScreen />);

    expect(getByText('Back')).toBeTruthy();
    expect(getByText('Liked Mantras')).toBeTruthy();
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const { getByText } = render(<LikedScreen />);

    const backButton = getByText('Back');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('displays the liked mantras text in the center', () => {
    const { getByText } = render(<LikedScreen />);

    const likedMantrasText = getByText('Liked Mantras');
    expect(likedMantrasText).toBeTruthy();
  });
});
