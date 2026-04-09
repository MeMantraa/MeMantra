import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../screens/ProfileScreen';
import { storage } from '../../utils/storage';
import { userService } from '../../services/user.service';
import { photoUploadUtils } from '../../utils/photoUpload';
import { Alert, ActionSheetIOS, Linking, Platform } from 'react-native';

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
jest.mock('../../utils/photoUpload');
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#9AA793',
      primaryDark: '#6D7E68',
      text: '#ffffff',
      white: '#ffffff',
      secondary: '#6D7E68',
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
      expect(getByText('Reminders')).toBeTruthy();
      expect(getByText('Notifications Settings')).toBeTruthy();
      expect(getByText('Liked')).toBeTruthy();
      expect(getByText('Mantra Algorithm')).toBeTruthy();
      expect(getByText('Themes')).toBeTruthy();
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

  it('navigates to NotificationSettings screen when Notifications Settings is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Notifications Settings')).toBeTruthy();
    });

    const notificationsButton = getByText('Notifications Settings');
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
      data: {
        user: { user_id: 1, username: 'testuser', profile_photo: 'data:image/jpeg;base64,abc123' },
      },
    });

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(userService.getUserById).toHaveBeenCalledWith(1, 'test-token');
    });
  });

  describe('Photo Upload Functionality', () => {
    beforeEach(() => {
      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.requestCameraPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(
        'file://test-image.jpg',
      );
      (photoUploadUtils.takePhotoWithCamera as jest.Mock).mockResolvedValue(
        'file://camera-photo.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,mockbase64',
      );
    });

    it('handles error when loading user from server', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (userService.getUserById as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching user from server',
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles missing token when loading from server', async () => {
      (storage.getToken as jest.Mock).mockResolvedValue(null);

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(storage.getToken).toHaveBeenCalled();
      });

      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('handles missing userId when loading from server', async () => {
      (storage.getUserId as jest.Mock).mockResolvedValue(null);

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(storage.getUserId).toHaveBeenCalled();
      });

      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('updates local state when user data is fetched successfully', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'updateduser',
            profile_photo: 'data:image/jpeg;base64,newphoto',
            feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
          },
        },
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('updateduser')).toBeTruthy();
        expect(storage.saveUserData).toHaveBeenCalledWith({
          user_id: 1,
          username: 'updateduser',
          profile_photo: 'data:image/jpeg;base64,newphoto',
          feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
        });
      });
    });

    it('filters invalid feature flags when saving user data', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            profile_photo: null,
            feature_flags: ['DARK_MODE', 'INVALID_FLAG', 'EXPERIMENTAL_FEATURE'],
          },
        },
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(storage.saveUserData).toHaveBeenCalledWith(
          expect.objectContaining({
            feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
          }),
        );
      });
    });

    it('handles undefined feature flags gracefully', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            profile_photo: null,
            feature_flags: undefined,
          },
        },
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(storage.saveUserData).toHaveBeenCalledWith(
          expect.objectContaining({
            feature_flags: undefined,
          }),
        );
      });
    });

    it('handles empty feature flags array', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            profile_photo: null,
            feature_flags: [],
          },
        },
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(storage.saveUserData).toHaveBeenCalledWith(
          expect.objectContaining({
            feature_flags: [],
          }),
        );
      });
    });

    it('displays Edit button with correct testID', async () => {
      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });
    });

    it('displays default profile image when no profile_photo', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            profile_photo: null,
          },
        },
      });

      const { UNSAFE_getAllByType } = render(<ProfileScreen />);

      await waitFor(() => {
        const images = UNSAFE_getAllByType(require('react-native').Image);
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('displays profile photo when available', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'testuser',
            profile_photo: 'data:image/jpeg;base64,testphoto',
          },
        },
      });

      const { UNSAFE_getAllByType } = render(<ProfileScreen />);

      await waitFor(() => {
        const images = UNSAFE_getAllByType(require('react-native').Image);
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('handles successful photo upload from library on iOS', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(2);
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(
        'file://test-image.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,testbase64',
      );
      (userService.updateProfilePhoto as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'memantrauser',
            profile_photo: 'data:image/jpeg;base64,testbase64',
          },
        },
      });

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(photoUploadUtils.requestLibraryPermission).toHaveBeenCalled();
        expect(photoUploadUtils.pickImageFromLibrary).toHaveBeenCalled();
        expect(photoUploadUtils.resizeAndConvertToBase64).toHaveBeenCalledWith(
          'file://test-image.jpg',
        );
        expect(userService.updateProfilePhoto).toHaveBeenCalledWith(
          'data:image/jpeg;base64,testbase64',
          'test-token',
        );
      });

      actionSheetSpy.mockRestore();
    });

    it('handles permission denied for photo library', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      const alertSpy = jest.spyOn(global, 'alert');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(2);
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(false);

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Permission denied!');
      });

      actionSheetSpy.mockRestore();
    });

    it('handles canceled photo selection from library', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(2);
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(null);

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(photoUploadUtils.pickImageFromLibrary).toHaveBeenCalled();
      });

      expect(photoUploadUtils.resizeAndConvertToBase64).not.toHaveBeenCalled();
      expect(userService.updateProfilePhoto).not.toHaveBeenCalled();

      actionSheetSpy.mockRestore();
    });

    it('handles successful photo from camera on iOS', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(1);
      });

      (photoUploadUtils.requestCameraPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.takePhotoWithCamera as jest.Mock).mockResolvedValue(
        'file://camera-photo.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,camerabase64',
      );
      (userService.updateProfilePhoto as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'memantrauser',
            profile_photo: 'data:image/jpeg;base64,camerabase64',
          },
        },
      });

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(photoUploadUtils.requestCameraPermission).toHaveBeenCalled();
        expect(photoUploadUtils.takePhotoWithCamera).toHaveBeenCalled();
        expect(userService.updateProfilePhoto).toHaveBeenCalled();
      });

      actionSheetSpy.mockRestore();
    });

    it('handles permission denied for camera', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      const alertSpy = jest.spyOn(global, 'alert');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(1);
      });

      (photoUploadUtils.requestCameraPermission as jest.Mock).mockResolvedValue(false);

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Permission denied!');
      });

      actionSheetSpy.mockRestore();
    });

    it('handles canceled camera photo', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(1);
      });

      (photoUploadUtils.requestCameraPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.takePhotoWithCamera as jest.Mock).mockResolvedValue(null);

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(photoUploadUtils.takePhotoWithCamera).toHaveBeenCalled();
      });

      expect(photoUploadUtils.resizeAndConvertToBase64).not.toHaveBeenCalled();
      expect(userService.updateProfilePhoto).not.toHaveBeenCalled();

      actionSheetSpy.mockRestore();
    });

    it('handles error during photo manipulation', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(2);
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(
        'file://test-image.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockRejectedValue(
        new Error('Manipulation failed'),
      );

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error converting/uploading photo:',
          expect.any(Error),
        );
      });

      actionSheetSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles error during photo upload to server', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(2);
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(
        'file://test-image.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,testbase64',
      );
      (userService.updateProfilePhoto as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error uploading photo:', expect.any(Error));
      });

      actionSheetSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles failed upload response from server', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(2);
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(
        'file://test-image.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,testbase64',
      );
      (userService.updateProfilePhoto as jest.Mock).mockResolvedValue({
        status: 'error',
        message: 'Upload failed',
      });

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update photo:', 'Upload failed');
      });

      actionSheetSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles successful photo upload from library on Android', async () => {
      Platform.OS = 'android';
      const alertSpy = jest.spyOn(Alert, 'alert');
      alertSpy.mockImplementation((title, message, buttons) => {
        const libraryButton = buttons?.find((b) => b.text === 'Choose from Library');
        libraryButton?.onPress?.();
      });

      (photoUploadUtils.requestLibraryPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.pickImageFromLibrary as jest.Mock).mockResolvedValue(
        'file://android-image.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,androidbase64',
      );
      (userService.updateProfilePhoto as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'memantrauser',
            profile_photo: 'data:image/jpeg;base64,androidbase64',
          },
        },
      });

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(photoUploadUtils.pickImageFromLibrary).toHaveBeenCalled();
        expect(userService.updateProfilePhoto).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });

    it('handles successful photo from camera on Android', async () => {
      Platform.OS = 'android';
      const alertSpy = jest.spyOn(Alert, 'alert');
      alertSpy.mockImplementation((title, message, buttons) => {
        const cameraButton = buttons?.find((b) => b.text === 'Take Photo');
        cameraButton?.onPress?.();
      });

      (photoUploadUtils.requestCameraPermission as jest.Mock).mockResolvedValue(true);
      (photoUploadUtils.takePhotoWithCamera as jest.Mock).mockResolvedValue(
        'file://camera-photo.jpg',
      );
      (photoUploadUtils.resizeAndConvertToBase64 as jest.Mock).mockResolvedValue(
        'data:image/jpeg;base64,camerabase64',
      );
      (userService.updateProfilePhoto as jest.Mock).mockResolvedValue({
        status: 'success',
        data: {
          user: {
            user_id: 1,
            username: 'memantrauser',
            profile_photo: 'data:image/jpeg;base64,camerabase64',
          },
        },
      });

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(photoUploadUtils.takePhotoWithCamera).toHaveBeenCalled();
        expect(userService.updateProfilePhoto).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });

    it('handles cancel button press on iOS action sheet', async () => {
      Platform.OS = 'ios';
      const actionSheetSpy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
      actionSheetSpy.mockImplementation((options, callback) => {
        callback(0);
      });

      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByTestId('edit-photo-button')).toBeTruthy();
      });

      const editButton = getByTestId('edit-photo-button');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(actionSheetSpy).toHaveBeenCalled();
      });

      expect(photoUploadUtils.pickImageFromLibrary).not.toHaveBeenCalled();
      expect(photoUploadUtils.takePhotoWithCamera).not.toHaveBeenCalled();

      actionSheetSpy.mockRestore();
    });

    it('navigates to MantraAlgorithm screen when MantraAlgorithm is pressed', async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Mantra Algorithm')).toBeTruthy();
      });

      const mantraAlgorithmButton = getByText('Mantra Algorithm');
      fireEvent.press(mantraAlgorithmButton);

      expect(mockNavigate).toHaveBeenCalledWith('MantraAlgorithm');
    });

    it('navigates to Themes screen when Themes is pressed', async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Themes')).toBeTruthy();
      });

      const themesButton = getByText('Themes');
      fireEvent.press(themesButton);

      expect(mockNavigate).toHaveBeenCalledWith('Themes');
    });
  });
});
