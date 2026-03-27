import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../screens/ProfileScreen';
import { storage } from '../../utils/storage';
import { userService } from '../../services/user.service';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

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

jest.mock('../../utils/storage');
jest.mock('../../services/user.service');
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#9AA793',
      primaryDark: '#6D7E68',
      text: '#ffffff',
      white: '#ffffff',
    },
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getUserData as jest.Mock).mockResolvedValue({ username: 'memantrauser' });
    (storage.getToken as jest.Mock).mockResolvedValue('test-token');
    (storage.getUserId as jest.Mock).mockResolvedValue(1);
    (userService.getUserById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { user: { user_id: 1, username: 'memantrauser', profile_photo: null } },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all options', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('memantrauser')).toBeTruthy();
      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Liked')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });
  });

  it('loads and displays username from storage', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('memantrauser')).toBeTruthy();
    });

    expect(storage.getUserData).toHaveBeenCalledTimes(1);
  });

  it('handles missing username in userData by setting empty string', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({ username: null });
    (userService.getUserById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { user: { user_id: 1, username: null, profile_photo: null } },
    });

    const { queryByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(storage.getUserData).toHaveBeenCalledTimes(1);
    });

    const usernameElement = queryByText('memantrauser');
    expect(usernameElement).toBeNull();
  });

  it('navigates to Reminders screen when Reminders is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Reminders')).toBeTruthy();
    });

    const remindersButton = getByText('Reminders');
    fireEvent.press(remindersButton);

    expect(mockNavigate).toHaveBeenCalledWith('Reminders');
  });

  it('navigates to NotificationSettings screen when Notifications is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Notifications')).toBeTruthy();
    });

    const notificationsButton = getByText('Notifications');
    fireEvent.press(notificationsButton);

    expect(mockNavigate).toHaveBeenCalledWith('NotificationSettings');
  });

  it('navigates to Liked screen when Liked is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Liked')).toBeTruthy();
    });

    const likedButton = getByText('Liked');
    fireEvent.press(likedButton);

    expect(mockNavigate).toHaveBeenCalledWith('Liked');
  });

  it('navigates to Settings screen when Settings is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
    });

    const settingsButton = getByText('Settings');
    fireEvent.press(settingsButton);

    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('calls getUserById on mount to fetch profile data', async () => {
    render(<ProfileScreen />);

    await waitFor(() => {
      expect(userService.getUserById).toHaveBeenCalledWith(1, 'test-token');
    });
  });

  it('loads user data from storage and server', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(storage.getUserData).toHaveBeenCalled();
      expect(userService.getUserById).toHaveBeenCalledWith(1, 'test-token');
    });

    expect(getByText('memantrauser')).toBeTruthy();
  });

  it('loads user profile photo from server on mount', async () => {
    (userService.getUserById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { user: { user_id: 1, username: 'testuser', profile_photo: 'data:image/jpeg;base64,abc123' } },
    });

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(userService.getUserById).toHaveBeenCalledWith(1, 'test-token');
    });
  });
});
