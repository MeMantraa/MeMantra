import { ReminderModel } from '../../src/models/reminder.model';
import { db } from '../../src/db';
import { Reminder, NewReminder } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('ReminderModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new reminder', async () => {
      const newReminder: NewReminder = {
        user_id: 1,
        mantra_id: 5,
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
      };

      const mockReminder: Reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockReminder),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.create(newReminder);

      expect(db.insertInto).toHaveBeenCalledWith('Reminder');
      expect(mockChain.values).toHaveBeenCalledWith(newReminder);
      expect(result).toEqual(mockReminder);
    });
  });

  describe('findById', () => {
    it('should find reminder by id', async () => {
      const mockReminder: Reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReminder),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('reminder_id', '=', 1);
      expect(result).toEqual(mockReminder);
    });

    it('should return undefined if not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByUserId', () => {
    it('should find all reminders for a user', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
        {
          reminder_id: 2,
          user_id: 1,
          mantra_id: 10,
          collection_id: null,
          time: '2024-12-01T18:00:00Z',
          frequency: 'weekly',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('time', 'asc');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find only active reminders for a user', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findActiveByUserId(1);

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('status', '=', 'active');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('findByUserAndMantra', () => {
    it('should find reminders for specific user and mantra', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByUserAndMantra(1, 5);

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(result).toEqual(mockReminders);
    });
  });

  describe('update', () => {
    it('should update reminder details', async () => {
      const updates = {
        time: '2024-12-01T10:00:00Z',
        frequency: 'weekly',
      };

      const mockUpdatedReminder: Reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T10:00:00Z',
        frequency: 'weekly',
        status: 'active',
        last_sent_at: null,
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedReminder),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.update(1, updates);

      expect(db.updateTable).toHaveBeenCalledWith('Reminder');
      expect(mockChain.set).toHaveBeenCalledWith(updates);
      expect(mockChain.where).toHaveBeenCalledWith('reminder_id', '=', 1);
      expect(result).toEqual(mockUpdatedReminder);
    });
  });

  describe('updateStatus', () => {
    it('should update only reminder status', async () => {
      const mockUpdatedReminder: Reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'paused',
        last_sent_at: null,
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedReminder),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.updateStatus(1, 'paused');

      expect(mockChain.set).toHaveBeenCalledWith({ status: 'paused' });
      expect(result?.status).toBe('paused');
    });
  });

  describe('delete', () => {
    it('should delete a reminder and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.delete(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('reminder_id', '=', 1);
      expect(result).toBe(true);
    });

    it('should return false if reminder not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all reminders for a user', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(3) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.deleteByUserId(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(3);
    });
  });

  describe('countByUserId', () => {
    it('should count reminders for a user', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '5' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.countByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(5);
    });

    it('should return 0 if no reminders', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '0' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.countByUserId(1);

      expect(result).toBe(0);
    });
  });

  describe('findUpcoming', () => {
    it('should find upcoming reminders within specified hours', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findUpcoming(1, 24);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('status', '=', 'active');
      expect(mockChain.orderBy).toHaveBeenCalledWith('time', 'asc');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('findByFrequency', () => {
    it('should find reminders by frequency', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByFrequency(1, 'daily');

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('frequency', '=', 'daily');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('findByMantraId', () => {
    it('should find all reminders for a mantra', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByMantraId(5);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(mockChain.orderBy).toHaveBeenCalledWith('time', 'asc');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('findByStatus', () => {
    it('should find all reminders by status', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByStatus('active');

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('status', '=', 'active');
      expect(mockChain.orderBy).toHaveBeenCalledWith('time', 'asc');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('deleteByMantraId', () => {
    it('should delete all reminders for a mantra', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(2) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.deleteByMantraId(5);

      expect(db.deleteFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(result).toBe(2);
    });
  });

  describe('findDueReminders', () => {
    it('should find due reminders with correct filters', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'once',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findDueReminders();

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('status', '=', 'active');
      expect(mockChain.orderBy).toHaveBeenCalledWith('time', 'asc');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('updateLastSentAt', () => {
    it('should update last_sent_at timestamp', async () => {
      const mockReminder: Reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
        last_sent_at: '2024-12-01T09:00:00Z',
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReminder),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.updateLastSentAt(1);

      expect(db.updateTable).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('reminder_id', '=', 1);
      expect(mockChain.set).toHaveBeenCalledWith(expect.objectContaining({ last_sent_at: expect.any(String) }));
      expect(result).toEqual(mockReminder);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark reminder as completed with timestamp', async () => {
      const mockReminder: Reminder = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T09:00:00Z',
        frequency: 'once',
        status: 'completed',
        last_sent_at: '2024-12-01T09:00:00Z',
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReminder),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.markAsCompleted(1);

      expect(db.updateTable).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('reminder_id', '=', 1);
      expect(mockChain.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
        last_sent_at: expect.any(String)
      }));
      expect(result?.status).toBe('completed');
    });
  });

  describe('findByIdWithDetails', () => {
    it('should find reminder with user and mantra details', async () => {
      const mockResult = {
        reminder_id: 1,
        user_id: 1,
        mantra_id: 5,
        collection_id: null,
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
        last_sent_at: null,
        user_device_token: 'ExponentPushToken[xxx]',
        mantra_title: 'Test Mantra',
        mantra_key_takeaway: 'Test takeaway',
      };

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockResult),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByIdWithDetails(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.innerJoin).toHaveBeenCalledTimes(2);
      expect(result?.reminder.reminder_id).toBe(1);
      expect(result?.user_device_token).toBe('ExponentPushToken[xxx]');
      expect(result?.mantra_title).toBe('Test Mantra');
    });

    it('should return undefined if reminder not found', async () => {
      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByIdWithDetails(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findDueRemindersWithDetails', () => {
    it('should find due mantra reminders with details', async () => {
      const mockResults = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[xxx]',
          mantra_title: 'Test Mantra',
          mantra_key_takeaway: 'Test takeaway',
        },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findDueRemindersWithDetails();

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.innerJoin).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].mantra_key_takeaway).toBe('Test takeaway');
    });
  });

  describe('findDueCollectionRemindersWithDetails', () => {
    it('should find due collection reminders with details', async () => {
      const mockResults = [
        {
          reminder_id: 2,
          user_id: 1,
          collection_id: 10,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
          user_device_token: 'ExponentPushToken[yyy]',
          collection_name: 'My Collection',
          collection_description: 'Test collection',
        },
      ];

      const mockChain = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findDueCollectionRemindersWithDetails();

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.innerJoin).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].collection_name).toBe('My Collection');
    });
  });

  describe('findByCollectionId', () => {
    it('should find all reminders for a collection', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: null,
          collection_id: 10,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByCollectionId(10);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 10);
      expect(mockChain.orderBy).toHaveBeenCalledWith('time', 'asc');
      expect(result).toEqual(mockReminders);
    });
  });

  describe('findByUserAndCollection', () => {
    it('should find reminders for specific user and collection', async () => {
      const mockReminders: Reminder[] = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: null,
          collection_id: 10,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReminders),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByUserAndCollection(1, 10);

      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 10);
      expect(result).toEqual(mockReminders);
    });
  });

  describe('deleteByCollectionId', () => {
    it('should delete all reminders for a collection', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(2) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.deleteByCollectionId(10);

      expect(db.deleteFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.where).toHaveBeenCalledWith('collection_id', '=', 10);
      expect(result).toBe(2);
    });
  });

  describe('findByUserIdWithNames', () => {
    it('should return reminders with joined mantra title and collection name', async () => {
      const mockResults = [
        {
          reminder_id: 1,
          user_id: 1,
          mantra_id: 5,
          collection_id: null,
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
          last_sent_at: null,
          mantra_title: 'Test Mantra',
          collection_name: null,
        },
        {
          reminder_id: 2,
          user_id: 1,
          mantra_id: null,
          collection_id: 10,
          time: '2024-12-01T18:00:00Z',
          frequency: 'weekly',
          status: 'active',
          last_sent_at: null,
          mantra_title: null,
          collection_name: 'My Collection',
        },
      ];

      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResults),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByUserIdWithNames(1);

      expect(db.selectFrom).toHaveBeenCalledWith('Reminder');
      expect(mockChain.leftJoin).toHaveBeenCalledTimes(2);
      expect(mockChain.leftJoin).toHaveBeenCalledWith('Mantra', 'Mantra.mantra_id', 'Reminder.mantra_id');
      expect(mockChain.leftJoin).toHaveBeenCalledWith('Collection', 'Collection.collection_id', 'Reminder.collection_id');
      expect(mockChain.where).toHaveBeenCalledWith('Reminder.user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('Reminder.time', 'asc');
      expect(result).toEqual(mockResults);
      expect(result[0].mantra_title).toBe('Test Mantra');
      expect(result[0].collection_name).toBeNull();
      expect(result[1].mantra_title).toBeNull();
      expect(result[1].collection_name).toBe('My Collection');
    });

    it('should return empty array when user has no reminders', async () => {
      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.findByUserIdWithNames(999);

      expect(result).toEqual([]);
    });
  });

  describe('countByUserId edge cases', () => {
    it('should return 0 when result is null', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await ReminderModel.countByUserId(1);

      expect(result).toBe(0);
    });
  });
});

