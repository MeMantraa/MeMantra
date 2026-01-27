import { authService } from '../../services/auth.service';

const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../services/api.config', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the login endpoint and returns the response data', async () => {
    const payload = { email: 'user@example.com', password: 'secret' };
    const data = { status: 'success' };
    mockPost.mockResolvedValueOnce({ data });

    const result = await authService.login(payload);

    expect(mockPost).toHaveBeenCalledWith('/auth/login', payload);
    expect(result).toBe(data);
  });

  it('calls the register endpoint and returns the response data', async () => {
    const payload = { username: 'newuser', email: 'new@example.com', password: 'pass123' };
    const data = { status: 'success' };
    mockPost.mockResolvedValueOnce({ data });

    const result = await authService.register(payload);

    expect(mockPost).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toBe(data);
  });

  it('calls the getMe endpoint with the provided token', async () => {
    const data = { status: 'success' };
    mockGet.mockResolvedValueOnce({ data });

    const result = await authService.getMe('jwt-token');

    expect(mockGet).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer jwt-token' },
    });
    expect(result).toBe(data);
  });

  describe('forgotPassword', () => {
    it('calls the forgot-password endpoint with email and returns response data', async () => {
      const email = 'user@example.com';
      const data = { status: 'success', message: 'Reset code sent to email' };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.forgotPassword(email);

      expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email });
      expect(result).toBe(data);
    });

    it('handles error when forgot-password request fails', async () => {
      const email = 'user@example.com';
      const error = new Error('Network error');
      mockPost.mockRejectedValueOnce(error);

      await expect(authService.forgotPassword(email)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email });
    });

    it('returns rate limit response with waitTime', async () => {
      const email = 'user@example.com';
      const data = {
        status: 'error',
        message: 'Too many requests',
        waitTime: 300,
      };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.forgotPassword(email);

      expect(result).toEqual(data);
      expect(result.waitTime).toBe(300);
    });
  });

  describe('verifyResetCode', () => {
    it('calls the verify-code endpoint with email and code', async () => {
      const email = 'user@example.com';
      const code = '123456';
      const data = { status: 'success', message: 'Code verified successfully' };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.verifyResetCode(email, code);

      expect(mockPost).toHaveBeenCalledWith('/auth/verify-code', { email, code });
      expect(result).toBe(data);
    });

    it('handles invalid code error', async () => {
      const email = 'user@example.com';
      const code = 'invalid';
      const error = new Error('Invalid code');
      mockPost.mockRejectedValueOnce(error);

      await expect(authService.verifyResetCode(email, code)).rejects.toThrow('Invalid code');
      expect(mockPost).toHaveBeenCalledWith('/auth/verify-code', { email, code });
    });

    it('returns error response for expired code', async () => {
      const email = 'user@example.com';
      const code = '123456';
      const data = {
        status: 'error',
        message: 'Code has expired',
      };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.verifyResetCode(email, code);

      expect(result).toEqual(data);
      expect(result.status).toBe('error');
    });
  });

  describe('resetPassword', () => {
    it('calls the reset-password endpoint with email, code, and new password', async () => {
      const email = 'user@example.com';
      const code = '123456';
      const newPassword = 'NewSecurePassword123!';
      const data = { status: 'success', message: 'Password reset successfully' };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.resetPassword(email, code, newPassword);

      expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      expect(result).toBe(data);
    });

    it('handles error when reset-password request fails', async () => {
      const email = 'user@example.com';
      const code = '123456';
      const newPassword = 'NewPassword123!';
      const error = new Error('Server error');
      mockPost.mockRejectedValueOnce(error);

      await expect(authService.resetPassword(email, code, newPassword)).rejects.toThrow(
        'Server error',
      );
      expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
    });

    it('returns error response for invalid code during password reset', async () => {
      const email = 'user@example.com';
      const code = 'invalid';
      const newPassword = 'NewPassword123!';
      const data = {
        status: 'error',
        message: 'Invalid or expired code',
      };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.resetPassword(email, code, newPassword);

      expect(result).toEqual(data);
      expect(result.status).toBe('error');
    });

    it('handles weak password validation error', async () => {
      const email = 'user@example.com';
      const code = '123456';
      const newPassword = 'weak';
      const data = {
        status: 'error',
        message: 'Password does not meet requirements',
      };
      mockPost.mockResolvedValueOnce({ data });

      const result = await authService.resetPassword(email, code, newPassword);

      expect(result).toEqual(data);
      expect(result.message).toContain('Password does not meet requirements');
    });
  });
});
