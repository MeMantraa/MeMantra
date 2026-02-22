import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpEmailScreen from '../../screens/SignUpEmailScreen';
import { authService } from '../../services/auth.service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../services/auth.service');

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      secondary: '#FF6B6B',
      placeholderText: '#999999',
    },
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('../../components/UI/textInputWrapper', () => {
  const { TextInput } = jest.requireActual('react-native');
  return (props: any) => <TextInput {...props} />;
});

describe('SignUpEmailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    expect(getByText('Create Account')).toBeTruthy();
    expect(
      getByText("Enter your email address and we'll send you a verification code."),
    ).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByText('Send Code')).toBeTruthy();
    expect(getByText(/Already have an account\?/)).toBeTruthy();
    expect(getByText(/Login/)).toBeTruthy();
  });

  it('alerts when email is empty', async () => {
    const { getByText } = render(<SignUpEmailScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your email address');
    });
  });

  it('alerts when email is invalid', async () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'invalidemail');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });
  });

  it('navigates to VerifyCode on success', async () => {
    (authService.sendSignupCode as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      message: 'Code sent',
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(authService.sendSignupCode).toHaveBeenCalledWith('user@example.com');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('VerifyCode', {
        email: 'user@example.com',
        flow: 'signup',
      });
    });
  });

  it('shows error alert when response status is not success', async () => {
    (authService.sendSignupCode as jest.Mock).mockResolvedValueOnce({
      status: 'error',
      message: 'Email already registered',
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email already registered');
    });
  });

  it('shows fallback error message when response has no message', async () => {
    (authService.sendSignupCode as jest.Mock).mockResolvedValueOnce({
      status: 'error',
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send verification code');
    });
  });

  it('shows error alert on network failure with response data', async () => {
    (authService.sendSignupCode as jest.Mock).mockRejectedValueOnce({
      response: {
        data: { message: 'Too many requests' },
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Too many requests');
    });
  });

  it('shows fallback error on network failure without response data', async () => {
    (authService.sendSignupCode as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to send verification code. Please try again.',
      );
    });
  });

  it('logs error to console on failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    (authService.sendSignupCode as jest.Mock).mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Email form error:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows Sending... while loading', async () => {
    let resolvePromise: (value: any) => void;
    (authService.sendSignupCode as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(getByText('Sending...')).toBeTruthy();
    });

    resolvePromise!({ status: 'success', message: 'ok' });

    await waitFor(() => {
      expect(getByText('Send Code')).toBeTruthy();
    });
  });

  it('navigates to Login when bottom link is pressed', () => {
    const { getByText } = render(<SignUpEmailScreen navigation={mockNavigation} />);

    fireEvent.press(getByText(/Already have an account\?/));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('trims and lowercases email before sending', async () => {
    (authService.sendSignupCode as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      message: 'Code sent',
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpEmailScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Email'), '  User@Example.COM  ');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => {
      expect(authService.sendSignupCode).toHaveBeenCalledWith('user@example.com');
    });
  });
});
