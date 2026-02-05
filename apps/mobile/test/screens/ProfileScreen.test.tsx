import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../screens/ProfileScreen';
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

jest.mock('../../utils/storage');
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all options', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('memantrauser')).toBeTruthy();
      expect(getByText('Profile Photo Goes Here')).toBeTruthy();
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
});
