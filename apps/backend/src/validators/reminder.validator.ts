import { z } from 'zod';

// Reminder status and frequency enums
const reminderStatusEnum = z.enum(['active', 'paused', 'completed']);
const reminderFrequencyEnum = z.enum(['once', 'daily', 'weekly', 'monthly', 'custom', 'routine']);

// HH:MM time format validator for routine schedule times
const timeSlotSchema = z.string().regex(
  /^([01]\d|2[0-3]):([0-5]\d)$/,
  'Must be in HH:MM format (00:00-23:59)'
);

// Day of week validator (0=Sunday, 6=Saturday)
const dayOfWeekSchema = z.number().int().min(0).max(6);

// IANA timezone validator
const timezoneSchema = z.string().min(1).max(64);

// Create reminder schema - requires either mantra_id or collection_id (not both)
export const createReminderSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Mantra ID must be a positive integer').optional(),
    collection_id: z.number().int().positive('Collection ID must be a positive integer').optional(),
    time: z.string().datetime('Must be a valid ISO 8601 datetime').optional(),
    frequency: reminderFrequencyEnum,
    status: reminderStatusEnum.optional().default('active'),
    schedule_times: z.array(timeSlotSchema).min(1).max(5)
      .refine((times) => new Set(times).size === times.length, { message: 'Duplicate times are not allowed' })
      .optional(),
    schedule_days: z.array(dayOfWeekSchema).min(1).max(7).optional(),
    timezone: timezoneSchema.optional(),
  })
  .refine(
    (data) => (data.mantra_id !== undefined) !== (data.collection_id !== undefined),
    { message: 'Exactly one of mantra_id or collection_id must be provided' }
  )
  .refine(
    (data) => {
      if (data.frequency === 'routine') {
        return data.schedule_times !== undefined && data.schedule_times.length > 0
          && data.timezone !== undefined;
      }
      return data.time !== undefined;
    },
    { message: 'Routine reminders require schedule_times and timezone; other frequencies require time' }
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
    schedule_times: z.array(timeSlotSchema).min(1).max(5)
      .refine((times) => new Set(times).size === times.length, { message: 'Duplicate times are not allowed' })
      .optional(),
    schedule_days: z.array(dayOfWeekSchema).min(1).max(7).optional(),
    timezone: timezoneSchema.optional(),
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

// Schedule preview schema
export const schedulePreviewSchema = z.object({
  body: z.object({
    schedule_times: z.array(timeSlotSchema).min(1).max(5)
      .refine((times) => new Set(times).size === times.length, { message: 'Duplicate times are not allowed' }),
    schedule_days: z.array(dayOfWeekSchema).min(1).max(7).optional(),
    timezone: timezoneSchema,
  }),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>['body'];
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>['body'];
export type SchedulePreviewInput = z.infer<typeof schedulePreviewSchema>['body'];
