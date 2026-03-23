require('@testing-library/jest-native/extend-expect');
const { cleanup, configure } = require('@testing-library/react-native');

// React Native 0.81+ can try to evaluate NativeModules while formatting query errors
// in @testing-library/react-native. Ensure a bridge config exists in Jest.
if (!global.__fbBatchedBridgeConfig) {
  global.__fbBatchedBridgeConfig = {
    remoteModuleConfig: [],
    localModulesConfig: [],
  };
}

if (!global.nativeModuleProxy) {
  global.nativeModuleProxy = {};
}

configure({
  defaultIncludeHiddenElements: true,
});

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;
const activeTimeouts = new Set();
const activeIntervals = new Set();

global.setTimeout = (...args) => {
  const id = originalSetTimeout(...args);
  activeTimeouts.add(id);
  return id;
};

global.clearTimeout = (id) => {
  activeTimeouts.delete(id);
  return originalClearTimeout(id);
};

global.setInterval = (...args) => {
  const id = originalSetInterval(...args);
  activeIntervals.add(id);
  return id;
};

global.clearInterval = (id) => {
  activeIntervals.delete(id);
  return originalClearInterval(id);
};

// Set React act environment
global.IS_REACT_ACT_ENVIRONMENT = true;

// Suppress act warnings in console during tests
// These warnings are expected when testing components with async effects
const originalError = console.error;
const sanitizeForLog = (value) => String(value).replace(/[\r\n\u2028\u2029]+/g, ' ');
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to') &&
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    const sanitizedArgs = args.map(sanitizeForLog);
    originalError.call(console, ...sanitizedArgs);
  };
});

afterAll(() => {
  console.error = originalError;
});

afterEach(() => {
  cleanup();
  for (const id of activeTimeouts) {
    originalClearTimeout(id);
  }
  activeTimeouts.clear();
  for (const id of activeIntervals) {
    originalClearInterval(id);
  }
  activeIntervals.clear();
  jest.clearAllTimers();
  jest.useRealTimers();
});

afterAll(() => {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
  global.setInterval = originalSetInterval;
  global.clearInterval = originalClearInterval;
});

// Mock expo-splash-screen
jest.mock(
  'expo-splash-screen',
  () => ({
    preventAutoHideAsync: jest.fn(() => Promise.resolve()),
    hideAsync: jest.fn(() => Promise.resolve()),
  }),
  { virtual: true },
);

// Patch TurboModuleRegistry for RN 0.81+ to avoid hard native dependencies in Jest.
const TurboModuleRegistry = require('react-native/Libraries/TurboModule/TurboModuleRegistry');
const platformConstantsModule = {
  getConstants: () => ({
    isTesting: true,
    reactNativeVersion: { major: 0, minor: 81, patch: 4, prerelease: null },
    forceTouchAvailable: false,
    osVersion: 'test',
    systemName: 'iOS',
    interfaceIdiom: 'phone',
  }),
};
const appearanceModule = {
  getColorScheme: jest.fn(() => 'light'),
  setColorScheme: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};
const fallbackTurboModule = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  getConstants: () => ({}),
};

const originalTurboModuleGet = TurboModuleRegistry.get?.bind(TurboModuleRegistry);
const originalTurboModuleGetEnforcing = TurboModuleRegistry.getEnforcing?.bind(TurboModuleRegistry);

TurboModuleRegistry.get = jest.fn((name) => {
  const existingModule = originalTurboModuleGet ? originalTurboModuleGet(name) : null;
  if (existingModule) {
    return existingModule;
  }

  if (name === 'PlatformConstants') {
    return platformConstantsModule;
  }
  if (name === 'Appearance') {
    return appearanceModule;
  }
  return fallbackTurboModule;
});
TurboModuleRegistry.getEnforcing = jest.fn((name) => {
  try {
    if (originalTurboModuleGetEnforcing) {
      const existingModule = originalTurboModuleGetEnforcing(name);
      if (existingModule) {
        return existingModule;
      }
    }
  } catch {
    // Fall back to local test stub modules.
  }
  return TurboModuleRegistry.get(name);
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock storage utility (used by api.config and other modules)
jest.mock(
  './utils/storage',
  () => ({
    storage: {
      saveToken: jest.fn(() => Promise.resolve()),
      getToken: jest.fn(() => Promise.resolve(null)),
      removeToken: jest.fn(() => Promise.resolve()),
      saveUserData: jest.fn(() => Promise.resolve()),
      getUserData: jest.fn(() => Promise.resolve(null)),
      getUserId: jest.fn(() => Promise.resolve(null)),
      removeUserData: jest.fn(() => Promise.resolve()),
      clearAll: jest.fn(() => Promise.resolve()),
    },
  }),
  { virtual: false },
);

// Mock expo-constants
jest.mock(
  'expo-constants',
  () => ({
    __esModule: true,
    default: {
      expoConfig: {
        hostUri: null,
      },
    },
  }),
  { virtual: true },
);

// Mock expo-device
jest.mock(
  'expo-device',
  () => ({
    __esModule: true,
    default: {
      isDevice: true,
      deviceName: 'Test Device',
    },
    isDevice: true,
    deviceName: 'Test Device',
  }),
  { virtual: true },
);

// Mock expo-font
jest.mock(
  'expo-font',
  () => ({
    __esModule: true,
    loadAsync: jest.fn(() => Promise.resolve()),
    default: {
      loadAsync: jest.fn(() => Promise.resolve()),
    },
  }),
  { virtual: true },
);

// Mock expo-secure-store
jest.mock(
  'expo-secure-store',
  () => ({
    __esModule: true,
    default: {
      setItemAsync: jest.fn(() => Promise.resolve()),
      getItemAsync: jest.fn(() => Promise.resolve(null)),
      deleteItemAsync: jest.fn(() => Promise.resolve()),
    },
    setItemAsync: jest.fn(() => Promise.resolve()),
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
  }),
  { virtual: true },
);

// Mock expo-notifications
jest.mock(
  'expo-notifications',
  () => ({
    setNotificationHandler: jest.fn(),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
    cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  }),
  { virtual: true },
);

// Mock Expo vector icons globally to avoid loading native font modules in Jest.
jest.mock('@expo/vector-icons', () => {
  const Icon = () => null;

  return new Proxy(
    { Ionicons: Icon },
    {
      get: (target, prop) => target[prop] || Icon,
    },
  );
});

// Mock @react-native-community/datetimepicker
jest.mock(
  '@react-native-community/datetimepicker',
  () => {
    return {
      __esModule: true,
      default: jest.fn(() => null),
    };
  },
  { virtual: true },
);
