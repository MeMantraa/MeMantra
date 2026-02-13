import { Alert } from 'react-native';
import { storage } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme';

export const logoutUser = async (navigation: any) => {
  try {
    // Execute all cleanup operations in parallel
    await Promise.all([
      // Remove theme
      AsyncStorage.removeItem(THEME_STORAGE_KEY),
      // Remove token
      typeof storage.removeToken === 'function' ? storage.removeToken() : storage.saveToken(''),

      // Remove user data
      typeof storage.removeUserData === 'function'
        ? storage.removeUserData()
        : storage.saveUserData(null),
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (err) {
    console.error('Logout error:', err);
    Alert.alert('Error', 'Failed to log out. Please try again.');
  }
};
