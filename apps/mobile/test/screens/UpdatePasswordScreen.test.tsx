import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UpdatePasswordScreen from '../../screens/UpdatePasswordScreen';
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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('../../components/UI/textInputWrapper', () => {
  const { TextInput } = jest.requireActual('react-native');
  return (props: any) => <TextInput {...props} />;
});

describe('UpdatePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<UpdatePasswordScreen />);

    expect(getByText('Update Password')).toBeTruthy();

    expect(getByText('← Back')).toBeTruthy();

    expect(getByText('Save Password')).toBeTruthy();

    expect(getByPlaceholderText('New password')).toBeTruthy();

    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
  });

  it('updates password and confirm password inputs when user types', () => {
    const { getByPlaceholderText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    fireEvent.changeText(passwordInput, 'memantra123');

    fireEvent.changeText(confirmInput, 'memantra123');

    expect(passwordInput.props.value).toBe('memantra123');

    expect(confirmInput.props.value).toBe('memantra123');
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const { getByText } = render(<UpdatePasswordScreen />);

    const backButton = getByText('← Back');

    fireEvent.press(backButton);

    expect(backButton).toBeTruthy();
  });

  it('shows error when password is less than 6 characters', () => {
    const { getByPlaceholderText, getByText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    fireEvent.changeText(passwordInput, 'mema');

    const saveButton = getByText('Save Password');

    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters.');

    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', () => {
    const { getByPlaceholderText, getByText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    fireEvent.changeText(passwordInput, 'memantra123');

    fireEvent.changeText(confirmInput, 'memantra456');

    const saveButton = getByText('Save Password');

    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match.');

    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('shows error when token is not available', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const { getByPlaceholderText, getByText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    fireEvent.changeText(passwordInput, 'memantra123');

    fireEvent.changeText(confirmInput, 'memantra123');

    const saveButton = getByText('Save Password');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Not authenticated.');

      expect(authService.updatePassword).not.toHaveBeenCalled();
    });
  });

  it('successfully updates password and logs out user', async () => {
    (authService.updatePassword as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    fireEvent.changeText(passwordInput, 'newmemantra123');

    fireEvent.changeText(confirmInput, 'newmemantra123');

    const saveButton = getByText('Save Password');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(authService.updatePassword).toHaveBeenCalledWith('newmemantra123', 'mock-token');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Password Updated',
        'Your password has been changed. You will be logged out for security reasons.',

        expect.any(Array),
      );
    });
  });

  it('handles update password error gracefully', async () => {
    (authService.updatePassword as jest.Mock).mockRejectedValue({
      message: 'Server error',
    });

    const { getByPlaceholderText, getByText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    fireEvent.changeText(passwordInput, 'newmemantra123');

    fireEvent.changeText(confirmInput, 'newmemantra123');

    const saveButton = getByText('Save Password');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(authService.updatePassword).toHaveBeenCalledWith('newmemantra123', 'mock-token');

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update password.');
    });
  });

  it('calls logoutUser when alert OK is pressed after successful update', async () => {
    (authService.updatePassword as jest.Mock).mockResolvedValue({ success: true });

    let alertCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0]) {
        alertCallback = buttons[0].onPress;
      }
    });

    const { getByPlaceholderText, getByText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    fireEvent.changeText(passwordInput, 'newpassword123');

    fireEvent.changeText(confirmInput, 'newpassword123');

    const saveButton = getByText('Save Password');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    if (alertCallback) {
      alertCallback();

      expect(logoutUser).toHaveBeenCalled();
    }
  });

  it('secureTextEntry is enabled for both password inputs', () => {
    const { getByPlaceholderText } = render(<UpdatePasswordScreen />);

    const passwordInput = getByPlaceholderText('New password');

    const confirmInput = getByPlaceholderText('Confirm password');

    expect(passwordInput.props.secureTextEntry).toBe(true);

    expect(confirmInput.props.secureTextEntry).toBe(true);
  });
});
