import { db } from '../db';
import { Reminder, NewReminder, ReminderUpdate } from '../types/database.types';

export const ReminderModel = {
  // Create a new reminder
  async create(data: NewReminder): Promise<Reminder> {
    return await db
      .insertInto('Reminder')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  // Find reminder by ID
  async findById(id: number): Promise<Reminder | undefined> {
    return await db
      .selectFrom('Reminder')
      .where('reminder_id', '=', id)
      .selectAll()
      .executeTakeFirst();
  },

  // Find all reminders for a user
  async findByUserId(userId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Find active reminders for a user
  async findActiveByUserId(userId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('user_id', '=', userId)
      .where('status', '=', 'active')
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  // Find reminders for a specific mantra
  async findByMantraId(mantraId: number): Promise<Reminder[]> {
    return await db
      .selectFrom('Reminder')
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .execute();
  },

  // Update a reminder
  async update(id: number, updates: ReminderUpdate): Promise<Reminder | undefined> {
    return await db
      .updateTable('Reminder')
      .set(updates)
      .where('reminder_id', '=', id)
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a reminder
  async delete(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Reminder')
      .where('reminder_id', '=', id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Check if user owns the reminder
  async isOwner(reminderId: number, userId: number): Promise<boolean> {
    const reminder = await this.findById(reminderId);
    return reminder?.user_id === userId;
  },

  // Get reminder with mantra details
  async getReminderWithMantra(reminderId: number) {
    return await db
      .selectFrom('Reminder')
      .innerJoin('Mantra', 'Reminder.mantra_id', 'Mantra.mantra_id')
      .where('Reminder.reminder_id', '=', reminderId)
      .select([
        'Reminder.reminder_id',
        'Reminder.user_id',
        'Reminder.time',
        'Reminder.frequency',
        'Reminder.status',
        'Mantra.mantra_id',
        'Mantra.title',
        'Mantra.key_takeaway',
      ])
      .executeTakeFirst();
  },

  // Get all reminders with mantra details for a user
  async getUserRemindersWithMantras(userId: number) {
    return await db
      .selectFrom('Reminder')
      .innerJoin('Mantra', 'Reminder.mantra_id', 'Mantra.mantra_id')
      .where('Reminder.user_id', '=', userId)
      .select([
        'Reminder.reminder_id',
        'Reminder.user_id',
        'Reminder.time',
        'Reminder.frequency',
        'Reminder.status',
        'Mantra.mantra_id',
        'Mantra.title',
        'Mantra.key_takeaway',
      ])
      .orderBy('Reminder.time', 'asc')
      .execute();
  },
};
