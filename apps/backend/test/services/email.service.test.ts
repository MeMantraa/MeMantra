jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  })),
}));

const mockRandomBytes = jest.fn();

jest.mock('crypto', () => ({
  randomBytes: mockRandomBytes,
}));

// Mock console methods to avoid clutter in test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

import { emailService, generate6DigitCode, send6DigitCode } from '../../src/services/email.service';

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockReset();
    mockRandomBytes.mockReset();
  });

  describe('generate6DigitCode', () => {
    it('should generate a 6-digit code', () => {
      // Mock crypto.randomBytes to return predictable value
      const mockBuffer = Buffer.from([0x00, 0x01, 0x86, 0xA0]); // 100000 in hex
      mockRandomBytes.mockReturnValue(mockBuffer);

      const code = generate6DigitCode();

      expect(mockRandomBytes).toHaveBeenCalledWith(4);
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('should generate codes between 100000 and 999999', () => {
      // Test with minimum value
      const minBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]); // 0
      mockRandomBytes.mockReturnValue(minBuffer);
      const minCode = generate6DigitCode();
      expect(parseInt(minCode)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(minCode)).toBeLessThanOrEqual(999999);

      // Test with maximum value
      const maxBuffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]); // 4294967295
      mockRandomBytes.mockReturnValue(maxBuffer);
      const maxCode = generate6DigitCode();
      expect(parseInt(maxCode)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(maxCode)).toBeLessThanOrEqual(999999);
    });

    it('should return code as string', () => {
      const mockBuffer = Buffer.from([0x00, 0x01, 0x86, 0xA0]);
      mockRandomBytes.mockReturnValue(mockBuffer);

      const code = generate6DigitCode();

      expect(typeof code).toBe('string');
    });

    it('should generate different codes with different random values', () => {
      // Use two significantly different values
      const buffer1 = Buffer.from([0x00, 0x00, 0x00, 0x64]); // 100 -> (100 % 900000) + 100000 = 100100
      const buffer2 = Buffer.from([0x00, 0x0D, 0xB6, 0xE4]); // 898788 -> (898788 % 900000) + 100000 = 998788
      
      mockRandomBytes.mockReturnValueOnce(buffer1);
      const code1 = generate6DigitCode();
      
      mockRandomBytes.mockReturnValueOnce(buffer2);
      const code2 = generate6DigitCode();

      expect(code1).not.toBe(code2);
      expect(parseInt(code1)).toBe(100100);
      expect(parseInt(code2)).toBe(998788);
    });

    it('should handle edge case with value exactly at 100000', () => {
      const buffer = Buffer.from([0x00, 0x01, 0x86, 0xA0]); // 100000
      mockRandomBytes.mockReturnValue(buffer);

      const code = generate6DigitCode();

      expect(parseInt(code)).toBe(200000);
    });

    it('should handle modulo operation correctly', () => {
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      mockRandomBytes.mockReturnValue(buffer);

      const code = generate6DigitCode();

      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });
  });

  describe('send6DigitCode', () => {
    const testEmail = 'test@example.com';
    const testCode = '123456';

    beforeEach(() => {
      process.env.EMAIL_USER = 'noreply@memantra.com';
    });

    it('should send email successfully and return true', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await send6DigitCode(testEmail, testCode);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        `Verification code sent successfully to ${testEmail}`
      );
    });

    it('should return false if email sending fails', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await send6DigitCode(testEmail, testCode);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error sending verification email:',
        expect.any(Error)
      );
    });

    it('should include correct email metadata', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from).toEqual({
        name: 'MeMantra',
        address: 'noreply@memantra.com',
      });
      expect(callArgs.to).toBe(testEmail);
      expect(callArgs.subject).toBe('Password Reset Verification Code');
    });

    it('should include code in HTML content', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(testCode);
      expect(callArgs.html).toContain('Password Reset Request');
      expect(callArgs.html).toContain('This code will expire in 10 minutes');
    });

    it('should include code in plain text content', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain(testCode);
      expect(callArgs.text).toContain('Your MeMantra password reset verification code is:');
      expect(callArgs.text).toContain('This code will expire in 10 minutes');
    });

    it('should include current year in HTML footer', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      const currentYear = new Date().getFullYear();
      expect(callArgs.html).toContain(`© ${currentYear} MeMantra`);
    });

    it('should handle empty EMAIL_USER environment variable', async () => {
      delete process.env.EMAIL_USER;
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from.address).toBe('');
    });

    it('should include security message in email', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(
        "If you didn't request a password reset, please ignore this email"
      );
      expect(callArgs.text).toContain(
        "If you didn't request a password reset, please ignore this email"
      );
    });

    it('should handle network errors gracefully', async () => {
      mockSendMail.mockRejectedValue(new Error('Network timeout'));

      const result = await send6DigitCode(testEmail, testCode);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error sending verification email:',
        expect.objectContaining({ message: 'Network timeout' })
      );
    });

    it('should handle authentication errors gracefully', async () => {
      mockSendMail.mockRejectedValue(new Error('Invalid credentials'));

      const result = await send6DigitCode(testEmail, testCode);

      expect(result).toBe(false);
    });

    it('should handle invalid email address errors gracefully', async () => {
      mockSendMail.mockRejectedValue(new Error('Invalid email address'));

      const result = await send6DigitCode('invalid-email', testCode);

      expect(result).toBe(false);
    });

    it('should include responsive email design elements', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('meta name="viewport"');
      expect(callArgs.html).toContain('width: 600px');
      expect(callArgs.html).toContain('border-radius');
    });

    it('should style verification code prominently', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await send6DigitCode(testEmail, testCode);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('font-size: 36px');
      expect(callArgs.html).toContain('font-weight: bold');
      expect(callArgs.html).toContain('letter-spacing: 8px');
    });
  });

  describe('emailService object', () => {
    it('should export send6DigitCode method', () => {
      expect(emailService.send6DigitCode).toBeDefined();
      expect(typeof emailService.send6DigitCode).toBe('function');
    });

    it('should export generate6DigitCode method', () => {
      expect(emailService.generate6DigitCode).toBeDefined();
      expect(typeof emailService.generate6DigitCode).toBe('function');
    });

    it('should have both methods accessible via emailService', () => {
      expect(Object.keys(emailService)).toContain('send6DigitCode');
      expect(Object.keys(emailService)).toContain('generate6DigitCode');
    });
  });
});
