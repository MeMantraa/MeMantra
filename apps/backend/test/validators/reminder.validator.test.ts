import {
  createReminderSchema,
  updateReminderSchema,
  reminderIdSchema,
  upcomingQuerySchema,
  frequencyQuerySchema,
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
          'Exactly one of mantra_id or collection_id must be provided',
        );
      }
    });

    it('should reject when neither mantra_id nor collection_id is provided', () => {
      const data = {
        body: {
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
});
