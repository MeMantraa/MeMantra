import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../screens/login';
import { authService } from '../../services/auth.service';
import { useGoogleAuth } from '../../services/google-auth.service';

jest.mock('../../services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    googleAuth: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    saveToken: jest.fn(),
    saveUserData: jest.fn(),
  },
}));

jest.mock('../../services/google-auth.service', () => ({
  useGoogleAuth: jest.fn(() => ({
    request: {},
    response: null,
    promptAsync: jest.fn(),
  })),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      primary: '#000',
      secondary: '#333',
      primaryDark: '#111',
      placeholderText: '#ccc',
    },
  })),
}));

// Mock Alert.alert to immediately resolve
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockNavigation = { navigate: mockNavigate, reset: mockReset };

const setup = () => render(<LoginScreen navigation={mockNavigation} />);

describe('LoginScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const setup = () => {
    return render(<LoginScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);
  };

  it('renders inputs and buttons', () => {
    const { getByPlaceholderText, getByText } = setup();

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Sign In with Google')).toBeTruthy();
  });

  it('shows alert if fields are empty', async () => {
    const { getByText } = setup();

    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter both email and password');
    });
  });

  it('shows alert if login fails (response.status not success)', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Invalid credentials',
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongmemantra');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'john@memantra.com',
        password: 'wrongmemantra',
      });
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  it('navigates to Signup when pressing "Sign Up"', () => {
    const { getByText } = setup();

    fireEvent.press(getByText('New to us? Sign Up'));

    expect(mockNavigate).toHaveBeenCalledWith('Signup');
  });

  it('calls promptAsync when pressing "Sign In with Google"', async () => {
    const mockPromptAsync = jest.fn();

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: null,
      promptAsync: mockPromptAsync,
    });

    const { getByText } = setup();

    fireEvent.press(getByText('Sign In with Google'));
    expect(mockPromptAsync).toHaveBeenCalled();
  });

  it('navigates to MainApp on successful login', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { token: 'abc123', user: { id: 1, name: 'John' } },
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    });
  });

  it('navigates to MainApp on successful Google login', async () => {
    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: { type: 'success', authentication: { idToken: 'google-token' } },
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { token: 'google-token', user: { id: 2, name: 'Jane' } },
    });

    setup();

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    });
  });

  it('handles Google sign-in error response', async () => {
    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: {
        type: 'success',
        authentication: { idToken: 'google-token' },
      },
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockRejectedValue(new Error('Google API error'));

    const { rerender } = setup();

    rerender(<LoginScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google authentication failed');
    });
  });

  it('shows alert when Google auth returns error status', async () => {
    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: { type: 'success', authentication: { idToken: 'google-token' } },
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Google login failed',
    });

    const { rerender } = setup();
    rerender(<LoginScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google login failed');
    });
  });

  it('shows alert if Google sign-in fails to start', async () => {
    const mockPromptAsync = jest.fn().mockRejectedValue(new Error('Google API error'));

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: null,
      promptAsync: mockPromptAsync,
    });

    const { getByText } = setup();

    fireEvent.press(getByText('Sign In with Google'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to initiate Google sign-in');
    });
  });

  it('shows default message if login fails without a message', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      status: 'error',
      message: undefined,
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Please try again.');
    });
  });

  it('shows default message if Google login fails without a message', async () => {
    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: { type: 'success', authentication: { idToken: 'google-token' } },
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'error',
      message: undefined,
    });

    const { rerender } = setup();
    rerender(<LoginScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google login failed');
    });
  });

  it('does nothing if Google response has no idToken', async () => {
    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: { type: 'success', authentication: {} }, // no idToken
      promptAsync: jest.fn(),
    });

    setup();

    await waitFor(() => {
      expect(authService.googleAuth).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });
});
