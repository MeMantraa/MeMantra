import {
  registerTokenSchema,
  sendNotificationSchema,
  sendBulkNotificationSchema,
} from '../../src/validators/notification.validator';

describe('Notification Validators', () => {
  describe('registerTokenSchema', () => {
    it('should validate correct token registration data', () => {
      const validData = {
        body: {
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          platform: 'ios' as const,
          deviceName: 'iPhone 14',
        },
      };

      const result = registerTokenSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without optional fields', () => {
      const validData = {
        body: {
          token: 'ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        },
      };

      const result = registerTokenSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid token format', () => {
      const invalidData = {
        body: {
          token: 'InvalidToken123',
        },
      };

      const result = registerTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid Expo push token format');
      }
    });

    it('should reject empty token', () => {
      const invalidData = {
        body: {
          token: '',
        },
      };

      const result = registerTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Token is required');
      }
    });

    it('should accept valid platform values', () => {
      const platforms = ['ios', 'android', 'web'];

      platforms.forEach((platform) => {
        const data = {
          body: {
            token: 'ExponentPushToken[xxx]',
            platform,
          },
        };

        const result = registerTokenSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid platform value', () => {
      const invalidData = {
        body: {
          token: 'ExponentPushToken[xxx]',
          platform: 'windows',
        },
      };

      const result = registerTokenSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('sendNotificationSchema', () => {
    it('should validate correct notification data', () => {
      const validData = {
        body: {
          title: 'Test Notification',
          body: 'This is a test message',
          data: { key: 'value', type: 'test' },
        },
      };

      const result = sendNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without optional data field', () => {
      const validData = {
        body: {
          title: 'Test',
          body: 'Message',
        },
      };

      const result = sendNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing title', () => {
      const invalidData = {
        body: {
          body: 'Message only',
        },
      };

      const result = sendNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing body', () => {
      const invalidData = {
        body: {
          title: 'Title only',
        },
      };

      const result = sendNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidData = {
        body: {
          title: '',
          body: 'Message',
        },
      };

      const result = sendNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required');
      }
    });

    it('should reject title longer than 100 characters', () => {
      const invalidData = {
        body: {
          title: 'A'.repeat(101),
          body: 'Message',
        },
      };

      const result = sendNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title too long');
      }
    });

    it('should accept title with exactly 100 characters', () => {
      const validData = {
        body: {
          title: 'A'.repeat(100),
          body: 'Message',
        },
      };

      const result = sendNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject body longer than 500 characters', () => {
      const invalidData = {
        body: {
          title: 'Title',
          body: 'A'.repeat(501),
        },
      };

      const result = sendNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Body too long');
      }
    });

    it('should accept body with exactly 500 characters', () => {
      const validData = {
        body: {
          title: 'Title',
          body: 'A'.repeat(500),
        },
      };

      const result = sendNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept data as record of key-value pairs', () => {
      const validData = {
        body: {
          title: 'Title',
          body: 'Message',
          data: {
            userId: '123',
            type: 'reminder',
            count: 5,
            nested: { key: 'value' },
          },
        },
      };

      const result = sendNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('sendBulkNotificationSchema', () => {
    it('should validate correct bulk notification data', () => {
      const validData = {
        body: {
          userIds: [1, 2, 3],
          title: 'Bulk Notification',
          body: 'Message for all',
          data: { type: 'bulk' },
        },
      };

      const result = sendBulkNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without optional data field', () => {
      const validData = {
        body: {
          userIds: [1],
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty userIds array', () => {
      const invalidData = {
        body: {
          userIds: [],
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one user ID required');
      }
    });

    it('should reject missing userIds', () => {
      const invalidData = {
        body: {
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative user IDs', () => {
      const invalidData = {
        body: {
          userIds: [1, -2, 3],
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero as user ID', () => {
      const invalidData = {
        body: {
          userIds: [0, 1],
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject decimal user IDs', () => {
      const invalidData = {
        body: {
          userIds: [1.5, 2],
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept large arrays of user IDs', () => {
      const validData = {
        body: {
          userIds: Array.from({ length: 100 }, (_, i) => i + 1),
          title: 'Title',
          body: 'Message',
        },
      };

      const result = sendBulkNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply same title and body validations as single notification', () => {
      const invalidTitle = {
        body: {
          userIds: [1],
          title: 'A'.repeat(101),
          body: 'Message',
        },
      };

      const invalidBody = {
        body: {
          userIds: [1],
          title: 'Title',
          body: 'A'.repeat(501),
        },
      };

      expect(sendBulkNotificationSchema.safeParse(invalidTitle).success).toBe(false);
      expect(sendBulkNotificationSchema.safeParse(invalidBody).success).toBe(false);
    });
  });
});
