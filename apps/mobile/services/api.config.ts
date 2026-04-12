import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';

interface RequestMetadata {
  startTime?: number;
  skipPerformanceMonitoring?: boolean;
}

interface ExtendedRequestConfig {
  method?: string;
  url?: string;
  timeout?: number;
  metadata?: RequestMetadata;
  skipPerformanceMonitoring?: boolean;
}

const runtimeProcess = globalThis.process;
const nodeEnv = runtimeProcess?.env?.NODE_ENV ?? 'development';
const isTest = runtimeProcess?.env?.NODE_ENV === 'test';
const isDevRuntime = typeof __DEV__ !== 'undefined' ? __DEV__ : nodeEnv === 'development';

const normalizeBaseUrl = (value: string): string => {
  const trimmedValue = value.trim().replace(/\/$/, '');
  return trimmedValue.endsWith('/api') ? trimmedValue : `${trimmedValue}/api`;
};

const ENV_API_BASE_URL = runtimeProcess?.env.EXPO_PUBLIC_API_BASE_URL?.trim() || null;

// Try to import local config (gitignored) - copy api.config.local.example.ts to api.config.local.ts
let LOCAL_DEV_IP: string | null = null;
if (runtimeProcess?.env.NODE_ENV !== 'test') {
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
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

  if (debuggerHost?.includes('exp.direct')) {
    console.warn('⚠️  Expo tunnel detected. Backend requires local IP in api.config.local.ts');
    return null;
  }

  return debuggerHost || null;
};

// Production API URL (Render-hosted backend)
const PRODUCTION_API_URL = 'https://memantra.onrender.com/api';

const getBaseUrl = () => {
  // Keep tests deterministic and avoid Expo/native runtime detection in Jest.
  if (isTest) {
    return normalizeBaseUrl(ENV_API_BASE_URL || 'http://localhost:4000/api');
  }

  // In production/preview builds, always use the hosted backend.
  if (!isDevRuntime) {
    return PRODUCTION_API_URL;
  }

  // --- Development mode: use local backend ---
  const autoDetectedIP = getLocalIpAddress();
  const PORT = '4000';
  const isUsingTunnel = Boolean(Constants.expoConfig?.hostUri?.includes('exp.direct'));
  const shouldUseLocalConfig = Boolean(LOCAL_DEV_IP) && isUsingTunnel;

  if (ENV_API_BASE_URL) {
    return normalizeBaseUrl(ENV_API_BASE_URL);
  }

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
    const host = DEV_IP || '10.0.2.2';
    return normalizeBaseUrl(`http://${host}:${PORT}`);
  }

  if (Platform.OS === 'ios') {
    const host = DEV_IP || 'localhost';
    return normalizeBaseUrl(`http://${host}:${PORT}`);
  }

  if (Platform.OS === 'web') {
    const webHost = DEV_IP || 'localhost';
    return normalizeBaseUrl(`http://${webHost}:${PORT}`);
  }

  throw new Error(`Unsupported platform: ${Platform.OS}. Cannot determine API base URL.`);
};

const API_BASE_URL = getBaseUrl();

if (!API_BASE_URL) {
  throw new Error(
    'API_BASE_URL is undefined. Check your network configuration or set LOCAL_DEV_IP in api.config.local.ts',
  );
}

if (isDevRuntime) {
  console.log('✅ API Base URL:', API_BASE_URL);
}

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
  if (typeof apiClient.post !== 'function') return;
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
    } as ExtendedRequestConfig,
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

export const navigateFromOutside = (screenName: string, params?: object) => {
  if (navigationRef) {
    navigationRef.navigate(screenName, params);
  } else {
    console.warn('Navigation ref not set, cannot navigate to:', screenName);
  }
};

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
      config.headers.set('Authorization', `Bearer ${token}`);
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
  async (error: AxiosError) => {
    const config: ExtendedRequestConfig | undefined = error?.config as
      | ExtendedRequestConfig
      | undefined;
    const startedAt = config?.metadata?.startTime || Date.now();

    await emitApiPerformanceEvent({
      config,
      durationMs: Date.now() - startedAt,
      status: 'error',
      statusCode: error?.response?.status,
      errorMessage: error?.message,
    });

    if (error.response?.status === 401) {
      try {
        await storage.clearAll();
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }

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

export default apiClient;
