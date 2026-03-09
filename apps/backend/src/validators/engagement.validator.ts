import { z } from 'zod';

export const ENGAGEMENT_EVENT_TYPES = [
  'app_open',
  'mantra_like',
  'mantra_save',
  'mantra_rate',
  'journal_create',
  'reminder_create',
  'collection_create',
  'collection_add',
  'notification_sent',
  'notification_tap_recommendation',
  'notification_tap_reminder',
  'notification_tap_collection_reminder',
] as const;

export const trackEventSchema = z.object({
  body: z.object({
    event_type: z.enum(ENGAGEMENT_EVENT_TYPES).optional().default('app_open'),
  }),
});
