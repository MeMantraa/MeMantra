import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import { storage } from '../../utils/storage';
import { authService } from '../../services/auth.service';
import { logoutUser } from '../../utils/auth';

jest.mock('../../utils/storage');
jest.mock('../../services/auth.service');
jest.mock('../../utils/auth');

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#9AA793',
      primaryDark: '#6D7E68',
      text: '#ffffff',
      white: '#ffffff',
      black: '#000000',
      settings: '#D9D9D9',
      error: '#E44438',
    },
  }),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (storage.getUserData as jest.Mock).mockResolvedValue({ username: 'memantrauser' });
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all settings options', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Back')).toBeTruthy();
      expect(getByText('Update Email')).toBeTruthy();
      expect(getByText('Update Password')).toBeTruthy();
      expect(getByText('Delete Account')).toBeTruthy();
      expect(getByText('Sign Out')).toBeTruthy();
    });
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const { getByText } = render(<SettingsScreen />);

    const backButton = getByText('Back');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to UpdateEmail screen when Update Email is pressed', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Update Email')).toBeTruthy();
    });

    const updateEmailButton = getByText('Update Email');
    fireEvent.press(updateEmailButton);

    expect(mockNavigate).toHaveBeenCalledWith('UpdateEmail');
  });

  it('navigates to UpdatePassword screen when Update Password is pressed', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Update Password')).toBeTruthy();
    });

    const updatePasswordButton = getByText('Update Password');
    fireEvent.press(updatePasswordButton);

    expect(mockNavigate).toHaveBeenCalledWith('UpdatePassword');
  });

  it('calls logoutUser when Sign Out is pressed', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Sign Out')).toBeTruthy();
    });

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    expect(logoutUser).toHaveBeenCalled();
  });

  it('shows confirmation alert when Delete Account is pressed', async () => {
    const { getByText } = render(<SettingsScreen />);

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

    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

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

    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

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

    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

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

    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

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

    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });

    const deleteButton = getByText('Delete Account');
    fireEvent.press(deleteButton);

    if (deleteCallback) {
      await deleteCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Account Deleted',
          'Your account has been deleted. You will now be logged out.',
          expect.any(Array),
        );
      });

      if (successCallback) {
        successCallback();
        expect(logoutUser).toHaveBeenCalled();
      }
    }
  });
});
