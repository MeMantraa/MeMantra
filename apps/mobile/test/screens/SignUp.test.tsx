import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../../screens/SignUp';
import { authService } from '../../services/auth.service';
import { storage } from '../../utils/storage';

// Jest mocks
jest.mock('../../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    saveToken: jest.fn(),
    saveUserData: jest.fn(),
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
describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    return render(<SignUpScreen navigation={{ navigate: mockNavigate, reset: mockReset }} />);
  };

  it('renders all input fields and buttons', () => {
    const { getByPlaceholderText, getByText } = setup();

    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();

    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
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
        code: '',
      });

      expect(storage.saveToken).toHaveBeenCalledWith('fake-token');
      expect(storage.saveUserData).toHaveBeenCalled();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Account created successfully!',
        expect.any(Array),
      );
    });
  }, 15000);

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
});
