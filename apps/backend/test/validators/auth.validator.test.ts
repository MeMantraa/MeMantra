import {
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '../../src/validators/auth.validator';

describe('Auth Validators', () => {
  describe('forgotPasswordSchema', () => {
    it('should accept a valid email', () => {
      const result = forgotPasswordSchema.safeParse({ body: { email: 'user@example.com' } });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = forgotPasswordSchema.safeParse({ body: {} });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = forgotPasswordSchema.safeParse({ body: { email: 'not-an-email' } });
      expect(result.success).toBe(false);
    });

    it('should reject non-string email', () => {
      const result = forgotPasswordSchema.safeParse({ body: { email: 123 } });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyResetCodeSchema', () => {
    it('should accept valid email and 6-digit code', () => {
      const result = verifyResetCodeSchema.safeParse({ body: { email: 'user@example.com', code: '123456' } });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = verifyResetCodeSchema.safeParse({ body: { code: '123456' } });
      expect(result.success).toBe(false);
    });

    it('should reject missing code', () => {
      const result = verifyResetCodeSchema.safeParse({ body: { email: 'user@example.com' } });
      expect(result.success).toBe(false);
    });

    it('should reject code shorter than 6 characters', () => {
      const result = verifyResetCodeSchema.safeParse({ body: { email: 'user@example.com', code: '12345' } });
      expect(result.success).toBe(false);
    });

    it('should reject code longer than 6 characters', () => {
      const result = verifyResetCodeSchema.safeParse({ body: { email: 'user@example.com', code: '1234567' } });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = verifyResetCodeSchema.safeParse({ body: { email: 'bad', code: '123456' } });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept valid email, code, and password', () => {
      const result = resetPasswordSchema.safeParse({
        body: { email: 'user@example.com', code: '123456', newPassword: 'securepass' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = resetPasswordSchema.safeParse({
        body: { code: '123456', newPassword: 'securepass' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing code', () => {
      const result = resetPasswordSchema.safeParse({
        body: { email: 'user@example.com', newPassword: 'securepass' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing newPassword', () => {
      const result = resetPasswordSchema.safeParse({
        body: { email: 'user@example.com', code: '123456' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        body: { email: 'user@example.com', code: '123456', newPassword: 'short' },
      });
      expect(result.success).toBe(false);
    });

    it('should accept password with exactly 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        body: { email: 'user@example.com', code: '123456', newPassword: '12345678' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updatePasswordSchema', () => {
    it('should accept a valid password', () => {
      const result = updatePasswordSchema.safeParse({ body: { password: 'securepass123' } });
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const result = updatePasswordSchema.safeParse({ body: {} });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = updatePasswordSchema.safeParse({ body: { password: 'short' } });
      expect(result.success).toBe(false);
    });

    it('should accept password with exactly 8 characters', () => {
      const result = updatePasswordSchema.safeParse({ body: { password: '12345678' } });
      expect(result.success).toBe(true);
    });
  });
});
