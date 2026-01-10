import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../../screens/ProfileScreen';
import { storage } from '../../utils/storage';
import { authService } from '../../services/auth.service';
import { logoutUser } from '../../utils/auth';

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
jest.mock('../../services/auth.service');
jest.mock('../../utils/auth');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (storage.getUserData as jest.Mock).mockResolvedValue({ username: 'memantrauser' });
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all options', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({ username: 'memantrauser' });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(
      () => {
        expect(getByText('memantrauser')).toBeTruthy();
        expect(getByText('Update Email')).toBeTruthy();
        expect(getByText('Update Password')).toBeTruthy();
        expect(getByText('Delete Account')).toBeTruthy();
        expect(getByText('Sign Out')).toBeTruthy();
      },
      { timeout: 10000 },
    );
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

  it('navigates to UpdateEmail screen when Update Email is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Update Email')).toBeTruthy();
    });

    const updateEmailButton = getByText('Update Email');
    fireEvent.press(updateEmailButton);

    expect(mockNavigate).toHaveBeenCalledWith('UpdateEmail');
  });

  it('navigates to UpdatePassword screen when Update Password is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Update Password')).toBeTruthy();
    });

    const updatePasswordButton = getByText('Update Password');
    fireEvent.press(updatePasswordButton);

    expect(mockNavigate).toHaveBeenCalledWith('UpdatePassword');
  });

  it('calls logoutUser when Sign Out is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Sign Out')).toBeTruthy();
    });

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
    });
  });

  it('shows confirmation alert when Delete Account is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Account',
      'Are you absolutely sure you want to permanently delete your account? This action cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ]),
    );
  });

  it('successfully deletes account and logs out user', async () => {
    (authService.deleteAccount as jest.Mock).mockResolvedValue({ success: true });
    let deleteCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Delete Account' && buttons && buttons[1]) {
        deleteCallback = buttons[1].onPress;
      }
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalled();

    // Simulate pressing
    if (deleteCallback) {
      await deleteCallback();

      await waitFor(() => {
        expect(storage.getToken).toHaveBeenCalled();
        expect(authService.deleteAccount).toHaveBeenCalledWith('mock-token');
      });
    }
  });

  it('shows error when token is not available during delete', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    let deleteCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Delete Account' && buttons && buttons[1]) {
        deleteCallback = buttons[1].onPress;
      }
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    // Simulate pressing Delete
    if (deleteCallback) {
      await deleteCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Not authenticated.');
        expect(authService.deleteAccount).not.toHaveBeenCalled();
      });
    }
  });

  it('handles delete account error with response data', async () => {
    const errorMessage = 'Account deletion failed';
    (authService.deleteAccount as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });
    let deleteCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Delete Account' && buttons && buttons[1]) {
        deleteCallback = buttons[1].onPress;
      }
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    // Simulate pressing Delete
    if (deleteCallback) {
      await deleteCallback();

      await waitFor(() => {
        expect(authService.deleteAccount).toHaveBeenCalledWith('mock-token');
        expect(Alert.alert).toHaveBeenCalledWith('Error', errorMessage);
      });
    }
  });

  it('handles delete account error without response data using fallback', async () => {
    (authService.deleteAccount as jest.Mock).mockRejectedValue({});
    let deleteCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Delete Account' && buttons && buttons[1]) {
        deleteCallback = buttons[1].onPress;
      }
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    // Simulate pressing Delete
    if (deleteCallback) {
      await deleteCallback();

      await waitFor(() => {
        expect(authService.deleteAccount).toHaveBeenCalledWith('mock-token');
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete account.');
      });
    }
  });

  it('calls logoutUser when OK is pressed after successful account deletion', async () => {
    (authService.deleteAccount as jest.Mock).mockResolvedValue({ success: true });
    let deleteCallback: any;
    let successCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Delete Account' && buttons && buttons[1]) {
        deleteCallback = buttons[1].onPress;
      } else if (title === 'Account Deleted' && buttons && buttons[0]) {
        successCallback = buttons[0].onPress;
      }
    });

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    // Simulate pressing Delete
    if (deleteCallback) {
      await deleteCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Account Deleted',
          'Your account has been deleted. You will now be logged out.',
          expect.any(Array),
        );
      });

      // Simulate pressing OK
      if (successCallback) {
        successCallback();
        expect(logoutUser).toHaveBeenCalled();
      }
    }
  });
});
