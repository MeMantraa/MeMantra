require('@testing-library/jest-native/extend-expect');

// Mock expo-splash-screen
jest.mock(
  'expo-splash-screen',
  () => ({
    preventAutoHideAsync: jest.fn(() => Promise.resolve()),
    hideAsync: jest.fn(() => Promise.resolve()),
  }),
  { virtual: true },
);

// Mock TurboModuleRegistry to avoid DevMenu errors in tests
jest.mock(
  'react-native/Libraries/TurboModule/TurboModuleRegistry',
  () => ({
    getEnforcing: jest.fn(() => ({
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    })),
  }),
  { virtual: true },
);

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
