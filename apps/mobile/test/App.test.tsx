/* global require */

import React from 'react';
import { render } from '@testing-library/react-native';
import * as renderer from 'react-test-renderer';
import App from '../App';
import * as expo from 'expo';

// Mock CSS imports
jest.mock('../global.css', () => ({}));

// Mock NavigationContainer
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
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
});

describe('index.ts', () => {
  it('registers the App with Expo', () => {
    // Re-import the module to trigger registration
    require('../index');
    expect(expo.registerRootComponent).toHaveBeenCalledWith(App);
  });
});
