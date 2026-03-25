import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';

interface RequestMetadata {
  startTime?: number;
  skipPerformanceMonitoring?: boolean;
}

interface ExtendedRequestConfig {
  headers?: any;
  method?: string;
  url?: string;
  metadata?: RequestMetadata;
  skipPerformanceMonitoring?: boolean;
}

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
  if (debuggerHost?.includes('exp.direct')) {
    console.warn('⚠️  Expo tunnel detected. Backend requires local IP in api.config.local.ts');
    return null;
  }

  return debuggerHost || null;
};

// Production API URL (Render-hosted backend)
const PRODUCTION_API_URL = 'https://memantra.onrender.com/api';

const getBaseUrl = () => {
  // In production/preview builds, always use the hosted backend

  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  // --- Development mode: use local backend ---
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

  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine
    // For real device with tunnel, set DEV_IP above
    const host = DEV_IP || '10.0.2.2';
    return `http://${host}:${PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    // For physical device or tunnel, set DEV_IP above
    const host = DEV_IP || 'localhost';
    return `http://${host}:${PORT}/api`;
  }

  // Web or unknown platform fallback
  if (Platform.OS === 'web') {
    // Web uses same-origin or configured URL
    const webHost = DEV_IP || 'localhost';
    return `http://${webHost}:${PORT}/api`;
  }

  // Unknown platform - throw clear error
  throw new Error(`Unsupported platform: ${Platform.OS}. Cannot determine API base URL.`);
};

const API_BASE_URL = getBaseUrl();

if (!API_BASE_URL) {
  throw new Error(
    'API_BASE_URL is undefined. Check your network configuration or set LOCAL_DEV_IP in api.config.local.ts',
  );
}

console.log('✅ API Base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const buildRouteName = (url?: string): string | undefined => {
  if (!url) return undefined;
  return url.split('?')[0];
};

const emitApiPerformanceEvent = async (params: {
  config?: ExtendedRequestConfig;
  durationMs: number;
  status: 'success' | 'error';
  statusCode?: number;
  errorMessage?: string;
}) => {
  const config = params.config;
  const skip = config?.metadata?.skipPerformanceMonitoring || config?.skipPerformanceMonitoring;
  if (skip) return;
  if (typeof (apiClient as any).post !== 'function') return;

  await apiClient.post(
    '/performance/event',
    {
      kind: 'mobile_api',
      name: `${(config?.method || 'get').toUpperCase()} ${buildRouteName(config?.url) || '/'}`,
      duration_ms: Math.round(params.durationMs * 100) / 100,
      status: params.status,
      source: 'mobile',
      route: buildRouteName(config?.url),
      method: (config?.method || 'get').toUpperCase(),
      platform: Platform.OS,
      app_version: String(Constants.expoConfig?.version || 'unknown'),
      metadata: {
        status_code: params.statusCode,
        error: params.errorMessage,
      },
    },
    {
      skipPerformanceMonitoring: true,
      timeout: 3000,
    } as any,
  );
};

// Navigation ref to handle logout navigation and deep linking
let navigationRef: {
  navigate: (name: string, params?: object) => void;
  reset: (state: { index: number; routes: { name: string }[] }) => void;
} | null = null;

export const setNavigationRef = (ref: typeof navigationRef) => {
  navigationRef = ref;
};

export const getNavigationRef = () => navigationRef;

/**
 * Navigate to a screen from outside React component context
 * Used for deep linking from notifications
 */
export const navigateFromOutside = (screenName: string, params?: object) => {
  if (navigationRef) {
    navigationRef.navigate(screenName, params);
  } else {
    console.warn('Navigation ref not set, cannot navigate to:', screenName);
  }
};

/**
 * Check if navigation is ready
 */
export const isNavigationReady = (): boolean => {
  return navigationRef !== null;
};

// Attach the stored JWT token to every outgoing request.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const extendedConfig = config as ExtendedRequestConfig;
    extendedConfig.metadata = extendedConfig.metadata || {};
    extendedConfig.metadata.startTime = Date.now();
    extendedConfig.metadata.skipPerformanceMonitoring =
      extendedConfig.metadata.skipPerformanceMonitoring ||
      extendedConfig.skipPerformanceMonitoring ||
      false;

    const token = await storage.getToken();
    if (token) {
      extendedConfig.headers = extendedConfig.headers || {};
      extendedConfig.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Global response error handler — clears auth on 401.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const config: ExtendedRequestConfig | undefined = response?.config;
    const startedAt = config?.metadata?.startTime || Date.now();
    void emitApiPerformanceEvent({
      config,
      durationMs: Date.now() - startedAt,
      status: 'success',
      statusCode: response?.status,
    });
    return response;
  },
  async (error: any) => {
    const config: ExtendedRequestConfig | undefined = error?.config;
    const startedAt = config?.metadata?.startTime || Date.now();

    await emitApiPerformanceEvent({
      config,
      durationMs: Date.now() - startedAt,
      status: 'error',
      statusCode: error?.response?.status,
      errorMessage: error?.message,
    });

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
