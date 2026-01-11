import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BottomTabNavigator from '../../components/bottomTabNavigator';

/* Mock navigation */
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
}));

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

jest.mock('../../screens/bookmarkScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return () => React.createElement(Text, null, 'Bookmark Screen');
});

jest.mock('../../screens/collectionScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return () => React.createElement(Text, null, 'Collections Screen');
});

jest.mock('../../screens/adminScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return () => React.createElement(Text, null, 'Admin Screen');
});

/* Mock ProfileScreen for username and options */
jest.mock('../../screens/ProfileScreen', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return () => React.createElement(Text, null, 'Profile Screen');
});

jest.mock('../../utils/storage', () => ({
  storage: {
    getUserData: jest.fn(),
  },
}));

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  return {
    createBottomTabNavigator: () => {
      const Screen = ({ component: Component, options, name }: any) => {
        const icon = options?.tabBarIcon
          ? options.tabBarIcon({ color: 'white', focused: false })
          : null;

        return (
          <>
            <Text>{name}</Text>
            {icon}
            <Component navigation={mockNavigation} />
          </>
        );
      };

      const Navigator = ({ children }: { children: React.ReactNode }) => <>{children}</>;

      return { Navigator, Screen };
    },
  };
});

import { storage } from '../../utils/storage';

describe('BottomTabNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getUserData as jest.Mock).mockResolvedValue(null);
  });

  it('renders default tab screens and their icons for non-admin users', async () => {
    const { getByText, queryByText } = render(<BottomTabNavigator />);

    await waitFor(() => expect(storage.getUserData).toHaveBeenCalled());

    expect(getByText('Library')).toBeTruthy();
    expect(getByText('bookmark-outline-white')).toBeTruthy();

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('home-outline-white')).toBeTruthy();
    expect(getByText('Mock Home Screen')).toBeTruthy();

    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('person-outline-white')).toBeTruthy();
    expect(getByText('Profile Screen')).toBeTruthy();

    expect(queryByText('Admin')).toBeNull();
  });

  it('includes admin tab when the user email matches an admin email', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({ email: 'admin@memantra.com' });

    const { getByText } = render(<BottomTabNavigator />);

    await waitFor(() => expect(getByText('Admin')).toBeTruthy());
    expect(getByText('settings-outline-white')).toBeTruthy();
    expect(getByText('Admin Screen')).toBeTruthy();
  });
});
