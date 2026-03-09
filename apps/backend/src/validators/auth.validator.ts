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

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];