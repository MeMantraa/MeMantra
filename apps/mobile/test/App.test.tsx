import React from 'react';
import { render } from '@testing-library/react-native';
import * as renderer from 'react-test-renderer';
import App from '../App';

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
