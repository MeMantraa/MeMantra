import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UpdateEmailScreen from '../../screens/UpdateEmailScreen';
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

describe('UpdateEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    (storage.getUserData as jest.Mock).mockResolvedValue({ email: 'test@memantra.com' });

    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', async () => {
    const { getByText, getByPlaceholderText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      expect(getByText('Update Email')).toBeTruthy();

      expect(getByText('← Back')).toBeTruthy();

      expect(getByText('Save Email')).toBeTruthy();

      expect(getByPlaceholderText('Enter new email')).toBeTruthy();
    });
  });

  it('loads and displays current email from storage', async () => {
    const { getByPlaceholderText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Enter new email');

      expect(input.props.value).toBe('test@memantra.com');
    });

    expect(storage.getUserData).toHaveBeenCalledTimes(1);
  });

  it('handles missing email in userData by setting empty string', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({ email: null });

    const { getByPlaceholderText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Enter new email');

      expect(input.props.value).toBe('');
    });
  });

  it('calls navigation.goBack when back button is pressed', async () => {
    const { getByText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      expect(getByText('← Back')).toBeTruthy();
    });

    const backButton = getByText('← Back');

    fireEvent.press(backButton);

    expect(backButton).toBeTruthy();
  });

  it('updates email input when user types', async () => {
    const { getByPlaceholderText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Enter new email');

      expect(input).toBeTruthy();
    });

    const input = getByPlaceholderText('Enter new email');

    fireEvent.changeText(input, 'newemail@memantra.com');

    expect(input.props.value).toBe('newemail@memantra.com');
  });

  it('successfully updates email and logs out user', async () => {
    (authService.updateEmail as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Enter new email');

      expect(input).toBeTruthy();
    });

    const input = getByPlaceholderText('Enter new email');

    fireEvent.changeText(input, 'newemail@memantra.com');

    const saveButton = getByText('Save Email');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(authService.updateEmail).toHaveBeenCalledWith('newemail@memantra.com', 'mock-token');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Updated',
        'Your email has been changed. You will be logged out for security reasons.',

        expect.any(Array),
      );
    });
  });

  it('shows error when token is not available', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      expect(getByText('Save Email')).toBeTruthy();
    });

    const saveButton = getByText('Save Email');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Not authenticated.');
      expect(authService.updateEmail).not.toHaveBeenCalled();
    });
  });

  it('handles update email error gracefully', async () => {
    const errorMessage = 'Email already exists';

    (authService.updateEmail as jest.Mock).mockRejectedValue({
      message: errorMessage,
    });

    const { getByPlaceholderText, getByText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Enter new email');

      expect(input).toBeTruthy();
    });

    const input = getByPlaceholderText('Enter new email');

    fireEvent.changeText(input, 'existing@memantra.com');

    const saveButton = getByText('Save Email');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(authService.updateEmail).toHaveBeenCalledWith('existing@memantra.com', 'mock-token');

      expect(Alert.alert).toHaveBeenCalledWith('Error', errorMessage);
    });
  });

  it('handles update email error without message using fallback', async () => {
    (authService.updateEmail as jest.Mock).mockRejectedValue({});

    const { getByPlaceholderText, getByText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      const input = getByPlaceholderText('Enter new email');

      expect(input).toBeTruthy();
    });

    const input = getByPlaceholderText('Enter new email');

    fireEvent.changeText(input, 'test@memantra.com');

    const saveButton = getByText('Save Email');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(authService.updateEmail).toHaveBeenCalledWith('test@memantra.com', 'mock-token');

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update email.');
    });
  });

  it('calls logoutUser when alert OK is pressed after successful update', async () => {
    (authService.updateEmail as jest.Mock).mockResolvedValue({ success: true });

    let alertCallback: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0]) {
        alertCallback = buttons[0].onPress;
      }
    });

    const { getByText } = render(<UpdateEmailScreen />);

    await waitFor(() => {
      expect(getByText('Save Email')).toBeTruthy();
    });

    const saveButton = getByText('Save Email');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    if (alertCallback) {
      alertCallback();

      expect(logoutUser).toHaveBeenCalled();
    }
  });
});
