//locally manage the JWT token on device
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';

export const storage = {
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
  },
};
