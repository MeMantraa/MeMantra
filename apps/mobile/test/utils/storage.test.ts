/* global require */

// Unmock storage so we can test the actual implementation
jest.unmock('../../utils/storage');

describe('storage utility', () => {
  // Shared mock references that get set in loadStorageModule
  let mockAsyncStorage: {
    setItem: jest.Mock;
    getItem: jest.Mock;
    removeItem: jest.Mock;
  };
  let mockSecureStore: {
    setItemAsync: jest.Mock;
    getItemAsync: jest.Mock;
    deleteItemAsync: jest.Mock;
  };

  const loadStorageModule = (platformOS: string) => {
    jest.resetModules();

    // Create fresh mocks
    mockAsyncStorage = {
      setItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(undefined),
    };

    mockSecureStore = {
      setItemAsync: jest.fn().mockResolvedValue(undefined),
      getItemAsync: jest.fn().mockResolvedValue(null),
      deleteItemAsync: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mocks before requiring the module
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      __esModule: true,
      default: mockAsyncStorage,
    }));

    jest.doMock('expo-secure-store', () => mockSecureStore);

    jest.doMock('react-native', () => ({
      Platform: { OS: platformOS },
    }));

    // Now require the module with mocks in place

    return require('../../utils/storage').storage;
  };

  describe('native platforms (iOS/Android)', () => {
    it('saves token using SecureStore', async () => {
      const storage = loadStorageModule('ios');

      await storage.saveToken('jwt-value');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'jwt-value');
    });

    it('retrieves token using SecureStore', async () => {
      const storage = loadStorageModule('ios');
      mockSecureStore.getItemAsync.mockResolvedValueOnce('jwt-value');

      const token = await storage.getToken();

      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('jwt-value');
    });

    it('removes token using SecureStore', async () => {
      const storage = loadStorageModule('android');

      await storage.removeToken();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('stores user data using AsyncStorage', async () => {
      const storage = loadStorageModule('ios');
      const user = { id: 1, name: 'Tester' };

      await storage.saveUserData(user);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@user_data', JSON.stringify(user));
    });

    it('retrieves and parses user data', async () => {
      const storage = loadStorageModule('ios');
      const user = { id: 1, name: 'Tester' };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(user));

      const result = await storage.getUserData();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@user_data');
      expect(result).toEqual(user);
    });

    it('returns null when no user data exists', async () => {
      const storage = loadStorageModule('ios');
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storage.getUserData();

      expect(result).toBeNull();
    });

    it('removes user data', async () => {
      const storage = loadStorageModule('ios');

      await storage.removeUserData();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@user_data');
    });

    it('clears all stored values', async () => {
      const storage = loadStorageModule('ios');

      await storage.clearAll();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@user_data');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@terms_accepted');
    });

    it('returns user_id from stored user data', async () => {
      const storage = loadStorageModule('ios');
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ user_id: 42, name: 'Test' }));

      const userId = await storage.getUserId();

      expect(userId).toBe(42);
    });

    it('returns null for getUserId when no user data', async () => {
      const storage = loadStorageModule('ios');
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const userId = await storage.getUserId();

      expect(userId).toBeNull();
    });

    it('returns null for getUserId when user_id missing', async () => {
      const storage = loadStorageModule('ios');
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ name: 'Test' }));

      const userId = await storage.getUserId();

      expect(userId).toBeNull();
    });

    it('returns false when terms have not been accepted', async () => {
      const storage = loadStorageModule('ios');
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storage.hasAcceptedTerms();

      expect(result).toBe(false);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@terms_accepted');
    });

    it('returns true when terms have been accepted', async () => {
      const storage = loadStorageModule('ios');
      mockAsyncStorage.getItem.mockResolvedValueOnce('true');

      const result = await storage.hasAcceptedTerms();

      expect(result).toBe(true);
    });

    it('saves terms accepted flag', async () => {
      const storage = loadStorageModule('ios');

      await storage.setTermsAccepted();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@terms_accepted', 'true');
    });
  });

  describe('web platform fallback', () => {
    it('saves token using AsyncStorage with warning', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const storage = loadStorageModule('web');

      await storage.saveToken('web-token');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'SecureStore not available on web, using AsyncStorage',
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@auth_token', 'web-token');
      consoleWarnSpy.mockRestore();
    });

    it('retrieves token using AsyncStorage', async () => {
      const storage = loadStorageModule('web');
      mockAsyncStorage.getItem.mockResolvedValueOnce('web-token');

      const token = await storage.getToken();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@auth_token');
      expect(token).toBe('web-token');
    });

    it('removes token using AsyncStorage', async () => {
      const storage = loadStorageModule('web');

      await storage.removeToken();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
    });

    it('clearAll uses AsyncStorage for token', async () => {
      const storage = loadStorageModule('web');

      await storage.clearAll();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@user_data');
    });
  });
});
