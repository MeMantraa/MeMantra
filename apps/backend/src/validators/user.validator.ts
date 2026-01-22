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

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];