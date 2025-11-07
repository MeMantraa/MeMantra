import { db } from '../db';
import { Reminder, NewReminder, ReminderUpdate } from '../types/database.types';

export const ReminderModel = {
  // Create a new reminder
  async create(reminderData: NewReminder): Promise<Reminder> {
    const result = await db
      .insertInto('Reminder')
      .values(reminderData)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find reminder by ID
  async findById(reminderId: number): Promise<Reminder | undefined> {
    return await db
      .selectFrom('Reminder')
      .where('reminder_id', '=', reminderId)
      .selectAll()
      .executeTakeFirst();
  },

  // Get all reminders for a user
  async findByUserId(userId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Get all reminders for a specific mantra
  async findByMantraId(mantraId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Get reminders for a specific user and mantra combination
  async findByUserAndMantra(userId: number, mantraId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Get active reminders for a user
  async findActiveByUserId(userId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .where('status', '=', 'active')
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Get reminders by status
  async findByStatus(status: string): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('status', '=', status)
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Get reminders by frequency
  async findByFrequency(userId: number, frequency: string): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .where('frequency', '=', frequency)
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Update reminder details
  async update(reminderId: number, updates: ReminderUpdate): Promise<Reminder | undefined> {
    return await db
      .updateTable('Reminder')
      .set(updates)
      .where('reminder_id', '=', reminderId)
      .returningAll()
      .executeTakeFirst();
  },

  // Update reminder status only
  async updateStatus(reminderId: number, status: string): Promise<Reminder | undefined> {
    return await db
      .updateTable('Reminder')
      .set({ status })
      .where('reminder_id', '=', reminderId)
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a reminder
  async delete(reminderId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Reminder')
      .where('reminder_id', '=', reminderId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Delete all reminders for a user
  async deleteByUserId(userId: number): Promise<number> {
    const result = await db
      .deleteFrom('Reminder')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },

  // Delete all reminders for a mantra (when mantra is deleted)
  async deleteByMantraId(mantraId: number): Promise<number> {
    const result = await db
      .deleteFrom('Reminder')
      .where('mantra_id', '=', mantraId)
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },

  // Count reminders for a user
  async countByUserId(userId: number): Promise<number> {
    const result = await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .select((eb) => eb.fn.count('reminder_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Get upcoming reminders for a user (within next X hours)
  async findUpcoming(userId: number, hoursAhead: number = 24): Promise<Reminder[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .where('status', '=', 'active')
      .where('time', '>=', now.toISOString())
      .where('time', '<=', futureTime.toISOString())
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },
};

