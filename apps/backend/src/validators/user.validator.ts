import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.email({ message: 'Invalid email format' }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.email({ message: 'Invalid email format' }).optional(),
    password: z.string().min(8).optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid user ID')),
  }),
});

const featureFlagKeySchema = z
  .string()
  .trim()
  .min(1, 'Feature flag is required')
  .max(100, 'Feature flag is too long')
  .regex(/^[A-Z0-9_]+$/, 'Feature flag must use A-Z, 0-9, and underscore');

export const featureFlagSchema = z.object({
  params: z.object({
    flag: featureFlagKeySchema,
  }),
});

export const featureFlagAssignUserSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid user ID')),
    flag: featureFlagKeySchema,
  }),
  body: z.object({
    enabled: z.boolean(),
  }),
});

export const featureFlagToggleAllSchema = z.object({
  params: z.object({
    flag: featureFlagKeySchema,
  }),
  body: z.object({
    enabled: z.boolean(),
  }),
});

export const featureFlagRolloutSchema = z.object({
  params: z.object({
    flag: featureFlagKeySchema,
  }),
  body: z.object({
    percentage: z
      .number()
      .int('percentage must be an integer')
      .min(1, 'percentage must be between 1 and 100')
      .max(100, 'percentage must be between 1 and 100'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type FeatureFlagAssignUserInput = z.infer<typeof featureFlagAssignUserSchema>['body'];
export type FeatureFlagToggleAllInput = z.infer<typeof featureFlagToggleAllSchema>['body'];
export type FeatureFlagRolloutInput = z.infer<typeof featureFlagRolloutSchema>['body'];