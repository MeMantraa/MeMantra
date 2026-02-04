import { z } from 'zod';

// Reminder status and frequency enums
const reminderStatusEnum = z.enum(['active', 'paused', 'completed']);
const reminderFrequencyEnum = z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']);

// Create reminder schema - requires either mantra_id or collection_id (not both)
export const createReminderSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Mantra ID must be a positive integer').optional(),
    collection_id: z.number().int().positive('Collection ID must be a positive integer').optional(),
    time: z.string().datetime('Must be a valid ISO 8601 datetime'),
    frequency: reminderFrequencyEnum,
    status: reminderStatusEnum.optional().default('active'),
  }).refine(
    (data) => (data.mantra_id !== undefined) !== (data.collection_id !== undefined),
    { message: 'Exactly one of mantra_id or collection_id must be provided' }
  ),
});

// Update reminder schema
export const updateReminderSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive().optional(),
    collection_id: z.number().int().positive().optional(),
    time: z.string().datetime().optional(),
    frequency: reminderFrequencyEnum.optional(),
    status: reminderStatusEnum.optional(),
  }),
});

// Reminder ID param schema
export const reminderIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid reminder ID')),
  }),
});

// Query schema for upcoming reminders
export const upcomingQuerySchema = z.object({
  query: z.object({
    hours: z.string().transform(Number).pipe(z.number().min(1).max(168)).optional(),
  }),
});

// Query schema for frequency filter
export const frequencyQuerySchema = z.object({
  query: z.object({
    frequency: reminderFrequencyEnum,
  }),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>['body'];
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>['body'];
