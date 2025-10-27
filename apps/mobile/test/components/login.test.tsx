import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../screens/login';
import { authService } from '../../services/auth.service';
import { storage } from '../../utils/storage';
import { useGoogleAuth } from '../../services/google-auth.service';

// Jest mocks
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

jest.spyOn(Alert, 'alert');

const mockNavigate = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    return render(<LoginScreen navigation={{ navigate: mockNavigate }} />);
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

  it('calls authService.login and saves token on success', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      status: 'success',

      data: {
        token: 'fake-token',
        user: { id: 1, username: 'John' },
      },
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'john@memantra.com',
        password: 'memantra',
      });

      expect(storage.saveToken).toHaveBeenCalledWith('fake-token');
      expect(storage.saveUserData).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Login successful!');
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
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  it('shows alert when login throws error', async () => {
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Network error' } },
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Network error');
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

  it('handles Google sign-in success flow', async () => {
    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: {
        type: 'success',
        authentication: { idToken: 'google-token' },
      },

      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { token: 'google-jwt', user: { id: 2, username: 'GoogleUser' } },
    });

    const { rerender } = setup();

    // Call for re-render with an expected successful Google response
    rerender(<LoginScreen navigation={{ navigate: mockNavigate }} />);

    await waitFor(() => {
      expect(authService.googleAuth).toHaveBeenCalledWith({ idToken: 'google-token' });
      expect(storage.saveToken).toHaveBeenCalledWith('google-jwt');
      expect(storage.saveUserData).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Logged in with Google!');
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

    // Call for re-render with an expected Google error response
    rerender(<LoginScreen navigation={{ navigate: mockNavigate }} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google authentication failed');
    });
  });
});
