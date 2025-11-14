import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AdminScreen from '../../screens/adminScreen';

import * as ThemeContext from '../../context/ThemeContext';
import { mantraService } from '../../services/mantra.service';
import { userService } from '../../services/user.service';

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
  }, 15000);

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

// EXTENDED COVERAGE

describe('AdminScreen (extended coverage)', () => {
  it('shows error alert if loading mantras fails', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockRejectedValue(new Error('API fail'));
    render(<AdminScreen />);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load mantras');
    });
  });

  it('shows error alert if loading users fails', async () => {
    (userService.getAllUsers as jest.Mock).mockRejectedValue(new Error('API fail'));
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users')); // trigger loadData for users
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load users');
    });
  });

  it('shows error alert if create mantra API fails', async () => {
    (mantraService.createMantra as jest.Mock).mockRejectedValue(new Error('fail'));
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({ status: 'success', data: [] });
    const { getByPlaceholderText, getByText } = render(<AdminScreen />);
    fireEvent.changeText(getByPlaceholderText('Title *'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Key Takeaway *'), 'Take');
    fireEvent.press(getByText('Add Mantra'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create mantra');
    });
  });

  it('shows error alert if update mantra API fails', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (mantraService.updateMantra as jest.Mock).mockRejectedValue(new Error('fail'));
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Edit')).toBeTruthy());
    fireEvent.press(getByText('Edit'));
    // Press the correct button for editing.
    fireEvent.press(getByText('Update Mantra')); // NOT "Save Changes"
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update mantra');
    });
  });

  it('shows error alert if delete mantra API fails', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (mantraService.deleteMantra as jest.Mock).mockRejectedValue(new Error('fail'));
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));

    // Simulate pressing "Delete" on the alert dialog
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    deleteCallback();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete mantra');
    });
  });

  it('shows error alert if create user API fails', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: [] },
    });
    (userService.createUser as jest.Mock).mockRejectedValue({
      response: { data: { message: 'User exists' } },
    });
    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => {});
    fireEvent.changeText(getByPlaceholderText('Username *'), 'alice');
    fireEvent.changeText(getByPlaceholderText('Email *'), 'alice@example.com');
    fireEvent.changeText(getByPlaceholderText('Password *'), 'password123');
    fireEvent.press(getByText('Add User'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'User exists');
    });
  });

  it('shows error alert if update user API fails', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    (userService.updateUser as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Failed update' } },
    });
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Update User'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed update');
    });
  });

  it('shows error alert if delete user API fails', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    (userService.deleteUser as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Delete fail' } },
    });
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));
    fireEvent.press(getByText('Delete'));

    // Simulate pressing "Delete" on the alert dialog
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    deleteCallback();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Delete fail');
    });
  });

  it('updates mantra and closes modal', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (mantraService.updateMantra as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantra: { ...fakeMantras[0], title: 'Changed' } },
    });
    const { getByText, getByPlaceholderText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Edit')).toBeTruthy());
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByPlaceholderText('Title *'), 'Changed');
    fireEvent.press(getByText('Update Mantra')); // NOT "Save Changes"
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Mantra updated successfully');
      expect(queryByText(/Edit Mantra/i)).toBeNull();
    });
  });

  it('updates user and closes modal', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    (userService.updateUser as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { user: { ...fakeUsers[0], username: 'bob' } },
    });
    const { getByText, getByPlaceholderText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByPlaceholderText('Username *'), 'bob');
    fireEvent.press(getByText('Update User')); // NOT "Save Changes"
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'User updated successfully');
      expect(queryByText(/Edit User/i)).toBeNull();
    });
  });

  it('shows Alert on deleting mantra and confirms press', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));
    // Confirm dialog is shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Mantra',
      expect.stringContaining('Test Mantra'),
      expect.any(Array),
    );
  });

  it('shows Alert on deleting user and confirms press', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));
    fireEvent.press(getByText('Delete'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete User',
      expect.stringContaining('alice'),
      expect.any(Array),
    );
  });
});
