import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../../screens/SignUp';
import { authService } from '../../services/auth.service';
import { storage } from '../../utils/storage';
import { useGoogleAuth } from '../../services/google-auth.service';

// Jest mocks
jest.mock('../../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
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

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    return render(<SignUpScreen navigation={{ navigate: mockNavigate }} />);
  };

  it('renders all input fields and buttons', () => {
    const { getByPlaceholderText, getByText } = setup();

    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();

    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
    expect(getByText('Sign Up with Google')).toBeTruthy();
  });

  it('shows alert if fields are empty', async () => {
    const { getByText } = setup();

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('shows alert if passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Username'), 'John');

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');

    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');

    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'memantra1');

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });
  });

  it('shows alert if password is too short', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={{ navigate: jest.fn() }} />,
    );

    fireEvent.changeText(getByPlaceholderText('Username'), 'John');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), '123');

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',

        'Password must be at least 8 characters',
      );
    });
  });

  it('calls authService.register and saves token on success', async () => {
    (authService.register as jest.Mock).mockResolvedValue({
      status: 'success',

      data: {
        token: 'fake-token',
        user: { id: 1, username: 'John' },
      },
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Username'), 'John');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'memantra');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: 'John',
        email: 'john@memantra.com',
        password: 'memantra',
      });

      expect(storage.saveToken).toHaveBeenCalledWith('fake-token');
      expect(storage.saveUserData).toHaveBeenCalled();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Account created successfully!',

        expect.any(Array),
      );
    });
  });

  it('shows alert when register throws error', async () => {
    (authService.register as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Email already in use' } },
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Username'), 'John');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'memantra');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sign Up Failed', 'Email already in use');
    });
  });

  it('navigates to Login when pressing "Already have an account?"', () => {
    const { getByText } = setup();

    fireEvent.press(getByText('Already have an account? Login'));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('calls promptAsync when pressing "Sign Up with Google"', async () => {
    const mockPromptAsync = jest.fn();

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: {},
      response: null,
      promptAsync: mockPromptAsync,
    });

    const { getByText } = setup();

    fireEvent.press(getByText('Sign Up with Google'));

    expect(mockPromptAsync).toHaveBeenCalled();
  });

  it('shows alert if Google sign-up throws during promptAsync', async () => {
    const mockPromptAsync = jest.fn().mockRejectedValue(new Error('Google failed'));

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: true,
      response: null,
      promptAsync: mockPromptAsync,
    });

    const { getByText } = render(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    fireEvent.press(getByText(/Sign Up with Google/i));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to initiate Google sign-up');
    });
  });

  it('shows error alert if Google authentication fails', async () => {
    const fakeResponse = {
      type: 'success',
      authentication: { idToken: 'fake-token' },
    };

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: true,
      response: fakeResponse,
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Google login failed',
    });

    const { rerender } = render(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    rerender(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google login failed');
    });
  });

  it('does nothing if idToken is missing in Google response', async () => {
    const fakeResponse = { type: 'success', authentication: {} };

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: true,
      response: fakeResponse,
      promptAsync: jest.fn(),
    });

    render(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => expect(Alert.alert).not.toHaveBeenCalled());
  });

  it('saves token and user data on successful Google authentication', async () => {
    const fakeResponse = {
      type: 'success',
      authentication: { idToken: 'fake-token' },
    };

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: true,
      response: fakeResponse,
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        token: 'google-token',
        user: { id: 1, username: 'GoogleUser' },
      },
    });

    render(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(storage.saveToken).toHaveBeenCalledWith('google-token');
      expect(storage.saveUserData).toHaveBeenCalledWith({ id: 1, username: 'GoogleUser' });
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Account created with Google!');
    });
  });

  it('shows alert when Google authentication throws an error', async () => {
    const fakeResponse = {
      type: 'success',
      authentication: { idToken: 'fake-token' },
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: true,
      response: fakeResponse,
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockRejectedValue(new Error('Something went wrong'));

    render(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Google auth error:', expect.any(Error));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google authentication failed');
    });
  });

  it('shows fallback alert if Google auth returns error without message', async () => {
    const fakeResponse = {
      type: 'success',
      authentication: { idToken: 'fake-token' },
    };

    (useGoogleAuth as jest.Mock).mockReturnValue({
      request: true,
      response: fakeResponse,
      promptAsync: jest.fn(),
    });

    (authService.googleAuth as jest.Mock).mockResolvedValue({
      status: 'error',
      message: '',
    });

    render(<SignUpScreen navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google login failed');
    });
  });
});
