import { requestLogger, errorLogger } from '../../../src/middleware/logger.middleware';
import { Request, Response, NextFunction } from 'express';

describe('requestLogger', () => {
  
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/test',
      protocol: 'http',
      get: ((header: string) => {

        if (header === "set-cookie") return ["cookie1=value1", "cookie2=value2"];
        if (header === "authorization") return "Bearer token";
        if (header === "origin") return "localhost:3000";
        if (header === "content-type") return "application/json";
        if (header === "user-agent") return "jest";

        return undefined;

      }) as any,

      originalUrl: '/api/test?foo=bar',
      ip: '127.0.0.1',
      body: { username: 'user', password: 'secret', confirmPassword: 'secret2' },
      query: { foo: 'bar' }

    };

    res = {

      statusCode: 200,
      send: jest.fn(function (this: any, data: any) { return data; })
    };

    next = jest.fn();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
  });


  afterEach(() => {

    consoleLogSpy.mockRestore();

  });

  it('logs request and response, redacts sensitive fields', () => {

    requestLogger(req as Request, res as Response, next);

    // Simulate sending a JSON response
    (res.send as any).call(res, JSON.stringify({ result: 'ok' }));

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('API REQUEST'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('API RESPONSE'));
    expect(next).toHaveBeenCalled();
  
  });

  it('logs request with no body or query', () => {

    req.body = {};
    req.query = {};
    requestLogger(req as Request, res as Response, next);

    (res.send as any).call(res, 'plain text');

    expect(consoleLogSpy).toHaveBeenCalled();
  
    expect(next).toHaveBeenCalled();

  });

});

describe('errorLogger', () => {

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {

    req = { method: 'GET', path: '/api/error' };
    res = {};
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  });

  afterEach(() => {

    consoleErrorSpy.mockRestore();

  });

  it('logs error details and calls next', () => {

    const err = new Error('Test error');

    errorLogger(err, req as Request, res as Response, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('API ERROR'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    expect(next).toHaveBeenCalledWith(err);

  });

});

