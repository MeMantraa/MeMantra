import { Alert } from 'react-native';
import { storage } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@app_theme';

export const logoutUser = async (navigation: any) => {
  try {
    // Remove theme
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);

    if (typeof storage.removeToken === 'function') {
      await storage.removeToken();
    } else if (typeof storage.saveToken === 'function') {
      await storage.saveToken('');
    }

    if (typeof storage.removeUserData === 'function') {
      await storage.removeUserData();
    } else if (typeof storage.saveUserData === 'function') {
      await storage.saveUserData(null);
    }
    // Small delay to let theme context update
    await new Promise((resolve) => setTimeout(resolve, 50));

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (err) {
    console.error('Logout error:', err);
    Alert.alert('Error', 'Failed to log out. Please try again.');
  }
};
