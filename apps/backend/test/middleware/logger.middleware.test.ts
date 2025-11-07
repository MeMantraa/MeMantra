import { Request, Response, NextFunction } from 'express';
import { requestLogger, errorLogger } from '../../src/middleware/logger.middleware';

describe('Logger Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock request
    req = {
      get: function (header: string) {
        return (this.headers as any)[header.toLowerCase()];
      },
      headers: {
        'content-type': 'application/json',
        'user-agent': 'jest',
        authorization: 'Bearer token',
      },
      body: { username: 'test', password: 'secret', confirmPassword: 'secret' },
      query: { query: '1' },
      protocol: 'http',
      originalUrl: '/test?query=1',
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
      get path() { return '/test'; },
      get method() { return 'POST'; },
    };

    // Mock response
    res = {
      statusCode: 200,
      send: jest.fn(function (data) {
        return data;
      }),
    };

    next = jest.fn();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log response JSON correctly', () => {
    requestLogger(req as Request, res as Response, next);

    const data = { success: true, data: Array(1000).fill('x').join('') };
    res.send!(JSON.stringify(data));

    const responsePreviewCall = consoleLogSpy.mock.calls.find((call) =>
      call[0]?.includes('Response Preview:')
    );
    expect(responsePreviewCall![0]).toMatch(/Response Preview:/);
  });

  it('should handle non-JSON response gracefully', () => {
    requestLogger(req as Request, res as Response, next);

    res.send!('<html>non-json</html>');

    const nonJsonCall = consoleLogSpy.mock.calls.find((call) =>
      call[0]?.includes('Response: [Non-JSON or Binary Data]')
    );
    expect(nonJsonCall).toBeDefined();
  });

  it('should log errors correctly', () => {
    const error = new Error('Test error');
    error.name = 'TestError';

    // Mock request for errorLogger
    req = {
      ...req,
      get path() { return '/error'; },
      get method() { return 'GET'; },
    };

    errorLogger(error, req as Request, res as Response, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('API ERROR')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('TestError'));
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should handle request with empty body and query without errors', () => {
    req.body = {};
    req.query = {};

    requestLogger(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

});
