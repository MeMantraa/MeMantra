import {
  createReminderSchema,
  updateReminderSchema,
  reminderIdSchema,
  upcomingQuerySchema,
  frequencyQuerySchema,
  schedulePreviewSchema,
} from '../../src/validators/reminder.validator';

describe('Reminder Validators', () => {
  describe('createReminderSchema', () => {
    it('should validate with mantra_id', () => {
      const data = {
        body: {
          mantra_id: 1,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with collection_id', () => {
      const data = {
        body: {
          collection_id: 5,
          time: '2030-01-01T10:00:00Z',
          frequency: 'weekly' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with journal_id', () => {
      const data = {
        body: {
          journal_id: 10,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject when both mantra_id and collection_id are provided', () => {
      const data = {
        body: {
          mantra_id: 1,
          collection_id: 5,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Exactly one of mantra_id, collection_id, or journal_id must be provided',
        );
      }
    });

    it('should reject when multiple IDs are provided', () => {
      const data = {
        body: {
          mantra_id: 1,
          journal_id: 10,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject when no ID is provided', () => {
      const data = {
        body: {
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative journal_id', () => {
      const data = {
        body: {
          journal_id: -1,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid frequency', () => {
      const data = {
        body: {
          mantra_id: 1,
          time: '2030-01-01T10:00:00Z',
          frequency: 'biweekly',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const data = {
        body: {
          mantra_id: 1,
          time: 'not-a-date',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative mantra_id', () => {
      const data = {
        body: {
          mantra_id: -1,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative collection_id', () => {
      const data = {
        body: {
          collection_id: -1,
          time: '2030-01-01T10:00:00Z',
          frequency: 'daily' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should default status to active', () => {
      const data = {
        body: {
          mantra_id: 1,
          time: '2030-01-01T10:00:00Z',
          frequency: 'once' as const,
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.status).toBe('active');
      }
    });

    it('should accept all valid frequencies', () => {
      const frequencies = ['once', 'daily', 'weekly', 'monthly', 'custom'] as const;
      for (const frequency of frequencies) {
        const data = {
          body: {
            mantra_id: 1,
            time: '2030-01-01T10:00:00Z',
            frequency,
          },
        };
        const result = createReminderSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid statuses', () => {
      const statuses = ['active', 'paused', 'completed'] as const;
      for (const status of statuses) {
        const data = {
          body: {
            mantra_id: 1,
            time: '2030-01-01T10:00:00Z',
            frequency: 'daily' as const,
            status,
          },
        };
        const result = createReminderSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('updateReminderSchema', () => {
    it('should validate with partial fields', () => {
      const data = {
        body: {
          frequency: 'weekly' as const,
        },
      };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with collection_id', () => {
      const data = {
        body: {
          collection_id: 3,
        },
      };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate empty body', () => {
      const data = { body: {} };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const data = {
        body: {
          status: 'deleted',
        },
      };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('reminderIdSchema', () => {
    it('should validate valid id', () => {
      const data = { params: { id: '5' } };
      const result = reminderIdSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.params.id).toBe(5);
      }
    });

    it('should reject non-numeric id', () => {
      const data = { params: { id: 'abc' } };
      const result = reminderIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative id', () => {
      const data = { params: { id: '-1' } };
      const result = reminderIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('upcomingQuerySchema', () => {
    it('should validate valid hours', () => {
      const data = { query: { hours: '48' } };
      const result = upcomingQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate without hours (optional)', () => {
      const data = { query: {} };
      const result = upcomingQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject hours over 168', () => {
      const data = { query: { hours: '200' } };
      const result = upcomingQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject hours under 1', () => {
      const data = { query: { hours: '0' } };
      const result = upcomingQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('frequencyQuerySchema', () => {
    it('should validate valid frequency', () => {
      const data = { query: { frequency: 'daily' } };
      const result = frequencyQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid frequency', () => {
      const data = { query: { frequency: 'biweekly' } };
      const result = frequencyQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('routine reminder validation', () => {
    it('should accept valid routine reminder with schedule_times and timezone', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['07:00', '12:00'],
          schedule_days: [1, 2, 3, 4, 5],
          timezone: 'America/New_York',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject routine reminder without schedule_times', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          timezone: 'America/New_York',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain(
          'Routine reminders require schedule_times and timezone; other frequencies require time',
        );
      }
    });

    it('should reject routine reminder without timezone', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['07:00'],
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject duplicate schedule_times', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['07:00', '07:00'],
          timezone: 'America/New_York',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain('Duplicate times are not allowed');
      }
    });

    it('should accept unique schedule_times', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['07:00', '12:00', '18:00'],
          timezone: 'UTC',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject more than 5 schedule_times', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
          timezone: 'UTC',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid HH:MM format in schedule_times', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['25:00'],
          timezone: 'UTC',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid day of week in schedule_days', () => {
      const data = {
        body: {
          mantra_id: 1,
          frequency: 'routine' as const,
          schedule_times: ['07:00'],
          schedule_days: [7],
          timezone: 'UTC',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept routine without time field', () => {
      const data = {
        body: {
          collection_id: 5,
          frequency: 'routine' as const,
          schedule_times: ['09:00'],
          timezone: 'Europe/London',
        },
      };
      const result = createReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.time).toBeUndefined();
      }
    });
  });

  describe('updateReminderSchema - routine fields', () => {
    it('should accept schedule_times in update', () => {
      const data = {
        body: {
          schedule_times: ['07:00', '18:00'],
        },
      };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject duplicate schedule_times in update', () => {
      const data = {
        body: {
          schedule_times: ['12:00', '12:00'],
        },
      };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept timezone in update', () => {
      const data = {
        body: {
          timezone: 'Asia/Tokyo',
        },
      };
      const result = updateReminderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('schedulePreviewSchema', () => {
    it('should accept valid preview request', () => {
      const data = {
        body: {
          schedule_times: ['07:00', '12:00'],
          schedule_days: [1, 2, 3, 4, 5],
          timezone: 'America/Chicago',
        },
      };
      const result = schedulePreviewSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept preview without schedule_days', () => {
      const data = {
        body: {
          schedule_times: ['09:00'],
          timezone: 'UTC',
        },
      };
      const result = schedulePreviewSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject preview with duplicate times', () => {
      const data = {
        body: {
          schedule_times: ['09:00', '09:00'],
          timezone: 'UTC',
        },
      };
      const result = schedulePreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject preview without timezone', () => {
      const data = {
        body: {
          schedule_times: ['09:00'],
        },
      };
      const result = schedulePreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject preview without schedule_times', () => {
      const data = {
        body: {
          timezone: 'UTC',
        },
      };
      const result = schedulePreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
