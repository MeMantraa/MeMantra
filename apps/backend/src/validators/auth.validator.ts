import { z } from 'zod';

//registration schema
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    code: z.string().length(6, 'Verification code must be 6 digits'),
    device_token: z.string().optional(),
  }),
});

// Schema for sending signup verification code (email only)
export const sendSignupCodeSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

// Schema for verifying signup code
export const verifySignupCodeSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    code: z.string().length(6, 'Verification code must be 6 digits'),
  }),
});

//login schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string(),
  }),
});

// Schema for forgot password (email only)
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

// Schema for verifying a password reset code
export const verifyResetCodeSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    code: z.string().length(6, 'Verification code must be 6 digits'),
  }),
});

// Schema for resetting password with a verified code
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    code: z.string().length(6, 'Verification code must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Schema for updating password (authenticated users)
export const updatePasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>['body'];