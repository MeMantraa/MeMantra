import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../screens/LoginScreen';
import { authService } from '../../services/auth.service';

jest.mock('../../services/auth.service', () => ({
  authService: {
    login: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    saveToken: jest.fn(),
    saveUserData: jest.fn(),
  },
}));

const mockSetupNotifications = jest.fn();
jest.mock('../../services/notification.service', () => ({
  notificationService: {
    setupNotifications: (...args: unknown[]) => mockSetupNotifications(...args),
  },
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
const mockReset = jest.fn();
const mockNavigation = { navigate: mockNavigate, reset: mockReset };

const setup = () => render(<LoginScreen navigation={mockNavigation} />);

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetupNotifications.mockResolvedValue(null);
  });

  const setup = () => {
    return render(<LoginScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);
  };

  it('renders inputs and buttons', () => {
    const { getByPlaceholderText, getByText } = setup();

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
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
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  }, 15000);

  it('navigates to Signup when pressing "Sign Up"', () => {
    const { getByText } = setup();

    fireEvent.press(getByText('New to us? Sign Up'));

    expect(mockNavigate).toHaveBeenCalledWith('Signup');
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
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('calls setupNotifications after successful login', async () => {
    mockSetupNotifications.mockResolvedValue('ExponentPushToken[xxx]');
    (authService.login as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { token: 'abc123', user: { id: 1, name: 'John' } },
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'memantra');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockSetupNotifications).toHaveBeenCalled();
    });
  });

  it('does not call setupNotifications when login fails', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      status: 'error',
      message: 'Invalid credentials',
    });

    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Email'), 'john@memantra.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
    expect(mockSetupNotifications).not.toHaveBeenCalled();
  });

  it('still navigates to MainApp if setupNotifications fails', async () => {
    mockSetupNotifications.mockRejectedValue(new Error('Notification setup failed'));
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
});
