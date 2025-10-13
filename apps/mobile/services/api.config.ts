import axios from 'axios';
import { Platform } from 'react-native';

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
  timeout: 10000,
});

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
  (error: { response: { status: number } }) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized access');
    }
    return Promise.reject(error);
  },
);
