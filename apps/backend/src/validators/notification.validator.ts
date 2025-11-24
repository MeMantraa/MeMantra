import { z } from 'zod';

// Validate Expo push token format
const expoPushTokenSchema = z
  .string()
  .min(1, 'Token is required')
  .refine(
    (token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['),
    'Invalid Expo push token format'
  );

// Platform enum
const platformEnum = z.enum(['ios', 'android', 'web']);

// Register token schema
export const registerTokenSchema = z.object({
  body: z.object({
    token: expoPushTokenSchema,
    platform: platformEnum.optional(),
    deviceName: z.string().optional(),
  }),
});

// Unregister token schema
export const unregisterTokenSchema = z.object({
  body: z.object({
    token: expoPushTokenSchema,
  }),
});

// Send notification schema
export const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    body: z.string().min(1, 'Body is required').max(500, 'Body too long'),
    data: z.record(z.string(), z.any()).optional(),
  }),
});

// Send bulk notification schema
export const sendBulkNotificationSchema = z.object({
  body: z.object({
    userIds: z.array(z.number().int().positive()).min(1, 'At least one user ID required'),
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    body: z.string().min(1, 'Body is required').max(500, 'Body too long'),
    data: z.record(z.string(), z.any()).optional(),
  }),
});

export type RegisterTokenInput = z.infer<typeof registerTokenSchema>['body'];
export type UnregisterTokenInput = z.infer<typeof unregisterTokenSchema>['body'];
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>['body'];
export type SendBulkNotificationInput = z.infer<typeof sendBulkNotificationSchema>['body'];
