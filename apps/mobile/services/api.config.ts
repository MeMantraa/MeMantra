import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';

// Try to import local config (gitignored) - copy api.config.local.example.ts to api.config.local.ts
let LOCAL_DEV_IP: string | null = null;
// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'test') {
  try {
    // eslint-disable-next-line no-undef
    const localConfig = require('./api.config.local');
    LOCAL_DEV_IP = localConfig.LOCAL_DEV_IP;
  } catch {
    // No local config file - that's fine, will auto-detect from Expo
  }
}

// Auto-detect local IP address from Expo's debugger host
const getLocalIpAddress = (): string | null => {
  // In development, Expo provides the host IP through debuggerHost
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

  // If using Expo tunnel (exp.direct domain), we can't auto-detect the local IP
  // because the backend isn't tunneled - it only runs locally
  // In this case, you MUST set LOCAL_DEV_IP in api.config.local.ts
  if (debuggerHost && debuggerHost.includes('exp.direct')) {
    console.warn('⚠️  Expo tunnel detected. Backend requires local IP in api.config.local.ts');
    return null;
  }

  return debuggerHost || null;
};

const getBaseUrl = () => {
  const autoDetectedIP = getLocalIpAddress();
  const PORT = '4000';

  // Determine if we're using Expo tunnel
  const isUsingTunnel = Constants.expoConfig?.hostUri?.includes('exp.direct');

  // Use local config IP if:
  // 1. It's explicitly set AND
  // 2. We're using tunnel (because backend needs local IP when mobile app is tunneled)
  const shouldUseLocalConfig = LOCAL_DEV_IP && isUsingTunnel;
  const DEV_IP: string | null = shouldUseLocalConfig ? LOCAL_DEV_IP : autoDetectedIP;

  console.log('🔍 IP Detection:', {
    localConfig: LOCAL_DEV_IP,
    autoDetected: autoDetectedIP,
    isUsingTunnel,
    expoHostUri: Constants.expoConfig?.hostUri,
    platform: Platform.OS,
    finalIP: DEV_IP,
  });

  //if android
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine
    // For real device with tunnel, set DEV_IP above
    const host = DEV_IP || '10.0.2.2';
    return __DEV__ ? `http://${host}:${PORT}/api` : `http://${host}:${PORT}/api`;
  }

  //if ios
  if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    // For physical device or tunnel, set DEV_IP above
    const host = DEV_IP || 'localhost';
    return __DEV__ ? `http://${host}:${PORT}/api` : `http://${host}:${PORT}/api`;
  }
};

const API_BASE_URL = getBaseUrl();

console.log('✅ API Base URL:', API_BASE_URL);

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
