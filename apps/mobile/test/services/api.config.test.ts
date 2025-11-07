/* global require */

describe('api.config', () => {
  const loadModule = (platform: 'android' | 'ios' | 'web' = 'web') => {
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

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    let apiClient: any;
    jest.isolateModules(() => {
      ({ apiClient } = require('../../services/api.config'));
    });

    return { mockCreate, apiClient, requestHandlers, responseHandlers, consoleSpy };
  };

  it('configures base URL for Android', () => {
    const { mockCreate, consoleSpy } = loadModule('android');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://10.0.2.2:4000/api' }),
    );
    consoleSpy.mockRestore();
  });

  it('configures base URL for iOS', () => {
    const { mockCreate, consoleSpy } = loadModule('ios');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://localhost:4000/api' }),
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
    const { responseHandlers, consoleSpy } = loadModule('android');
    const handler = responseHandlers[0];

    const response = { data: 'ok' };
    expect(handler.fulfilled(response)).toBe(response);

    const error = { response: { status: 401 } };
    await expect(handler.rejected(error)).rejects.toThrow(JSON.stringify(error));

    consoleSpy.mockRestore();
  });
});
