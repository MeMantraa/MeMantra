import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export const photoUploadUtils = {
  async requestLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  },

  async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  },

  async pickImageFromLibrary(): Promise<string | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  },

  async takePhotoWithCamera(): Promise<string | null> {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
  },

  async resizeAndConvertToBase64(uri: string): Promise<string> {
    const image = ImageManipulator.ImageManipulator.manipulate(uri).resize({ width: 800 });

    const rendered = await image.renderAsync();
    const resized = await rendered.saveAsync({
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });

    return `data:image/jpeg;base64,${resized.base64}`;
  },
};
