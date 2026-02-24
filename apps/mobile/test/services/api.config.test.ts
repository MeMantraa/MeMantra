/* global require */

describe('api.config', () => {
  const loadModule = (
    platform: 'android' | 'ios' | 'web' = 'web',
    hostUri: string | null = null,
  ) => {
    jest.resetModules();

    const requestHandlers: Array<{
      fulfilled: (config: any) => any;
      rejected: (error: any) => any;
    }> = [];
    const responseHandlers: Array<{
      fulfilled: (response: any) => any;
      rejected: (error: any) => any;
    }> = [];

    const requestUse = jest.fn((fulfilled, rejected) => {
      requestHandlers.push({ fulfilled, rejected });
    });
    const responseUse = jest.fn((fulfilled, rejected) => {
      responseHandlers.push({ fulfilled, rejected });
    });

    const mockCreate = jest.fn(() => ({
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    }));

    jest.doMock('axios', () => ({
      create: mockCreate,
    }));

    jest.doMock('react-native', () => ({
      Platform: { OS: platform },
    }));

    const mockStorage = {
      clearAll: jest.fn().mockResolvedValue(undefined),
      getToken: jest.fn().mockResolvedValue(null),
      saveToken: jest.fn().mockResolvedValue(undefined),
      removeToken: jest.fn().mockResolvedValue(undefined),
      getUserData: jest.fn().mockResolvedValue(null),
      saveUserData: jest.fn().mockResolvedValue(undefined),
      removeUserData: jest.fn().mockResolvedValue(undefined),
    };

    jest.doMock('../../utils/storage', () => ({
      storage: mockStorage,
    }));

    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          hostUri,
        },
      },
    }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let apiClient: any;
    let setNavigationRef: any;
    let getNavigationRef: any;
    let navigateFromOutside: any;
    let isNavigationReady: any;
    jest.isolateModules(() => {
      ({
        apiClient,
        setNavigationRef,
        getNavigationRef,
        navigateFromOutside,
        isNavigationReady,
      } = require('../../services/api.config'));
    });

    return {
      mockCreate,
      apiClient,
      setNavigationRef,
      getNavigationRef,
      navigateFromOutside,
      isNavigationReady,
      requestHandlers,
      responseHandlers,
      consoleSpy,
      consoleWarnSpy,
      mockStorage,
    };
  };

  it('configures production URL when no hostUri (Android)', () => {
    const { mockCreate, consoleSpy } = loadModule('android');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://memantra.onrender.com/api' }),
    );
    consoleSpy.mockRestore();
  });

  it('configures production URL when no hostUri (iOS)', () => {
    const { mockCreate, consoleSpy } = loadModule('ios');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://memantra.onrender.com/api' }),
    );
    consoleSpy.mockRestore();
  });

  it('passes through request and handles errors via interceptors', async () => {
    const { requestHandlers, consoleSpy } = loadModule('ios');
    const handler = requestHandlers[0];

    const config = { url: '/health' };
    await expect(handler.fulfilled(config)).resolves.toBe(config);

    await expect(handler.rejected(new Error('bad request'))).rejects.toThrow('bad request');

    consoleSpy.mockRestore();
  });

  it('returns responses and handles unauthorized errors', async () => {
    const { responseHandlers, setNavigationRef, consoleSpy, mockStorage } = loadModule('android');
    const handler = responseHandlers[0];

    const response = { data: 'ok' };
    expect(handler.fulfilled(response)).toBe(response);

    // Mock navigation
    const mockNavigationReset = jest.fn();
    const mockNavigation = { reset: mockNavigationReset };
    setNavigationRef(mockNavigation);

    const error = { response: { status: 401 } };
    await expect(handler.rejected(error)).rejects.toThrow(JSON.stringify(error));

    // Verify storage was cleared
    expect(mockStorage.clearAll).toHaveBeenCalled();

    // Verify navigation was reset to Login
    expect(mockNavigationReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });

    consoleSpy.mockRestore();
  });

  describe('IP Detection', () => {
    it('uses auto-detected IP for iOS when hostUri is provided without tunnel', () => {
      const { mockCreate, consoleSpy } = loadModule('ios', '192.168.1.100:8081');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'http://192.168.1.100:4000/api' }),
      );
      consoleSpy.mockRestore();
    });

    it('uses auto-detected IP for Android when hostUri is provided without tunnel', () => {
      const { mockCreate, consoleSpy } = loadModule('android', '192.168.1.100:8081');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'http://192.168.1.100:4000/api' }),
      );
      consoleSpy.mockRestore();
    });

    it('detects Expo tunnel and warns user', () => {
      const { mockCreate, consoleSpy, consoleWarnSpy } = loadModule(
        'ios',
        '8-o8wbg-test-8081.exp.direct',
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  Expo tunnel detected. Backend requires local IP in api.config.local.ts',
      );

      // Falls back to localhost for iOS when tunnel detected without local config
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'http://localhost:4000/api' }),
      );

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('uses production URL for Android when no hostUri', () => {
      const { mockCreate, consoleSpy } = loadModule('android', null);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'https://memantra.onrender.com/api' }),
      );
      consoleSpy.mockRestore();
    });

    it('uses production URL for iOS when no hostUri', () => {
      const { mockCreate, consoleSpy } = loadModule('ios', null);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'https://memantra.onrender.com/api' }),
      );
      consoleSpy.mockRestore();
    });

    it('uses production URL for web when no hostUri', () => {
      const { mockCreate, consoleSpy } = loadModule('web', null);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'https://memantra.onrender.com/api' }),
      );
      consoleSpy.mockRestore();
    });

    it('uses detected IP for web platform when hostUri is provided', () => {
      const { mockCreate, consoleSpy } = loadModule('web', '192.168.1.50:8081');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'http://192.168.1.50:4000/api' }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Request Interceptor - Token Attachment', () => {
    it('attaches Authorization header when token exists', async () => {
      const { requestHandlers, consoleSpy, mockStorage } = loadModule('ios');
      mockStorage.getToken.mockResolvedValueOnce('valid-jwt-token');

      const handler = requestHandlers[0];
      const config = { url: '/mantras', headers: {} };

      const result = await handler.fulfilled(config);

      expect(mockStorage.getToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer valid-jwt-token');
      consoleSpy.mockRestore();
    });

    it('does not attach Authorization header when no token', async () => {
      const { requestHandlers, consoleSpy, mockStorage } = loadModule('ios');
      mockStorage.getToken.mockResolvedValueOnce(null);

      const handler = requestHandlers[0];
      const config = { url: '/mantras', headers: {} };

      const result = await handler.fulfilled(config);

      expect(mockStorage.getToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('creates headers object if not present', async () => {
      const { requestHandlers, consoleSpy, mockStorage } = loadModule('ios');
      mockStorage.getToken.mockResolvedValueOnce('token-123');

      const handler = requestHandlers[0];
      const config = { url: '/mantras' }; // No headers property

      const result = await handler.fulfilled(config);

      expect(result.headers).toBeDefined();
      expect(result.headers.Authorization).toBe('Bearer token-123');
      consoleSpy.mockRestore();
    });
  });

  describe('Response Interceptor - Error Handling', () => {
    it('handles 401 error without navigation ref', async () => {
      const { responseHandlers, consoleSpy, mockStorage } = loadModule('ios');
      const handler = responseHandlers[0];

      const error = { response: { status: 401 } };
      await expect(handler.rejected(error)).rejects.toThrow();

      expect(mockStorage.clearAll).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles storage clearAll failure gracefully', async () => {
      const { responseHandlers, consoleSpy, mockStorage } = loadModule('ios');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockStorage.clearAll.mockRejectedValueOnce(new Error('Storage error'));

      const handler = responseHandlers[0];
      const error = { response: { status: 401 } };

      await expect(handler.rejected(error)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear storage:', expect.any(Error));
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles non-401 errors without clearing storage', async () => {
      const { responseHandlers, consoleSpy, mockStorage } = loadModule('ios');
      const handler = responseHandlers[0];

      const error = { response: { status: 500 } };
      await expect(handler.rejected(error)).rejects.toThrow();

      expect(mockStorage.clearAll).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('wraps Error objects correctly', async () => {
      const { responseHandlers, consoleSpy } = loadModule('ios');
      const handler = responseHandlers[0];

      const error = new Error('Network Error');
      await expect(handler.rejected(error)).rejects.toThrow('Network Error');
      consoleSpy.mockRestore();
    });

    it('handles errors without response property', async () => {
      const { responseHandlers, consoleSpy, mockStorage } = loadModule('ios');
      const handler = responseHandlers[0];

      const error = { message: 'Network timeout' };
      await expect(handler.rejected(error)).rejects.toThrow();

      expect(mockStorage.clearAll).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Navigation Helpers', () => {
    it('getNavigationRef returns null before setNavigationRef is called', () => {
      const { getNavigationRef, consoleSpy } = loadModule('ios');
      expect(getNavigationRef()).toBeNull();
      consoleSpy.mockRestore();
    });

    it('getNavigationRef returns ref after setNavigationRef is called', () => {
      const { setNavigationRef, getNavigationRef, consoleSpy } = loadModule('ios');
      const mockRef = { navigate: jest.fn() };
      setNavigationRef(mockRef);
      expect(getNavigationRef()).toBe(mockRef);
      consoleSpy.mockRestore();
    });

    it('isNavigationReady returns false before setNavigationRef is called', () => {
      const { isNavigationReady, consoleSpy } = loadModule('ios');
      expect(isNavigationReady()).toBe(false);
      consoleSpy.mockRestore();
    });

    it('isNavigationReady returns true after setNavigationRef is called', () => {
      const { setNavigationRef, isNavigationReady, consoleSpy } = loadModule('ios');
      const mockRef = { navigate: jest.fn() };
      setNavigationRef(mockRef);
      expect(isNavigationReady()).toBe(true);
      consoleSpy.mockRestore();
    });

    it('navigateFromOutside calls navigate when ref is set', () => {
      const { setNavigationRef, navigateFromOutside, consoleSpy } = loadModule('ios');
      const mockRef = { navigate: jest.fn() };
      setNavigationRef(mockRef);

      navigateFromOutside('Focus', { mantraId: 123 });

      expect(mockRef.navigate).toHaveBeenCalledWith('Focus', { mantraId: 123 });
      consoleSpy.mockRestore();
    });

    it('navigateFromOutside logs warning when ref is not set', () => {
      const { navigateFromOutside, consoleSpy, consoleWarnSpy } = loadModule('ios');

      navigateFromOutside('Focus', { mantraId: 123 });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Navigation ref not set, cannot navigate to:',
        'Focus',
      );
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});
