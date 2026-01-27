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

  /**
   * Find all reminders that are due to be sent now
   * A reminder is due if:
   * - status is 'active'
   * - time has passed (time <= now)
   * - For recurring reminders: hasn't been sent in the current period
   *   - daily: not sent today
   *   - weekly: not sent this week
   *   - monthly: not sent this month
   * - For one-time reminders: never been sent (last_sent_at is null)
   */
  async findDueReminders(): Promise<Reminder[]> {
    const now = new Date();

    return await db
      .selectFrom('Reminder')
      .where('status', '=', 'active')
      .where('time', '<=', now.toISOString())
      .where((eb) =>
        eb.or([
          // One-time reminders that haven't been sent
          eb.and([
            eb('frequency', '=', 'once'),
            eb('last_sent_at', 'is', null),
          ]),
          // Recurring reminders - we'll filter further in the service
          eb('frequency', '!=', 'once'),
        ])
      )
      .selectAll()
      .orderBy('time', 'asc')
      .execute();
  },

  /**
   * Update the last_sent_at timestamp for a reminder
   */
  async updateLastSentAt(reminderId: number): Promise<Reminder | undefined> {
    const now = new Date().toISOString();
    return await db
      .updateTable('Reminder')
      .set({ last_sent_at: now })
      .where('reminder_id', '=', reminderId)
      .returningAll()
      .executeTakeFirst();
  },

  /**
   * Mark a one-time reminder as completed after sending
   */
  async markAsCompleted(reminderId: number): Promise<Reminder | undefined> {
    const now = new Date().toISOString();
    return await db
      .updateTable('Reminder')
      .set({ status: 'completed', last_sent_at: now })
      .where('reminder_id', '=', reminderId)
      .returningAll()
      .executeTakeFirst();
  },

  /**
   * Get reminder with user and mantra details for notification sending
   */
  async findByIdWithDetails(reminderId: number): Promise<{
    reminder: Reminder;
    user_device_token: string | null;
    mantra_title: string | null;
    mantra_key_takeaway: string | null;
  } | undefined> {
    const result = await db
      .selectFrom('Reminder')
      .innerJoin('User', 'User.user_id', 'Reminder.user_id')
      .innerJoin('Mantra', 'Mantra.mantra_id', 'Reminder.mantra_id')
      .where('Reminder.reminder_id', '=', reminderId)
      .select([
        'Reminder.reminder_id',
        'Reminder.user_id',
        'Reminder.mantra_id',
        'Reminder.time',
        'Reminder.frequency',
        'Reminder.status',
        'Reminder.last_sent_at',
        'User.device_token as user_device_token',
        'Mantra.title as mantra_title',
        'Mantra.key_takeaway as mantra_key_takeaway',
      ])
      .executeTakeFirst();

    if (!result) return undefined;

    return {
      reminder: {
        reminder_id: result.reminder_id,
        user_id: result.user_id,
        mantra_id: result.mantra_id,
        time: result.time,
        frequency: result.frequency,
        status: result.status,
        last_sent_at: result.last_sent_at,
      },
      user_device_token: result.user_device_token,
      mantra_title: result.mantra_title,
      mantra_key_takeaway: result.mantra_key_takeaway,
    };
  },

  /**
   * Get all due reminders with user and mantra details
   * This is an optimized query that fetches everything needed to send notifications
   */
  async findDueRemindersWithDetails(): Promise<Array<{
    reminder_id: number;
    user_id: number | null;
    mantra_id: number | null;
    time: string | null;
    frequency: string | null;
    status: string | null;
    last_sent_at: string | null;
    user_device_token: string | null;
    mantra_title: string | null;
    mantra_key_takeaway: string | null;
  }>> {
    const now = new Date();

    return await db
      .selectFrom('Reminder')
      .innerJoin('User', 'User.user_id', 'Reminder.user_id')
      .innerJoin('Mantra', 'Mantra.mantra_id', 'Reminder.mantra_id')
      .where('Reminder.status', '=', 'active')
      .where('Reminder.time', '<=', now.toISOString())
      .where((eb) =>
        eb.or([
          // One-time reminders that haven't been sent
          eb.and([
            eb('Reminder.frequency', '=', 'once'),
            eb('Reminder.last_sent_at', 'is', null),
          ]),
          // Recurring reminders
          eb('Reminder.frequency', '!=', 'once'),
        ])
      )
      .select([
        'Reminder.reminder_id',
        'Reminder.user_id',
        'Reminder.mantra_id',
        'Reminder.time',
        'Reminder.frequency',
        'Reminder.status',
        'Reminder.last_sent_at',
        'User.device_token as user_device_token',
        'Mantra.title as mantra_title',
        'Mantra.key_takeaway as mantra_key_takeaway',
      ])
      .orderBy('Reminder.time', 'asc')
      .execute();
  },
};

