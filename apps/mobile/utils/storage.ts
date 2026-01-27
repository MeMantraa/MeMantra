//locally manage the JWT token on device
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = '@user_data';

// SecureStore is not available on web, fall back to AsyncStorage
const isSecureStoreAvailable = Platform.OS !== 'web';

export const storage = {
  async saveToken(token: string): Promise<void> {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } else {
      // Fallback for web - AsyncStorage with warning
      console.warn('SecureStore not available on web, using AsyncStorage');
      await AsyncStorage.setItem(`@${AUTH_TOKEN_KEY}`, token);
    }
  },

  async getToken(): Promise<string | null> {
    if (isSecureStoreAvailable) {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } else {
      return await AsyncStorage.getItem(`@${AUTH_TOKEN_KEY}`);
    }
  },

  async removeToken(): Promise<void> {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(`@${AUTH_TOKEN_KEY}`);
    }
  },

  async saveUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  },

  async getUserData(): Promise<any> {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },

  async getUserId(): Promise<number | null> {
    const userData = await this.getUserData();
    return userData?.user_id || null;
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    await AsyncStorage.removeItem(USER_DATA_KEY);
  },
};
