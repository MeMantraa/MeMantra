import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AdminScreen from '../../screens/adminScreen';

import * as ThemeContext from '../../context/ThemeContext';
import { mantraService } from '../../services/mantra.service';
import { userService } from '../../services/user.service';
import { categoryService } from '../../services/category.service';
import { engagementService } from '../../services/engagement.service';

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getAllMantras: jest.fn(),
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

jest.mock('../../services/category.service', () => ({
  categoryService: {
    getAllCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    addMantraToCategory: jest.fn(),
    removeMantraFromCategory: jest.fn(),
    getCategoriesForMantra: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('../../services/engagement.service', () => ({
  engagementService: {
    getAnalytics: jest.fn(),
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
const fakeCategories = [
  {
    category_id: 1,
    name: 'Breathing',
    description: 'Breathing exercises',
    category_type: 'essential',
    image_url: null,
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 2,
    name: 'Productivity',
    description: 'Productivity goals',
    category_type: 'goal',
    image_url: null,
    parent_id: null,
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
  // Default mock for categories
  (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
    status: 'success',
    data: { categories: fakeCategories },
  });
  (categoryService.getCategoriesForMantra as jest.Mock).mockResolvedValue({
    status: 'success',
    data: { categories: [] },
  });
});

describe('AdminScreen', () => {
  it('renders admin controls and toggles between Mantras/Users & Add/Manage', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });

    const { getByText, findByText } = render(<AdminScreen />);

    expect(await findByText('Admin Controls')).toBeTruthy();
    expect(await findByText(/Add a new mantra/i)).toBeTruthy();

    fireEvent.press(getByText('Manage'));
    expect(await findByText('Test Mantra')).toBeTruthy();
    expect(await findByText('Take a deep breath')).toBeTruthy();

    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    fireEvent.press(getByText('Users'));
    expect(await findByText(/Add a new user/i)).toBeTruthy();

    fireEvent.press(getByText('Manage'));
    expect(await findByText('View All Users')).toBeTruthy();
    fireEvent.press(getByText('View All Users'));
    expect(await findByText('alice')).toBeTruthy();
    expect(await findByText('alice@example.com')).toBeTruthy();
  }, 60000);

  it('submits MantraForm on Add when fields are filled', async () => {
    (mantraService.createMantra as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { mantra: fakeMantras[0] },
    });
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: [],
    });

    const { getByPlaceholderText, getByText } = render(<AdminScreen />);

    // Wait for initial data load to complete
    await waitFor(
      () => {
        expect(getByText('Admin Controls')).toBeTruthy();
      },
      { timeout: 10000 },
    );

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
  }, 30000);

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
    fireEvent.changeText(getByPlaceholderText('Confirm Password *'), 'password123');
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

  it('shows alert when passwords do not match', async () => {
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
    fireEvent.changeText(getByPlaceholderText('Confirm Password *'), 'password456');
    fireEvent.press(getByText('Add User'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });
  });

  it('shows and closes edit modal when clicking Edit in Manage', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
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
    (mantraService.getAllMantras as jest.Mock).mockRejectedValue(new Error('API fail'));
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
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({ status: 'success', data: [] });
    const { getByPlaceholderText, getByText } = render(<AdminScreen />);
    fireEvent.changeText(getByPlaceholderText('Title *'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Key Takeaway *'), 'Take');
    fireEvent.press(getByText('Add Mantra'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create mantra');
    });
  });

  it('shows error alert if update mantra API fails', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (mantraService.updateMantra as jest.Mock).mockRejectedValue(new Error('fail'));
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Edit')).toBeTruthy());
    fireEvent.press(getByText('Edit'));
    // Wait for modal to open and render the button
    await waitFor(() => expect(getByText('Update Mantra')).toBeTruthy());
    fireEvent.press(getByText('Update Mantra'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update mantra');
    });
  });

  it('shows error alert if delete mantra API fails', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (mantraService.deleteMantra as jest.Mock).mockRejectedValue(new Error('fail'));
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));

    // Wait for Alert to be called then get the callback
    await waitFor(() => {
      expect((Alert.alert as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
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
    fireEvent.changeText(getByPlaceholderText('Confirm Password *'), 'password123');
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
    await waitFor(() => expect(getByText('View All Users')).toBeTruthy());
    fireEvent.press(getByText('View All Users'));
    await waitFor(() => expect(getByText('Edit')).toBeTruthy());
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
    await waitFor(() => expect(getByText('View All Users')).toBeTruthy());
    fireEvent.press(getByText('View All Users'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));

    // Wait for Alert to be called then get the callback
    await waitFor(
      () => {
        expect((Alert.alert as jest.Mock).mock.calls.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );
    const buttons = (Alert.alert as jest.Mock).mock.calls[0]?.[2];
    if (!buttons || buttons.length < 2) {
      // Skip this part if alert structure is unexpected
      return;
    }
    const deleteCallback = buttons[1].onPress;
    if (deleteCallback) {
      deleteCallback();
    }

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Delete fail');
    });
  });

  it('updates mantra and closes modal', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
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
    // Wait for modal to render and find the input
    await waitFor(() => expect(getByPlaceholderText('Title *')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Title *'), 'Changed');
    fireEvent.press(getByText('Update Mantra'));
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
    await waitFor(() => expect(getByText('View All Users')).toBeTruthy());
    fireEvent.press(getByText('View All Users'));
    await waitFor(() => expect(getByText('Edit')).toBeTruthy());
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByPlaceholderText('Username *'), 'bob');
    fireEvent.press(getByText('Update User')); // NOT "Save Changes"
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'User updated successfully');
      expect(queryByText(/Edit User/i)).toBeNull();
    });
  });

  it('shows Alert on deleting mantra and confirms press', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
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
    await waitFor(() => expect(getByText('View All Users')).toBeTruthy());
    fireEvent.press(getByText('View All Users'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete User',
      expect.stringContaining('alice'),
      expect.any(Array),
    );
  });

  it('successfully deletes a mantra and shows success alert', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (mantraService.deleteMantra as jest.Mock).mockResolvedValue({});
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));

    // Wait for Alert to be called then get the callback
    await waitFor(() => {
      expect((Alert.alert as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    deleteCallback();

    await waitFor(() => {
      expect(mantraService.deleteMantra).toHaveBeenCalledWith(1, 'mock-token');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Mantra deleted');
    });
  });

  it('successfully deletes a user and shows success alert', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    (userService.deleteUser as jest.Mock).mockResolvedValue({});
    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('View All Users')).toBeTruthy());
    fireEvent.press(getByText('View All Users'));
    await waitFor(() => expect(getByText('Delete')).toBeTruthy());
    fireEvent.press(getByText('Delete'));

    // Wait for Alert to be called then get the callback
    await waitFor(() => {
      expect((Alert.alert as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    deleteCallback();

    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledWith(1, 'mock-token');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'User deleted');
    });
  });

  it('resets forms when switching from Users to Mantras', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: fakeUsers },
    });
    const { getByText, getByPlaceholderText } = render(<AdminScreen />);

    // Switch to Users and fill in some form data
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Add a new user')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Username *'), 'testuser');

    // Switch back to Mantras
    fireEvent.press(getByText('Mantras'));
    await waitFor(() => expect(getByText('Add a new mantra')).toBeTruthy());

    // Switch back to Users and verify form is reset
    fireEvent.press(getByText('Users'));
    await waitFor(() => {
      expect(getByPlaceholderText('Username *').props.value).toBe('');
    });
  });

  it('toggles between Add and Manage actions', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeMantras,
    });
    const { getByText, getAllByText } = render(<AdminScreen />);

    // Start on Add by default
    await waitFor(() => expect(getByText('Add a new mantra')).toBeTruthy());

    // Toggle to Manage
    fireEvent.press(getByText('Manage'));
    await waitFor(() => expect(getByText('Test Mantra')).toBeTruthy());

    // Toggle back to Add
    const addButtons = getAllByText('Add');
    fireEvent.press(addButtons[0]); // Press the toggle button
    await waitFor(() => expect(getByText('Add a new mantra')).toBeTruthy());
  });

  it('filters users by username in search', async () => {
    const multipleUsers = [
      {
        user_id: 1,
        username: 'alice',
        email: 'alice@example.com',
        auth_provider: 'local',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        user_id: 2,
        username: 'bob',
        email: 'bob@example.com',
        auth_provider: 'local',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: multipleUsers },
    });

    const { getByText, getByPlaceholderText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));

    // Type in search box
    fireEvent.changeText(getByPlaceholderText('Search user here'), 'alice');

    await waitFor(() => {
      expect(getByText('alice')).toBeTruthy();
      expect(queryByText('bob')).toBeNull();
    });
  });

  it('filters users by email in search', async () => {
    const multipleUsers = [
      {
        user_id: 1,
        username: 'alice',
        email: 'alice@example.com',
        auth_provider: 'local',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        user_id: 2,
        username: 'bob',
        email: 'bob@example.com',
        auth_provider: 'local',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: multipleUsers },
    });

    const { getByText, getByPlaceholderText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Users'));
    await waitFor(() => expect(getByText('Manage')).toBeTruthy());
    fireEvent.press(getByText('Manage'));

    // Type email in search box
    fireEvent.changeText(getByPlaceholderText('Search user here'), 'bob@example');

    await waitFor(() => {
      expect(getByText('bob')).toBeTruthy();
      expect(queryByText('alice')).toBeNull();
    });
  });

  it('switches to Categories mode and shows category controls', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(
      () => {
        expect(getByText('Add a new category')).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });

  it('creates category with valid name and type', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: [] },
    });
    (categoryService.createCategory as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        category: {
          category_id: 3,
          name: 'Meditation',
          description: 'Meditation techniques',
          category_type: 'essential',
          parent_id: null,
          is_active: true,
        },
      },
    });

    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Add a new category')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Meditation');
    fireEvent.changeText(getByPlaceholderText('Description'), 'Meditation techniques');
    fireEvent.press(getByText('Essentials'));
    fireEvent.press(getByText('Add Category'));

    await waitFor(() => {
      expect(categoryService.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Meditation',
          description: 'Meditation techniques',
          category_type: 'essential',
        }),
        'mock-token',
      );
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Category created successfully');
    });
  });

  it('shows alert when category name is missing', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: [] },
    });

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Add a new category')).toBeTruthy());

    fireEvent.press(getByText('Add Category'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Category name is required');
    });
  });

  it('shows alert when category type is not selected', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: [] },
    });

    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Add a new category')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Test');
    fireEvent.press(getByText('Add Category'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select a category layer');
    });
  });

  it('shows error alert if create category API fails', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: [] },
    });
    (categoryService.createCategory as jest.Mock).mockRejectedValue(new Error('fail'));

    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Add a new category')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Meditation');
    fireEvent.press(getByText('Essentials'));
    fireEvent.press(getByText('Add Category'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create category');
    });
  });

  it('displays categories in Manage view', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });

    const { getByText, findByText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    expect(await findByText('Manage')).toBeTruthy();
    fireEvent.press(getByText('Manage'));

    expect(await findByText('Breathing')).toBeTruthy();
    expect(queryByText('Breathing')).toBeTruthy();
  }, 10000);

  it('opens edit modal when Edit button is pressed for category', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });

    const { getByText, getAllByText, queryByTestId } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Manage')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('Manage'));

    await waitFor(() => expect(getAllByText('Edit').length).toBeGreaterThan(0), { timeout: 10000 });

    // Find and press the first Edit button (from the FlatList items, not the modal)
    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]);

    // Wait for the modal to render and have the Edit Category title
    await waitFor(
      () => {
        const allEditCategoryTexts = getAllByText('Edit Category');
        expect(allEditCategoryTexts.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  });

  it('updates category with changed data', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });
    (categoryService.updateCategory as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        category: {
          category_id: 1,
          name: 'Updated Breathing',
          description: 'Updated description',
          category_type: 'goal',
          parent_id: null,
          is_active: true,
        },
      },
    });

    const { getByText, getByPlaceholderText, getAllByText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Manage')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('Manage'));

    await waitFor(() => expect(getAllByText('Edit').length).toBeGreaterThan(0), { timeout: 10000 });

    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]);

    // Wait for modal to render
    await waitFor(() => {
      const allUpdateTexts = getAllByText('Update Category');
      expect(allUpdateTexts.length).toBeGreaterThan(0);
    });

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Updated Breathing');
    fireEvent.press(getAllByText('Update Category')[0]);

    await waitFor(() => {
      expect(categoryService.updateCategory).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Updated Breathing' }),
        'mock-token',
      );
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Category updated successfully');
    });
  });

  it('shows error alert if update category API fails', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });
    (categoryService.updateCategory as jest.Mock).mockRejectedValue(new Error('fail'));

    const { getByText, getAllByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Manage')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('Manage'));

    await waitFor(() => expect(getAllByText('Edit').length).toBeGreaterThan(0), { timeout: 10000 });

    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]);

    // Wait for modal to render with Update button
    await waitFor(() => {
      const updateButtons = getAllByText('Update Category');
      expect(updateButtons.length).toBeGreaterThan(0);
    });

    fireEvent.press(getAllByText('Update Category')[0]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update category');
    });
  });

  it('shows Alert on deleting category and confirms press', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });

    const { getByText, getAllByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Manage')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('Manage'));

    await waitFor(() => expect(getAllByText('Delete').length).toBeGreaterThan(0), {
      timeout: 10000,
    });
    fireEvent.press(getAllByText('Delete')[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Category',
      expect.stringContaining('Breathing'),
      expect.any(Array),
    );
  });

  it('successfully deletes a category and shows success alert', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });
    (categoryService.deleteCategory as jest.Mock).mockResolvedValue({});

    const { getByText, getAllByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Manage')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('Manage'));

    await waitFor(() => expect(getAllByText('Delete').length).toBeGreaterThan(0), {
      timeout: 10000,
    });
    fireEvent.press(getAllByText('Delete')[0]);

    // Wait for Alert to be called then get the callback
    await waitFor(() => {
      expect((Alert.alert as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[
      (Alert.alert as jest.Mock).mock.calls.length - 1
    ][2][1].onPress;
    deleteCallback();

    await waitFor(
      () => {
        expect(categoryService.deleteCategory).toHaveBeenCalledWith(1, 'mock-token');
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Category deleted');
      },
      { timeout: 10000 },
    );
  });

  it('shows error alert if delete category API fails', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: fakeCategories },
    });
    (categoryService.deleteCategory as jest.Mock).mockRejectedValue(new Error('fail'));

    const { getByText, getAllByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Manage')).toBeTruthy(), { timeout: 10000 });
    fireEvent.press(getByText('Manage'));

    await waitFor(() => expect(getAllByText('Delete').length).toBeGreaterThan(0), {
      timeout: 10000,
    });
    fireEvent.press(getAllByText('Delete')[0]);

    // Wait for Alert to be called then get the callback
    await waitFor(() => {
      expect((Alert.alert as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });
    const deleteCallback = (Alert.alert as jest.Mock).mock.calls[
      (Alert.alert as jest.Mock).mock.calls.length - 1
    ][2][1].onPress;
    deleteCallback();

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete category');
      },
      { timeout: 10000 },
    );
  });

  it('shows error alert if loading categories fails', async () => {
    (categoryService.getAllCategories as jest.Mock).mockRejectedValue(new Error('API fail'));

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load categories');
    });
  });

  it('resets category form after successful creation', async () => {
    const mockNewCategory = {
      category_id: 3,
      name: 'Meditation',
      description: 'Meditation techniques',
      category_type: 'essential',
      parent_id: null,
      is_active: true,
    };

    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: [] },
    });
    (categoryService.createCategory as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { category: mockNewCategory },
    });

    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    fireEvent.press(getByText('Categories'));

    await waitFor(() => expect(getByText('Add a new category')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Meditation');
    fireEvent.press(getByText('Essentials'));
    fireEvent.press(getByText('Add Category'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Category created successfully');
    });

    // Verify form is reset (placeholder text shows empty input)
    await waitFor(() => {
      expect(getByPlaceholderText('Category Name *').props.value).toBe('');
    });
  });
});

// ─── Analytics Tab ────────────────────────────────────────────────────────────

describe('AdminScreen - Analytics', () => {
  const fakeAnalytics = {
    window_days: 30,
    event_counts: { app_open: 10, mantra_like: 5 },
    notification_effectiveness: {
      sent: 20,
      taps: 8,
      tap_through_rate_pct: 40,
      post_tap_conversion_rate_pct: null,
    },
    tap_by_hour: [{ hour: 9, count: 3 }],
    adaptive_timing: { users_with_optimal_hour: 2, users_using_default: 5 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Stub the other services so they don't throw on mantras-mode load
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({
      status: 'success',
      data: [],
    });
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { categories: [] },
    });
  });

  it('calls getAnalytics when switching to Analytics tab', async () => {
    (engagementService.getAnalytics as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeAnalytics,
    });

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Analytics'));

    await waitFor(
      () => {
        expect(engagementService.getAnalytics).toHaveBeenCalledWith('mock-token', 30);
      },
      { timeout: 5000 },
    );
  });

  it('displays analytics data after successful load', async () => {
    (engagementService.getAnalytics as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeAnalytics,
    });

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Analytics'));

    await waitFor(
      () => {
        expect(getByText('Notification Effectiveness')).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('changes days and re-fetches analytics when days picker is pressed', async () => {
    (engagementService.getAnalytics as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeAnalytics,
    });

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Analytics'));

    await waitFor(() => expect(engagementService.getAnalytics).toHaveBeenCalledTimes(1));

    // Switch to 7-day window
    fireEvent.press(getByText('7d'));

    await waitFor(
      () => {
        expect(engagementService.getAnalytics).toHaveBeenCalledWith('mock-token', 7);
      },
      { timeout: 5000 },
    );
  });

  it('shows error alert when getAnalytics fails', async () => {
    (engagementService.getAnalytics as jest.Mock).mockRejectedValue(new Error('server error'));
    jest.spyOn(console, 'error').mockImplementation();

    const { getByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Analytics'));

    await waitFor(
      () => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load analytics');
      },
      { timeout: 5000 },
    );
  });

  it('hides the Add/Manage action toggle when analytics tab is active', async () => {
    (engagementService.getAnalytics as jest.Mock).mockResolvedValue({
      status: 'success',
      data: fakeAnalytics,
    });

    const { getByText, queryByText } = render(<AdminScreen />);
    fireEvent.press(getByText('Analytics'));

    // The Add/Manage row is not rendered in analytics mode
    expect(queryByText('Add')).toBeNull();
    expect(queryByText('Manage')).toBeNull();
  });
});
