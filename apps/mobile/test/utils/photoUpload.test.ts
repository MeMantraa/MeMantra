import { photoUploadUtils } from '../../utils/photoUpload';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

describe('photoUploadUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLibraryPermission', () => {
    it('returns true when permission is granted', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await photoUploadUtils.requestLibraryPermission();

      expect(result).toBe(true);
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    });

    it('returns false when permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await photoUploadUtils.requestLibraryPermission();

      expect(result).toBe(false);
    });
  });

  describe('requestCameraPermission', () => {
    it('returns true when permission is granted', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await photoUploadUtils.requestCameraPermission();

      expect(result).toBe(true);
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    it('returns false when permission is denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await photoUploadUtils.requestCameraPermission();

      expect(result).toBe(false);
    });
  });

  describe('pickImageFromLibrary', () => {
    it('returns uri when image is selected', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-image.jpg' }],
      });

      const result = await photoUploadUtils.pickImageFromLibrary();

      expect(result).toBe('file://test-image.jpg');
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
      });
    });

    it('returns null when selection is canceled', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const result = await photoUploadUtils.pickImageFromLibrary();

      expect(result).toBeNull();
    });
  });

  describe('takePhotoWithCamera', () => {
    it('returns uri when photo is taken', async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://camera-photo.jpg' }],
      });

      const result = await photoUploadUtils.takePhotoWithCamera();

      expect(result).toBe('file://camera-photo.jpg');
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    });

    it('returns null when photo capture is canceled', async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const result = await photoUploadUtils.takePhotoWithCamera();

      expect(result).toBeNull();
    });
  });

  describe('resizeAndConvertToBase64', () => {
    it('resizes image and returns base64 string with prefix', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: 'file://resized.jpg',
        base64: 'testbase64string',
      });

      const result = await photoUploadUtils.resizeAndConvertToBase64('file://original.jpg');

      expect(result).toBe('data:image/jpeg;base64,testbase64string');
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file://original.jpg',
        [{ resize: { width: 800 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
    });

    it('throws error when manipulation fails', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(
        new Error('Manipulation failed'),
      );

      await expect(
        photoUploadUtils.resizeAndConvertToBase64('file://original.jpg'),
      ).rejects.toThrow('Manipulation failed');
    });
  });
});
