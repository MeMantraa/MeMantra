import React from 'react';
import { render } from '@testing-library/react-native';
import * as renderer from 'react-test-renderer';
import App from '../App'; // Adjust import path

// Mock any native dependencies
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
    const tree = renderer.create(<App />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
