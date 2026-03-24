import { db } from '../db';
import { JournalEntry, NewJournalEntry, JournalEntryUpdate } from '../types/database.types';

export const JournalModel = {
  // Create a new journal entry
  async create(journalData: NewJournalEntry): Promise<JournalEntry> {
    const result = await db
      .insertInto('JournalEntry')
      .values({
        ...journalData,
        is_private: journalData.is_private ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find journal entry by ID
  async findById(journalId: number): Promise<JournalEntry | undefined> {
    return await db
      .selectFrom('JournalEntry')
      .where('journal_id', '=', journalId)
      .selectAll()
      .executeTakeFirst();
  },

  // Get all journal entries for a user
  async findByUserId(userId: number, limit = 50, offset = 0): Promise<JournalEntry[]> {
    return await db
      .selectFrom('JournalEntry')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  },

  // Get journal entries for a specific mantra
  async findByMantraId(mantraId: number, userId: number): Promise<JournalEntry[]> {
    return await db
      .selectFrom('JournalEntry')
      .where('mantra_id', '=', mantraId)
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  // Get journal entries with mantra details
  async findByUserIdWithMantra(userId: number, limit = 50, offset = 0) {
    return await db
      .selectFrom('JournalEntry')
      .leftJoin('Mantra', 'JournalEntry.mantra_id', 'Mantra.mantra_id')
      .where('JournalEntry.user_id', '=', userId)
      .select([
        'JournalEntry.journal_id',
        'JournalEntry.user_id',
        'JournalEntry.mantra_id',
        'JournalEntry.title',
        'JournalEntry.content',
        'JournalEntry.mood',
        'JournalEntry.tags',
        'JournalEntry.is_private',
        'JournalEntry.created_at',
        'JournalEntry.updated_at',
        'Mantra.title as mantra_title',
        'Mantra.key_takeaway as mantra_key_takeaway',
      ])
      .orderBy('JournalEntry.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  },

  // Update a journal entry
  async update(
    journalId: number,
    userId: number,
    updates: JournalEntryUpdate,
  ): Promise<JournalEntry | undefined> {
    return await db
      .updateTable('JournalEntry')
      .set({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .where('journal_id', '=', journalId)
      .where('user_id', '=', userId) // Ensure user owns the entry
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a journal entry
  async delete(journalId: number, userId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('JournalEntry')
      .where('journal_id', '=', journalId)
      .where('user_id', '=', userId) // Ensure user owns the entry
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Search journal entries by content or title
  async search(userId: number, query: string, limit = 20): Promise<JournalEntry[]> {
    const searchTerm = `%${query}%`;

    return await db
      .selectFrom('JournalEntry')
      .where('user_id', '=', userId)
      .where((eb) => eb.or([eb('title', 'ilike', searchTerm), eb('content', 'ilike', searchTerm)]))
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  },

  // Get journal entries by mood
  async findByMood(userId: number, mood: string): Promise<JournalEntry[]> {
    return await db
      .selectFrom('JournalEntry')
      .where('user_id', '=', userId)
      .where('mood', '=', mood)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  // Count total journal entries for a user
  async countByUserId(userId: number): Promise<number> {
    const result = await db
      .selectFrom('JournalEntry')
      .where('user_id', '=', userId)
      .select(db.fn.count('journal_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  },
};
