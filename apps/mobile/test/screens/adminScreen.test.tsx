import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AdminScreen from '../../screens/adminScreen';

import * as ThemeContext from '../../context/ThemeContext';
import { mantraService } from '../../services/mantra.service';
import { userService } from '../../services/user.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getFeedMantras: jest.fn(),
    createMantra: jest.fn(),
    updateMantra: jest.fn(),
    deleteMantra: jest.fn(),
  },
}));

jest.mock('../../services/user.service', () => ({
  userService: {
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      primary: '#000',
      secondary: '#333',
      primaryDark: '#111',
      text: '#222',
    },
  })),
}));

jest.spyOn(Alert, 'alert');

const fakeMantras = [
  {
    mantra_id: 1,
    title: 'Test Mantra',
    key_takeaway: 'Take a deep breath',
    created_at: '2024-01-01T00:00:00Z',
    is_active: true,
  },
];
const fakeUsers = [
  {
    user_id: 1,
    username: 'alice',
    email: 'alice@example.com',
    auth_provider: 'local',
    created_at: '2024-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (ThemeContext.useTheme as jest.Mock).mockReturnValue({
    colors: {
      primary: '#000',
      secondary: '#333',
      primaryDark: '#111',
      text: '#222',
    },
  });
});

describe('AdminScreen', () => {
  it('renders admin controls and toggles between Mantras/Users & Add/Manage', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });

    const { getByText } = render(<AdminScreen />);

    expect(getByText('Admin Controls')).toBeTruthy();
    expect(getByText(/Add a new mantra/i)).toBeTruthy();

    fireEvent.press(getByText('Manage'));
    await waitFor(() => {
      expect(getByText('Test Mantra')).toBeTruthy();
      expect(getByText('Take a deep breath')).toBeTruthy();
    });

    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    fireEvent.press(getByText('Users'));
    await waitFor(() => {
      expect(getByText(/Add a new user/i)).toBeTruthy();
    });

    fireEvent.press(getByText('Manage'));
    await waitFor(() => {
      expect(getByText('alice')).toBeTruthy();
      expect(getByText('alice@example.com')).toBeTruthy();
    });
  });

  it('submits MantraForm on Add when fields are filled', async () => {
    (mantraService.createMantra as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantra: fakeMantras[0] },
    });
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: [],
    });

    const { getByPlaceholderText, getByText } = render(<AdminScreen />);

    fireEvent.changeText(getByPlaceholderText('Title *'), 'Test Mantra');
    fireEvent.changeText(getByPlaceholderText('Key Takeaway *'), 'Take a deep breath');
    fireEvent.press(getByText('Add Mantra'));

    await waitFor(() => {
      expect(mantraService.createMantra).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Mantra', key_takeaway: 'Take a deep breath' }),
        'mock-token',
      );
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Mantra created successfully');
    });
  });

  it('shows alert when mantra fields are missing', async () => {
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Add Mantra'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Title and key takeaway are required');
    });
  });

  it('submits UserForm on Add when fields are filled', async () => {
    (userService.createUser as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { user: fakeUsers[0] },
    });
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: [] },
    });

    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => {});

    fireEvent.changeText(getByPlaceholderText('Username *'), 'alice');
    fireEvent.changeText(getByPlaceholderText('Email *'), 'alice@example.com');
    fireEvent.changeText(getByPlaceholderText('Password *'), 'password123');
    fireEvent.press(getByText('Add User'));

    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123',
        }),
        'mock-token',
      );
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'User created successfully');
    });
  });

  it('shows alert when user fields are missing', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: [] },
    });

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => {});
    fireEvent.press(getByText('Add User'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'All fields are required');
    });
  });

  it('shows and closes edit modal when clicking Edit in Manage', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });

    const { getByText, getAllByText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Test Mantra')).toBeTruthy());

    fireEvent.press(getByText('Edit'));

    await waitFor(() => {
      expect(getAllByText(/Edit Mantra/i).length).toBeGreaterThan(0);
    });

    fireEvent.press(getByText('✕'));
    await waitFor(() => {
      expect(queryByText(/Edit Mantra/i)).toBeNull();
    });
  });
});
