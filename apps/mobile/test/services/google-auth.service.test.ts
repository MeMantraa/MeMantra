/* global require */

describe('useGoogleAuth', () => {
  it('delegates to the Expo auth request hook', () => {
    jest.resetModules();

    const mockUseAuthRequest = jest.fn(() => ['request', 'response', jest.fn()]);
    const mockMaybeCompleteAuthSession = jest.fn();

    jest.doMock('expo-auth-session/providers/google', () => ({
      useAuthRequest: mockUseAuthRequest,
    }));

    jest.doMock('expo-web-browser', () => ({
      maybeCompleteAuthSession: mockMaybeCompleteAuthSession,
    }));

    jest.isolateModules(() => {
      const { useGoogleAuth } = require('../../services/google-auth.service');
      const result = useGoogleAuth();

      expect(mockMaybeCompleteAuthSession).toHaveBeenCalled();
      expect(mockUseAuthRequest).toHaveBeenCalledWith({
        androidClientId: '837744591033-ju2acrfhaivd2hhc87f5hrhltgp5bu00.apps.googleusercontent.com',
        iosClientId: '837744591033-vbeh1un6ghnm6t5q86cd5b0ub102m600.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });
      expect(result.request).toBe('request');
      expect(result.response).toBe('response');
      expect(typeof result.promptAsync).toBe('function');
    });
  });
});

describe('fetchGoogleUserInfo', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns parsed json when the response is ok', async () => {
    jest.resetModules();
    const data = { name: 'Google User' };
    const mockJson = jest.fn().mockResolvedValue(data);
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: mockJson }) as any;

    const { fetchGoogleUserInfo } = require('../../services/google-auth.service');

    const result = await fetchGoogleUserInfo('access-token');

    expect(globalThis.fetch).toHaveBeenCalledWith('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: 'Bearer access-token' },
    });
    expect(result).toEqual(data);
  });

  it('throws an error when the response is not ok', async () => {
    jest.resetModules();
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

    const { fetchGoogleUserInfo } = require('../../services/google-auth.service');

    await expect(fetchGoogleUserInfo('bad-token')).rejects.toThrow('Failed to fetch user info');
  });
});
