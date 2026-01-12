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
