/**
 * Tests for email service initialization logic
 * These tests verify the transporter configuration based on environment variables
 */

describe('Email Service Initialization', () => {
  let mockVerify: jest.Mock;
  let mockCreateTransport: jest.Mock;
  let consoleSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock verify function
    mockVerify = jest.fn((callback) => {
      callback(null); // Success by default
    });

    // Mock createTransport
    mockCreateTransport = jest.fn(() => ({
      verify: mockVerify,
      sendMail: jest.fn(),
    }));

    jest.doMock('nodemailer', () => ({
      createTransport: mockCreateTransport,
    }));

    jest.doMock('node:crypto', () => ({
      randomBytes: jest.fn(),
    }));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should verify transporter when credentials are configured in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'password123';

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Email service is ready to send messages');

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log error when verification fails', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'wrong-password';

    const verifyError = new Error('Invalid credentials');
    mockVerify.mockImplementationOnce((callback) => {
      callback(verifyError);
    });

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Email service configuration error:',
      verifyError,
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should warn when EMAIL_USER is missing in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete process.env.EMAIL_USER;
    process.env.EMAIL_PASS = 'password123';

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Email credentials not configured. Password reset emails will not be sent.',
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should warn when EMAIL_PASS is missing in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_USER = 'test@example.com';
    delete process.env.EMAIL_PASS;

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Email credentials not configured. Password reset emails will not be sent.',
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should warn when both EMAIL_USER and EMAIL_PASS are missing in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Email credentials not configured. Password reset emails will not be sent.',
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not verify or warn in test environment', () => {
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'password123';

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not verify or warn in test environment even without credentials', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    // Import module to trigger initialization
    require('../../src/services/email.service');

    expect(mockVerify).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
