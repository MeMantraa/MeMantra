// Secure on-device storage for JWT tokens and user data.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { FeatureFlagName } from '../../backend/src/utils/featureFlags';

export interface UserData {
  user_id?: number;
  username?: string | null;
  email?: string | null;
  feature_flags?: FeatureFlagName[];
  [key: string]: unknown;
}

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = '@user_data';
const PENDING_VERIFICATION_KEY = '@pending_verification';

interface PendingVerification {
  email: string;
  flow: string;
  expiresAt: number;
}

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

  async saveUserData(userData: UserData | null): Promise<void> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  },

  async getUserData(): Promise<UserData | null> {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? (JSON.parse(data) as UserData) : null;
  },

  async getUserId(): Promise<number | null> {
    const userData = await this.getUserData();
    return userData?.user_id ?? null;
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
  },

  async savePendingVerification(email: string, flow: string): Promise<void> {
    const data: PendingVerification = {
      email,
      flow,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    await AsyncStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(data));
  },

  async getPendingVerification(): Promise<{ email: string; flow: string } | null> {
    const raw = await AsyncStorage.getItem(PENDING_VERIFICATION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingVerification;
    if (Date.now() > data.expiresAt) {
      await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
      return null;
    }
    return { email: data.email, flow: data.flow };
  },

  async clearPendingVerification(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_VERIFICATION_KEY);
  },
};
