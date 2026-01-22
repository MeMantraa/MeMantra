import { Alert } from 'react-native';
import { storage } from './storage';

export const logoutUser = async (navigation: any) => {
  try {
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

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (err) {
    console.error('Logout error:', err);
    Alert.alert('Error', 'Failed to log out. Please try again.');
  }
};
