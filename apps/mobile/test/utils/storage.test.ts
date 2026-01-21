// Unmock storage module for this test since we want to test the real implementation
jest.unmock('../../utils/storage');

// AsyncStorage mocks (for user data)
const mockAsyncSetItem = jest.fn();
const mockAsyncGetItem = jest.fn();
const mockAsyncRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (...args: unknown[]) => mockAsyncSetItem(...args),
  getItem: (...args: unknown[]) => mockAsyncGetItem(...args),
  removeItem: (...args: unknown[]) => mockAsyncRemoveItem(...args),
}));

// SecureStore mocks (for auth token)
const mockSecureSetItem = jest.fn();
const mockSecureGetItem = jest.fn();
const mockSecureDeleteItem = jest.fn();

jest.mock('expo-secure-store', () => ({
  setItemAsync: (...args: unknown[]) => mockSecureSetItem(...args),
  getItemAsync: (...args: unknown[]) => mockSecureGetItem(...args),
  deleteItemAsync: (...args: unknown[]) => mockSecureDeleteItem(...args),
}));

// Mock Platform to return 'ios' so SecureStore is used
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

import { storage } from '../../utils/storage';

describe('storage utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and retrieves a token using SecureStore', async () => {
    mockSecureGetItem.mockResolvedValueOnce('jwt-value');

    await storage.saveToken('jwt-value');
    const token = await storage.getToken();

    expect(mockSecureSetItem).toHaveBeenCalledWith('auth_token', 'jwt-value');
    expect(mockSecureGetItem).toHaveBeenCalledWith('auth_token');
    expect(token).toBe('jwt-value');
  });

  it('removes the auth token using SecureStore', async () => {
    await storage.removeToken();
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('auth_token');
  });

  it('stores and parses user data', async () => {
    const user = { id: 1, name: 'Tester' };
    mockAsyncGetItem.mockResolvedValueOnce(JSON.stringify(user));

    await storage.saveUserData(user);
    const result = await storage.getUserData();

    expect(mockAsyncSetItem).toHaveBeenCalledWith('@user_data', JSON.stringify(user));
    expect(mockAsyncGetItem).toHaveBeenCalledWith('@user_data');
    expect(result).toEqual(user);
  });

  it('removes user data', async () => {
    await storage.removeUserData();
    expect(mockAsyncRemoveItem).toHaveBeenCalledWith('@user_data');
  });

  it('clears all stored values', async () => {
    await storage.clearAll();
    // clearAll removes token via SecureStore and user data via AsyncStorage
    expect(mockSecureDeleteItem).toHaveBeenCalledWith('auth_token');
    expect(mockAsyncRemoveItem).toHaveBeenCalledWith('@user_data');
  });

  it('returns null if no user data is stored', async () => {
    mockAsyncGetItem.mockResolvedValueOnce(null);

    const result = await storage.getUserData();

    expect(mockAsyncGetItem).toHaveBeenCalledWith('@user_data');
    expect(result).toBeNull();
  });
});
