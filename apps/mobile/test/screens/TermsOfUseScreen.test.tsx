import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TermsOfUseScreen from '../../screens/TermsOfUseScreen';
import { storage } from '../../utils/storage';

jest.mock('../../utils/storage', () => ({
  storage: {
    setTermsAccepted: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#7BA5B5',
      secondary: '#6D7E68',
      white: '#ffffff',
      text: '#333',
    },
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('TermsOfUseScreen', () => {
  const mockNavigation = {
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the terms of use content', () => {
    const { getByText } = render(<TermsOfUseScreen navigation={mockNavigation} />);

    expect(getByText('Terms of Use')).toBeTruthy();
    expect(getByText('1. User-Generated Content')).toBeTruthy();
    expect(getByText('2. Zero-Tolerance Content Policy')).toBeTruthy();
    expect(getByText('3. Reporting & Blocking')).toBeTruthy();
    expect(getByText('4. Account Termination')).toBeTruthy();
    expect(getByText('5. Disclaimer')).toBeTruthy();
  });

  it('renders the checkbox and continue button', () => {
    const { getByText } = render(<TermsOfUseScreen navigation={mockNavigation} />);

    expect(getByText('I have read and agree to the Terms of Use')).toBeTruthy();
    expect(getByText('Continue')).toBeTruthy();
  });

  it('does not navigate when continue is pressed without agreeing', () => {
    const { getByText } = render(<TermsOfUseScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('Continue'));

    expect(storage.setTermsAccepted).not.toHaveBeenCalled();
    expect(mockNavigation.reset).not.toHaveBeenCalled();
  });

  it('navigates to MainApp after agreeing and pressing continue', async () => {
    const { getByText } = render(<TermsOfUseScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('I have read and agree to the Terms of Use'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(storage.setTermsAccepted).toHaveBeenCalled();
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    });
  });

  it('toggles checkbox on and off', () => {
    const { getByText, queryByText } = render(<TermsOfUseScreen navigation={mockNavigation} />);

    const checkbox = getByText('I have read and agree to the Terms of Use');

    // Toggle on
    fireEvent.press(checkbox);
    expect(getByText('✓')).toBeTruthy();

    // Toggle off
    fireEvent.press(checkbox);
    expect(queryByText('✓')).toBeNull();
  });
});
