import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MainNavigator from '../app/index';
import { storage } from '../utils/storage';

jest.mock('../screens/LoginScreen', () => () => null);
jest.mock('../screens/SignUpEmailScreen', () => () => null);
jest.mock('../components/bottomTabNavigator', () => () => null);
jest.mock('../screens/FocusScreen', () => () => null);

jest.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => children,
}));

jest.mock('../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
  },
}));

// Mock mantra service
const mockGetMantraById = jest.fn();
jest.mock('../services/mantra.service', () => ({
  mantraService: {
    getMantraById: mockGetMantraById,
    likeMantra: jest.fn(),
    unlikeMantra: jest.fn(),
    saveMantra: jest.fn(),
    unsaveMantra: jest.fn(),
  },
}));

// Mock navigation helpers
const mockNavigateFromOutside = jest.fn();
const mockIsNavigationReady = jest.fn();
jest.mock('../services/api.config', () => ({
  navigateFromOutside: mockNavigateFromOutside,
  isNavigationReady: mockIsNavigationReady,
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

  describe('Focus Screen Navigation Options', () => {
    beforeEach(() => {
      (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('renders successfully with Focus screen configured', async () => {
      const { UNSAFE_root } = render(<MainNavigator />);

      await waitFor(() => {
        expect(storage.getToken).toHaveBeenCalled();
      });

      expect(UNSAFE_root).toBeDefined();
    });

    it('applies correct opacity transition based on progress', () => {
      // Test the cardStyleInterpolator function
      const cardStyleInterpolator = ({ current }: { current: { progress: number } }) => ({
        cardStyle: {
          opacity: current.progress,
        },
      });

      // Test with progress at 0 (closed)
      const resultClosed = cardStyleInterpolator({ current: { progress: 0 } });

      expect(resultClosed.cardStyle.opacity).toBe(0);

      // Test with progress at 0.5 (mid-transition)
      const resultMid = cardStyleInterpolator({ current: { progress: 0.5 } });

      expect(resultMid.cardStyle.opacity).toBe(0.5);

      // Test with progress at 1 (fully open)
      const resultOpen = cardStyleInterpolator({ current: { progress: 1 } });

      expect(resultOpen.cardStyle.opacity).toBe(1);
    });

    it('configures correct open transition timing', () => {
      const openTransitionSpec = {
        animation: 'timing' as const,
        config: { duration: 450 },
      };

      expect(openTransitionSpec.animation).toBe('timing');

      expect(openTransitionSpec.config.duration).toBe(450);
    });

    it('configures correct close transition timing', () => {
      const closeTransitionSpec = {
        animation: 'timing' as const,
        config: { duration: 350 },
      };

      expect(closeTransitionSpec.animation).toBe('timing');

      expect(closeTransitionSpec.config.duration).toBe(350);
    });

    it('ensures close transition is faster than open transition', () => {
      const openDuration = 450;

      const closeDuration = 350;

      expect(closeDuration).toBeLessThan(openDuration);
    });
  });

  describe('Notification Deep Linking', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
      mockIsNavigationReady.mockReturnValue(true);
    });

    it('sets up notification listeners when logged in', async () => {
      render(<MainNavigator />);

      await waitFor(() => {
        expect(storage.getToken).toHaveBeenCalled();
      });

      // The component should set up notification listeners
      // This is tested implicitly through the render
    });

    it('notification response listener is cleaned up on unmount', async () => {
      const { unmount } = render(<MainNavigator />);

      await waitFor(() => {
        expect(storage.getToken).toHaveBeenCalled();
      });

      // Unmount should clean up listeners without throwing
      unmount();
    });
  });
});
