import { storage } from '../../utils/storage';

const mockSetItem = jest.fn();
const mockGetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockMultiRemove = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (...args: unknown[]) => mockSetItem(...args),
  getItem: (...args: unknown[]) => mockGetItem(...args),
  removeItem: (...args: unknown[]) => mockRemoveItem(...args),
  multiRemove: (...args: unknown[]) => mockMultiRemove(...args),
}));

describe('storage utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and retrieves a token', async () => {
    mockGetItem.mockResolvedValueOnce('jwt-value');

    await storage.saveToken('jwt-value');
    const token = await storage.getToken();

    expect(mockSetItem).toHaveBeenCalledWith('@auth_token', 'jwt-value');
    expect(mockGetItem).toHaveBeenCalledWith('@auth_token');
    expect(token).toBe('jwt-value');
  });

  it('removes the auth token', async () => {
    await storage.removeToken();
    expect(mockRemoveItem).toHaveBeenCalledWith('@auth_token');
  });

  it('stores and parses user data', async () => {
    const user = { id: 1, name: 'Tester' };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(user));

    await storage.saveUserData(user);
    const result = await storage.getUserData();

    expect(mockSetItem).toHaveBeenCalledWith('@user_data', JSON.stringify(user));
    expect(mockGetItem).toHaveBeenCalledWith('@user_data');
    expect(result).toEqual(user);
  });

  it('removes user data and clears all stored values', async () => {
    await storage.removeUserData();
    expect(mockRemoveItem).toHaveBeenCalledWith('@user_data');

    await storage.clearAll();
    expect(mockMultiRemove).toHaveBeenCalledWith(['@auth_token', '@user_data']);
  });
});
