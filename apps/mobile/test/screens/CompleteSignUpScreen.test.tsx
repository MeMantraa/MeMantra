import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CompleteSignUpScreen from '../../screens/CompleteSignUpScreen';
import { authService } from '../../services/auth.service';
import { storage } from '../../utils/storage';

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
jest.mock('../../utils/storage');

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

describe('CompleteSignUpScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
  };

  const mockRoute = {
    params: {
      email: 'test@example.com',
      code: '123456',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all fields', () => {
    const { getByText, getByPlaceholderText, getByDisplayValue } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByText('Almost there!')).toBeTruthy();
    expect(getByText('Complete your profile to finish creating your account.')).toBeTruthy();
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('shows email field as non-editable', () => {
    const { getByDisplayValue } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const emailInput = getByDisplayValue('test@example.com');
    expect(emailInput.props.editable).toBe(false);
  });

  it('alerts when fields are empty', async () => {
    const { getByText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('alerts when only username is filled', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('alerts when username is too short', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'ab');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Username must be at least 3 characters');
    });
  });

  it('alerts when passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'differentpassword');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });
  });

  it('alerts when password is too short', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'short');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'short');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 8 characters');
    });
  });

  it('calls register and navigates on success', async () => {
    (authService.register as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: {
        token: 'jwt-token',
        user: { user_id: 1, username: 'testuser', email: 'test@example.com' },
      },
    });
    (storage.saveToken as jest.Mock).mockResolvedValueOnce(undefined);
    (storage.saveUserData as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        code: '123456',
      });
      expect(storage.saveToken).toHaveBeenCalledWith('jwt-token');
      expect(storage.saveUserData).toHaveBeenCalledWith({
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    });
  });

  it('shows Creating Account... while loading', async () => {
    let resolveRegister: (value: any) => void;
    (authService.register as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Creating Account...')).toBeTruthy();
    });

    resolveRegister!({ status: 'success', data: { token: 't', user: {} } });

    await waitFor(() => {
      expect(getByText('Create Account')).toBeTruthy();
    });
  });

  it('shows generic error alert on non-verification error', async () => {
    (authService.register as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sign Up Failed', 'Internal server error');
    });
  });

  it('shows code expired alert and navigates to VerifyCode on expired verification code', async () => {
    (authService.register as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Invalid or expired verification code' },
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Code Expired',
        'Your verification code has expired. Please verify your email again.',
        [
          {
            text: 'OK',
            onPress: expect.any(Function),
          },
        ],
      );
    });

    // Simulate pressing OK on the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const onPress = alertCall[2][0].onPress;
    onPress();

    expect(mockNavigation.navigate).toHaveBeenCalledWith('VerifyCode', {
      email: 'test@example.com',
      flow: 'signup',
    });
  });

  it('shows fallback error message when no response data', async () => {
    (authService.register as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign Up Failed',
        'Sign up failed. Please try again.',
      );
    });
  });

  it('logs error to console on failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    (authService.register as jest.Mock).mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Complete sign up error:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('does not call register when response status is not success', async () => {
    (authService.register as jest.Mock).mockResolvedValueOnce({
      status: 'error',
      message: 'Something went wrong',
    });

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(storage.saveToken).not.toHaveBeenCalled();
      expect(mockNavigation.reset).not.toHaveBeenCalled();
    });
  });

  it('handles 400 error without verification code message as generic error', async () => {
    (authService.register as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Username already taken' },
      },
    });

    const { getByText, getByPlaceholderText } = render(
      <CompleteSignUpScreen route={mockRoute} navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sign Up Failed', 'Username already taken');
    });
  });
});
