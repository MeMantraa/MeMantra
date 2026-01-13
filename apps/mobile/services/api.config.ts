import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

const getBaseUrl = () => {
  //if android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }

  //if ios
  if (Platform.OS === 'ios') {
    return 'http://localhost:4000/api';
  }
};

const API_BASE_URL = getBaseUrl();

console.log('API Base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Navigation ref to handle logout navigation
let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

//request to attach jwt token
apiClient.interceptors.request.use(
  async (config: any) => {
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

//handle errors
apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: { response: { status: number } }) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized access - token expired or invalid');

      // Clear stored authentication data
      try {
        await storage.clearAll();
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }

      // Navigate to login screen if navigation ref is available
      if (navigationRef) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
    throw error instanceof Error ? error : new Error(JSON.stringify(error));
  },
);
