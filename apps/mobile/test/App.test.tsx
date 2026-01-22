/* global require */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import * as renderer from 'react-test-renderer';
import App from '../App';
import * as expo from 'expo';

// Mock CSS imports
jest.mock('../global.css', () => ({}));

// Mock storage
jest.mock('../utils/storage', () => ({
  storage: {
    clearAll: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue(null),
    saveToken: jest.fn().mockResolvedValue(undefined),
    removeToken: jest.fn().mockResolvedValue(undefined),
    getUserData: jest.fn().mockResolvedValue(null),
    saveUserData: jest.fn().mockResolvedValue(undefined),
    removeUserData: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock api.config
jest.mock('../services/api.config', () => ({
  setNavigationRef: jest.fn(),
  apiClient: {},
}));

// Mock NavigationContainer
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children, ref, onReady }: any) => {
    // Immediately set ref and call onReady synchronously
    if (ref && onReady) {
      ref.current = { navigate: jest.fn(), reset: jest.fn() };
      // Call onReady in the next tick to allow component to mount
      Promise.resolve().then(() => onReady());
    }
    return children;
  },
}));

// Mock GestureHandlerRootView
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock MainNavigator
jest.mock('../app/index', () => () => 'MainNavigator');

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Keep the registerRootComponent mock
jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

// Mock expo-font
const mockLoadAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-font', () => ({
  loadAsync: mockLoadAsync,
}));

// Mock SplashScreen
const mockHideAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: mockHideAsync,
}));

jest.mock('react-native/Libraries/Animated/Animated', () => {
  const Animated = jest.requireActual('react-native/Libraries/Animated/Animated');

  class MockAnimatedValue {
    private _value: number;

    constructor(value: number) {
      this._value = value;
    }

    setValue(value: number) {
      this._value = value;
    }

    addListener() {
      return 'listener';
    }

    removeAllListeners() {}

    stopAnimation(callback?: (value: number) => void) {
      if (callback) {
        callback(this._value);
      }
    }
  }

  return {
    ...Animated,
    Value: MockAnimatedValue,
    timing: jest.fn(() => ({
      start: (cb?: () => void) => cb?.(),
      stop: jest.fn(),
    })),
  };
});

beforeAll(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.clearAllMocks();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('App Component', () => {
  test('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  test('renders the main component', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });

  test('creates a snapshot', () => {
    renderer.act(() => {
      const tree = renderer.create(<App />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  test('handles font loading error gracefully', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const testError = new Error('Font loading failed');

    // Mock Font.loadAsync to reject
    mockLoadAsync.mockRejectedValueOnce(testError);

    render(<App />);

    // Wait for the error to be caught and console.warn to be called
    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    // Verify it was called with an error (any error)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0][0]).toBeInstanceOf(Error);

    consoleWarnSpy.mockRestore();
  });

  test('calls setNavigationRef when navigation is ready', async () => {
    const { setNavigationRef } = require('../services/api.config');

    render(<App />);

    // Wait for onReady callback to be triggered
    await waitFor(() => {
      expect(setNavigationRef).toHaveBeenCalled();
    });
  });
});

describe('index.ts', () => {
  it('registers the App with Expo', () => {
    // Re-import the module to trigger registration
    require('../index');
    expect(expo.registerRootComponent).toHaveBeenCalledWith(App);
  });
});
