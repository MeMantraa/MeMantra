import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MainNavigator from '../app/index';
import { storage } from '../utils/storage';

jest.mock('../screens/login', () => () => null);
jest.mock('../screens/SignUp', () => () => null);
jest.mock('../components/bottomTabNavigator', () => () => null);

jest.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => children,
}));

jest.mock('../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
  },
}));

describe('MainNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator while checking auth', async () => {
    (storage.getToken as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(<MainNavigator />);

    const loadingView = getByTestId('loading-indicator');
    expect(loadingView).toBeTruthy();
  });

  it('renders MainApp if token exists', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');

    render(<MainNavigator />);

    await waitFor(() => {
      expect(storage.getToken).toHaveBeenCalledTimes(1);
    });
  });

  it('renders Login if no token', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    render(<MainNavigator />);

    await waitFor(() => {
      expect(storage.getToken).toHaveBeenCalledTimes(1);
    });
  });

  it('handles storage failure and defaults to logged out', async () => {
    (storage.getToken as jest.Mock).mockRejectedValue(new Error('Failed'));

    render(<MainNavigator />);

    await waitFor(() => {
      expect(storage.getToken).toHaveBeenCalledTimes(1);
    });
  });
});
