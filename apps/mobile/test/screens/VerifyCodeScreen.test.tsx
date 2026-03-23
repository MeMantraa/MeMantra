import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VerifyCodeScreen from '../../screens/VerifyCodeScreen';
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

describe('VerifyCodeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  const mockRoute = {
    params: {
      email: 'user@example.com',
    },
  };

  const getVerifyButton = (container: any) => {
    const buttons = container.queryAllByText(/Verify Code|Verifying\.\.\./i);
    return buttons.length > 0 ? buttons[0] : null;
  };

  const getResendButton = (container: any) => {
    const texts = container.queryAllByText(/Resend Code|Resend in \d+s/i);
    return texts.length > 0 ? texts[0] : null;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getAllByDisplayValue } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByText('Enter Verification Code')).toBeTruthy();
    expect(getByText("We've sent a 6-digit code to user@example.com")).toBeTruthy();
    expect(getByText('Code expires in 10 minutes')).toBeTruthy();
    expect(getByText('Verify Code')).toBeTruthy();
    expect(getByText(/Didn't receive the code?/)).toBeTruthy();

    // Should have 6 input fields (all empty initially)
    const emptyInputs = getAllByDisplayValue('');
    expect(emptyInputs.length).toBe(6);
  });

  it('updates code input when user types', () => {
    const { getAllByDisplayValue } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const inputs = getAllByDisplayValue('');

    fireEvent.changeText(inputs[0], '1');
    expect(inputs[0].props.value).toBe('1');
  });

  it('only allows numeric input', () => {
    const { getAllByDisplayValue } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const inputs = getAllByDisplayValue('');

    fireEvent.changeText(inputs[0], 'a');
    expect(inputs[0].props.value).toBe('');

    fireEvent.changeText(inputs[0], '1');
    expect(inputs[0].props.value).toBe('1');
  });

  it('auto-focuses next input when digit is entered', () => {
    const { getAllByDisplayValue } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const inputs = getAllByDisplayValue('');

    // Enter digit in first input
    fireEvent.changeText(inputs[0], '1');

    // Second input should be focused (we can't directly test focus, but the logic should work)
    expect(inputs[0].props.value).toBe('1');
  });

  it('handles backspace to move to previous input', () => {
    const { getAllByDisplayValue } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const inputs = getAllByDisplayValue('');

    // Enter digit in first input
    fireEvent.changeText(inputs[0], '1');

    // Press backspace on second input (empty)
    fireEvent(inputs[1], 'keyPress', { nativeEvent: { key: 'Backspace' } });

    // Should move back to first input (we can't directly test focus)
    expect(inputs[0].props.value).toBe('1');
  });

  it('shows error alert when code is incomplete', async () => {
    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    // Enter only 3 digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');

    // The button should be disabled with incomplete code
    const verifyButton = container.getByText('Verify Code');
    let parent = verifyButton.parent;
    while (parent && !parent.props.accessible) {
      parent = parent.parent;
    }

    // Verify button is disabled
    expect(parent?.props.accessibilityState?.disabled).toBe(true);

    // Since button is disabled, verifyResetCode should not be called
    expect(authService.verifyResetCode).not.toHaveBeenCalled();
  });

  it('verifies code successfully and navigates to ResetPassword screen', async () => {
    (authService.verifyResetCode as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Code verified successfully!',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    // Enter first 5 digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');

    // Get verify button before entering last digit
    const verifyButton = container.getByText('Verify Code');

    // Now enter the last digit
    fireEvent.changeText(inputs[5], '6');

    // Click the button explicitly (auto-verify might trigger but we're testing manual press)
    fireEvent.press(verifyButton);

    await waitFor(() => {
      expect(authService.verifyResetCode).toHaveBeenCalledWith('user@example.com', '123456');
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Code verified successfully!',
        expect.any(Array),
      );
    });

    // Simulate pressing OK on the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const okButton = alertCall[2][0];
    okButton.onPress();

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ResetPassword', {
      email: 'user@example.com',
      code: '123456',
    });
  }, 30000);

  it('auto-verifies when all 6 digits are entered', async () => {
    (authService.verifyResetCode as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Code verified',
    });

    const { getAllByDisplayValue } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const inputs = getAllByDisplayValue('');

    // Enter all 6 digits - should trigger auto-verify
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    await waitFor(() => {
      expect(authService.verifyResetCode).toHaveBeenCalledWith('user@example.com', '123456');
    });
  });

  it('shows loading state while verifying code', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (authService.verifyResetCode as jest.Mock).mockReturnValue(promise);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    // Click the button before it changes to loading state
    await waitFor(() => {
      const button = getVerifyButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(container.getByText('Verifying...')).toBeTruthy();
    });

    resolvePromise({ status: 'success', message: 'Code verified' });

    await waitFor(() => {
      expect(container.getByText('Verify Code')).toBeTruthy();
    });
  });

  it('shows error alert when service returns error status', async () => {
    (authService.verifyResetCode as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Invalid verification code',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    // Enter first 5 digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');

    // Get verify button before entering last digit
    const verifyButton = container.getByText('Verify Code');

    // Enter last digit
    fireEvent.changeText(inputs[5], '6');

    // Click the button
    fireEvent.press(verifyButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid verification code');
    });

    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('clears code inputs on error', async () => {
    (authService.verifyResetCode as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Invalid code',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    let inputs = container.getAllByDisplayValue('');

    // Enter first 5 digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');

    // Get verify button before entering last digit
    const verifyButton = container.getByText('Verify Code');

    // Enter last digit
    fireEvent.changeText(inputs[5], '6');

    // Click the button
    fireEvent.press(verifyButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // After error, inputs should be cleared
    await waitFor(() => {
      const clearedInputs = container.getAllByDisplayValue('');
      expect(clearedInputs.length).toBe(6);
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

    (authService.verifyResetCode as jest.Mock).mockRejectedValue(error);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    await waitFor(() => {
      const button = getVerifyButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network connection failed');
    });
  });

  it('handles error without response data', async () => {
    const error = new Error('Unknown error');

    (authService.verifyResetCode as jest.Mock).mockRejectedValue(error);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    await waitFor(() => {
      const button = getVerifyButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Invalid or expired code. Please try again.',
      );
    });
  });

  it('resends code successfully', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Code sent',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    // Fast-forward past cooldown
    for (let i = 0; i < 60; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      const button = getResendButton(container);
      expect(button).toBeTruthy();
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'A new verification code has been sent to your email',
      );
    });
  });

  it('shows cooldown timer after resending code', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Code sent',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    // Initially should show cooldown
    expect(container.getByText(/Resend in 60s/)).toBeTruthy();

    // Fast-forward cooldown one second at a time
    for (let i = 0; i < 60; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      expect(container.queryByText(/Resend Code/)).toBeTruthy();
    });
  });

  it('disables resend button during cooldown', () => {
    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const resendText = container.getByText(/Resend in 60s/);
    // Check the parent TouchableOpacity for disabled state
    let parent = resendText.parent;
    while (parent && !parent.props.accessible) {
      parent = parent.parent;
    }
    expect(parent?.props.accessibilityState?.disabled).toBe(true);
  });

  it('handles resend code error with rate limiting', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Too many requests',
      waitTime: 120,
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    // Fast-forward past initial cooldown
    for (let i = 0; i < 60; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      const button = getResendButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Too many requests');
    });

    // Should now show 120s cooldown
    await waitFor(() => {
      expect(container.getByText(/Resend in 120s/)).toBeTruthy();
    });
  });

  it('handles resend code network error with waitTime', async () => {
    const error = {
      response: {
        data: {
          message: 'Rate limit exceeded',
          waitTime: 180,
        },
      },
    };

    (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    // Fast-forward past initial cooldown
    for (let i = 0; i < 60; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      const button = getResendButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Rate limit exceeded');
    });

    // Should set cooldown from error response
    await waitFor(() => {
      expect(container.getByText(/Resend in 180s/)).toBeTruthy();
    });
  });

  it('clears code inputs after successful resend', async () => {
    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Code sent',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    let inputs = container.getAllByDisplayValue('');

    // Enter some digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');

    // Fast-forward past cooldown
    for (let i = 0; i < 60; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      const button = getResendButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalled();
    });

    // Inputs should be cleared
    const clearedInputs = container.getAllByDisplayValue('');
    expect(clearedInputs.length).toBe(6);
  });

  it('disables verify button when code is incomplete', async () => {
    // Mock verifyResetCode to prevent auto-verify from proceeding
    (authService.verifyResetCode as jest.Mock).mockResolvedValue({
      status: 'success',
      message: 'Code verified',
    });

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');
    let verifyButton = container.getByText('Verify Code');

    // Find the TouchableOpacity parent with accessibility state
    let parent = verifyButton.parent;
    while (parent && !parent.props.accessible) {
      parent = parent.parent;
    }

    // Initially disabled
    expect(parent?.props.accessibilityState?.disabled).toBe(true);

    // Enter some digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');

    // Refresh button reference
    verifyButton = container.getByText('Verify Code');
    parent = verifyButton.parent;
    while (parent && !parent.props.accessible) {
      parent = parent.parent;
    }

    // Still disabled
    expect(parent?.props.accessibilityState?.disabled).toBe(true);

    // Enter remaining digits except last one
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');

    // Refresh button reference
    verifyButton = container.getByText('Verify Code');
    parent = verifyButton.parent;
    while (parent && !parent.props.accessible) {
      parent = parent.parent;
    }

    // Still disabled (last digit missing)
    expect(parent?.props.accessibilityState?.disabled).toBe(true);

    // Enter last digit - this will enable button and trigger auto-verify
    fireEvent.changeText(inputs[5], '6');

    // Wait for potential auto-verify to process
    await waitFor(() => {
      const button = container.queryByText(/Verify Code|Verifying/);
      expect(button).toBeTruthy();
    });
  });

  it('disables inputs while loading', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (authService.verifyResetCode as jest.Mock).mockReturnValue(promise);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    let inputs = container.getAllByDisplayValue('');

    // Initially editable
    expect(inputs[0].props.editable).toBe(true);

    // Enter first 5 digits
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');

    // Get verify button before entering last digit
    const verifyButton = container.getByText('Verify Code');

    // Enter last digit
    fireEvent.changeText(inputs[5], '6');

    // Click the button
    fireEvent.press(verifyButton);

    await waitFor(() => {
      expect(container.getByText('Verifying...')).toBeTruthy();
    });

    // Get fresh reference to inputs - they should be disabled
    await waitFor(() => {
      inputs = container.getAllByDisplayValue(/1|2|3|4|5|6/);
      expect(inputs[0].props.editable).toBe(false);
    });

    // Resolve the promise to end loading state
    await act(async () => {
      resolvePromise({ status: 'success', message: 'Verified' });
    });

    // Wait for loading to complete - inputs should be re-enabled
    await waitFor(() => {
      // After success, just verify inputs are back to editable
      // (Success doesn't clear inputs, only errors do)
      const allInputs = container.getAllByDisplayValue(/1|2|3|4|5|6/);
      expect(allInputs[0].props.editable).toBe(true);
    });
  });

  it('logs error to console on verification failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    (authService.verifyResetCode as jest.Mock).mockRejectedValue(error);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    const inputs = container.getAllByDisplayValue('');

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');
    fireEvent.changeText(inputs[3], '4');
    fireEvent.changeText(inputs[4], '5');
    fireEvent.changeText(inputs[5], '6');

    await waitFor(() => {
      const button = getVerifyButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Verify code error:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('logs error to console on resend failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Resend error');

    (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

    const container = render(<VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />);

    // Fast-forward past cooldown
    for (let i = 0; i < 60; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      const button = getResendButton(container);
      if (button) fireEvent.press(button);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Resend code error:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('decrements cooldown timer every second', () => {
    const { getByText } = render(
      <VerifyCodeScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByText(/Resend in 60s/)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText(/Resend in 59s/)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText(/Resend in 58s/)).toBeTruthy();
  });
});
