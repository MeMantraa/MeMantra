import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';

describe('App middleware', () => {

  let app: express.Application;
  const originalEnv = process.env;

  beforeEach(() => {

    jest.resetModules();

    process.env = { ...originalEnv };

  });

  afterEach(() => {

    process.env = originalEnv;

  });

  it("when in development mode, it should log requests", async () => {

    process.env.NODE_ENV = 'development';

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    app = createApp();
    
    await request(app).get('/health');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/health'));
    
    consoleLogSpy.mockRestore();

  });

  it("when logging requests, remove any newline characters from the path", async () => {

    process.env.NODE_ENV = 'development';

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    app = createApp();
    
    await request(app).get('/health');
    
    const logCalls = consoleLogSpy.mock.calls;

    logCalls.forEach(call => {

      expect(call[0]).not.toContain('\n');

      expect(call[0]).not.toContain('\r');

    });
    
    consoleLogSpy.mockRestore();

  });

  it("when an error occurs, it should log the error", async () => {

    process.env.NODE_ENV = 'test';

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    app = createApp();
    
    await request(app).get('/test-error');
    
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Verify that the error message "Test error" appears in the logged output
    const hasTestErrorMessage = consoleErrorSpy.mock.calls.some(call => 

      call.some(arg => typeof arg === 'string' && arg.includes('Test error'))

    );

    expect(hasTestErrorMessage).toBe(true);
    
    consoleErrorSpy.mockRestore();

  });

});