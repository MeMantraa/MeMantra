import { z } from 'zod';

// Create reminder schema
export const createReminderSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Invalid mantra ID'),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly'], {
      message: 'Frequency must be once, daily, weekly, or monthly',
    }),
    status: z.enum(['active', 'inactive', 'completed']).default('active'),
  }),
});

// Update reminder schema
export const updateReminderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid reminder ID').transform(Number),
  }),
  body: z.object({
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
    status: z.enum(['active', 'inactive', 'completed']).optional(),
  }),
});

// Get reminder by ID schema
export const getReminderByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid reminder ID').transform(Number),
  }),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>['body'];
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>['body'];
