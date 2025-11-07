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
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
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
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'active',
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
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
        },
        {
          reminder_id: 2,
          user_id: 1,
          mantra_id: 10,
          time: '2024-12-01T18:00:00Z',
          frequency: 'weekly',
          status: 'active',
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
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
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
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
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
        time: '2024-12-01T10:00:00Z',
        frequency: 'weekly',
        status: 'active',
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
        time: '2024-12-01T09:00:00Z',
        frequency: 'daily',
        status: 'paused',
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
          time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          frequency: 'daily',
          status: 'active',
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
          time: '2024-12-01T09:00:00Z',
          frequency: 'daily',
          status: 'active',
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
});

