import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
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

describe('ForgotPasswordScreen', () => {
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
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    expect(getByText('Forgot Password?')).toBeTruthy();
    expect(
      getByText(
        "Enter your email address and we'll send you a verification code to reset your password.",
      ),
    ).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByText('Send Code')).toBeTruthy();
    expect(getByText(/Remember your password?/)).toBeTruthy();
    expect(getByText('Back to Login')).toBeTruthy();
  });

  it('updates email input when user types', () => {
    const { getByPlaceholderText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    expect(emailInput.props.value).toBe('user@example.com');
  });

  it('shows error alert when email is empty', async () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your email address');
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows error alert for invalid email format - missing @', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'invalidemail.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows error alert for invalid email format - @ at start', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, '@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows error alert for invalid email format - missing domain', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows error alert for invalid email format - no dot after @', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows error alert for invalid email format - contains spaces', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user @example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('sends code successfully and navigates to VerifyCode screen', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Verification code sent to your email',
    });

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Verification code sent to your email',
        expect.any(Array),
      );
    });

    // Simulate pressing OK on the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const okButton = alertCall[2][0];
    okButton.onPress();

    expect(mockNavigation.navigate).toHaveBeenCalledWith('VerifyCode', {
      email: 'user@example.com',
    });
  });

  it('trims and lowercases email before sending', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Verification code sent',
    });

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, '  USER@EXAMPLE.COM  ');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('shows loading state while sending code', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (authService.forgotPassword as jest.Mock).mockReturnValue(promise);

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(getByText('Sending...')).toBeTruthy();
    });

    expect(emailInput.props.editable).toBe(false);

    resolvePromise({ status: 'success', message: 'Code sent' });

    await waitFor(() => {
      expect(getByText('Send Code')).toBeTruthy();
    });
  });

  it('shows error alert when service returns error status', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Email not found',
    });

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'notfound@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email not found');
    });

    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('shows default error message when service returns error without message', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'error',
    });

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send verification code');
    });
  });

  it('handles network error gracefully', async () => {
    const error = {
      response: {
        data: {
          message: 'Network connection failed',
        },
      },
    };

    (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network connection failed');
    });
  });

  it('handles error without response data', async () => {
    const error = new Error('Unknown error');

    (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to send verification code. Please try again.',
      );
    });
  });

  it('navigates to Login screen when Back to Login is pressed', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);

    const backToLoginButton = getByText('Back to Login');
    fireEvent.press(backToLoginButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('disables send button while loading', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (authService.forgotPassword as jest.Mock).mockReturnValue(promise);

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(getByText('Sending...')).toBeTruthy();
    });

    resolvePromise({ status: 'success', message: 'Code sent' });

    await waitFor(() => {
      expect(getByText('Send Code')).toBeTruthy();
    });
  });

  it('logs error to console on failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />,
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'user@example.com');

    const sendCodeButton = getByText('Send Code');
    fireEvent.press(sendCodeButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Email form error:', error);
    });

    consoleErrorSpy.mockRestore();
  });
});
