/**
 * Tests for email service initialization logic
 * These tests verify the Brevo configuration based on environment variables
 */

describe('Email Service Initialization', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    jest.doMock('axios', () => ({
      post: jest.fn(),
      default: { post: jest.fn() },
      __esModule: true,
    }));

    jest.doMock('node:crypto', () => ({
      randomBytes: jest.fn(),
    }));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should log ready message when BREVO_API_KEY is configured in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.BREVO_API_KEY = 'test-api-key-123';

    require('../../src/services/email.service');

    expect(consoleSpy).toHaveBeenCalledWith('Email service is ready to send messages');

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should warn when BREVO_API_KEY is missing in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete process.env.BREVO_API_KEY;

    require('../../src/services/email.service');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'BREVO_API_KEY not configured. Emails will not be sent.',
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not log or warn in test environment', () => {
    process.env.NODE_ENV = 'test';
    process.env.BREVO_API_KEY = 'test-api-key-123';

    require('../../src/services/email.service');

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not log or warn in test environment even without API key', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.BREVO_API_KEY;

    require('../../src/services/email.service');

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
