import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ResetPasswordScreen from '../../screens/ResetPasswordScreen';
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

describe('ResetPasswordScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
  };

  const mockRoute = {
    params: {
      email: 'user@example.com',
      code: '123456',
    },
  };

  // Helper to get the button (second "Reset Password" text)
  const getResetButton = (getAllByText: any) => {
    const buttons = getAllByText('Reset Password');
    return buttons[1]; // Button is the second occurrence
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    const { getAllByText, getByText, getByPlaceholderText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getAllByText('Reset Password').length).toBe(2); // Title and button
    expect(getByText('Enter your new password below')).toBeTruthy();
    expect(getByPlaceholderText('New Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm New Password')).toBeTruthy();
    expect(getByText('• Password must be at least 8 characters')).toBeTruthy();
  });

  it('updates password inputs when user types', () => {
    const { getByPlaceholderText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    expect(newPasswordInput.props.value).toBe('NewPassword123!');
    expect(confirmPasswordInput.props.value).toBe('NewPassword123!');
  });

  it('shows error alert when fields are empty', async () => {
    const { getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('shows error alert when new password is empty', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');
    fireEvent.changeText(confirmPasswordInput, 'Password123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('shows error alert when confirm password is empty', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    fireEvent.changeText(newPasswordInput, 'Password123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('shows error alert when passwords do not match', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'Password123!');
    fireEvent.changeText(confirmPasswordInput, 'DifferentPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('shows error alert when password is less than 8 characters', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'Short1!');
    fireEvent.changeText(confirmPasswordInput, 'Short1!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 8 characters');
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('resets password successfully and navigates to Login screen', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Your password has been reset successfully!',
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'user@example.com',
        '123456',
        'NewPassword123!',
      );
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Your password has been reset successfully!',
        expect.any(Array),
      );
    });

    // Simulate pressing OK on the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const okButton = alertCall[2][0];
    okButton.onPress();

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  });

  it('trims passwords before sending', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Password reset successfully',
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, '  NewPassword123!  ');
    fireEvent.changeText(confirmPasswordInput, '  NewPassword123!  ');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'user@example.com',
        '123456',
        'NewPassword123!',
      );
    });
  });

  it('shows loading state while resetting password', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (authService.resetPassword as jest.Mock).mockReturnValue(promise);

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText('Resetting...')).toBeTruthy();
    });

    expect(newPasswordInput.props.editable).toBe(false);
    expect(confirmPasswordInput.props.editable).toBe(false);

    resolvePromise({ status: 'success', message: 'Password reset' });

    await waitFor(() => {
      expect(getByText('Reset Password')).toBeTruthy();
    });
  });

  it('shows error alert when service returns error status', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Invalid or expired code',
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid or expired code');
    });

    expect(mockNavigation.reset).not.toHaveBeenCalled();
  });

  it('shows default error message when service returns error without message', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      status: 'error',
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to reset password');
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

    (authService.resetPassword as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network connection failed');
    });
  });

  it('handles error without response data', async () => {
    const error = new Error('Unknown error');

    (authService.resetPassword as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to reset password. Please try again.',
      );
    });
  });

  it('uses email and code from route params', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Password reset',
    });

    const customRoute = {
      params: {
        email: 'test@example.com',
        code: '999999',
      },
    };

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={customRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        '999999',
        'NewPassword123!',
      );
    });
  });

  it('logs error to console on failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    (authService.resetPassword as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Reset password error:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('validates password mismatch with trimmed values', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, '  Password123!  ');
    fireEvent.changeText(confirmPasswordInput, '  DifferentPassword123!  ');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('accepts exactly 8 character password', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Password reset',
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'Pass123!');
    fireEvent.changeText(confirmPasswordInput, 'Pass123!');

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'user@example.com',
        '123456',
        'Pass123!',
      );
    });
  });

  it('disables inputs while loading', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (authService.resetPassword as jest.Mock).mockReturnValue(promise);

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <ResetPasswordScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const newPasswordInput = getByPlaceholderText('New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm New Password');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    expect(newPasswordInput.props.editable).toBe(true);
    expect(confirmPasswordInput.props.editable).toBe(true);

    const resetButton = getResetButton(getAllByText);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText('Resetting...')).toBeTruthy();
    });

    expect(newPasswordInput.props.editable).toBe(false);
    expect(confirmPasswordInput.props.editable).toBe(false);

    resolvePromise({ status: 'success', message: 'Password reset' });

    await waitFor(() => {
      expect(newPasswordInput.props.editable).toBe(true);
      expect(confirmPasswordInput.props.editable).toBe(true);
    });
  });
});
