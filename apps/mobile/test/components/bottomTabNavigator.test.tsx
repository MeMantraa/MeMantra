import React from 'react';
import { render } from '@testing-library/react-native';
import BottomTabNavigator from '../../components/bottomTabNavigator';

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return {
    Ionicons: ({ name, color }: { name: string; color: string }) =>
      React.createElement(Text, null, `${name}-${color}`),
  };
});

jest.mock('../../screens/homeScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return () => React.createElement(Text, null, 'Mock Home Screen');
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return {
    createBottomTabNavigator: () => {
      const Screen = ({ component: Component, options, name }: any) => {
        const icon = options?.tabBarIcon ? options.tabBarIcon({ color: 'white' }) : null;
        return (
          <>
            <Text>{name}</Text>
            {icon}
            <Component />
          </>
        );
      };

      const Navigator = ({ children }: { children: React.ReactNode }) => <>{children}</>;

      return { Navigator, Screen };
    },
  };
});

describe('BottomTabNavigator', () => {
  it('renders all tab screens and their icons', () => {
    const { getByText } = render(<BottomTabNavigator />);

    expect(getByText('Library')).toBeTruthy();
    expect(getByText('bookmark-outline-white')).toBeTruthy();

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('home-outline-white')).toBeTruthy();
    expect(getByText('Mock Home Screen')).toBeTruthy();

    expect(getByText('Liked')).toBeTruthy();
    expect(getByText('heart-outline-white')).toBeTruthy();
    expect(getByText('Liked Screen')).toBeTruthy();
  });
});
