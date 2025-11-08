import { db } from '../db';
import { RecommendationLog, NewRecommendationLog } from '../types/database.types';

export const RecommendationModel = {
  // Create a new recommendation log entry
  async create(recommendationData: NewRecommendationLog): Promise<RecommendationLog> {
    const result = await db
      .insertInto('RecommendationLog')
      .values({
        ...recommendationData,
        timestamp: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find recommendation by ID
  async findById(recId: number): Promise<RecommendationLog | undefined> {
    return await db
      .selectFrom('RecommendationLog')
      .where('rec_id', '=', recId)
      .selectAll()
      .executeTakeFirst();
  },

  // Get all recommendations for a user
  async findByUserId(userId: number, limit = 50, offset = 0): Promise<RecommendationLog[]> {
    return await db
      .selectFrom('RecommendationLog')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  },

  // Get all recommendations for a specific mantra
  async findByMantraId(mantraId: number): Promise<RecommendationLog[]> {
    return await db
      .selectFrom('RecommendationLog')
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .orderBy('timestamp', 'desc')
      .execute();
  },

  // Get recommendations for a user and mantra combination
  async findByUserAndMantra(userId: number, mantraId: number): Promise<RecommendationLog[]> {
    return await db
      .selectFrom('RecommendationLog')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .orderBy('timestamp', 'desc')
      .execute();
  },

  // Get recommendations with mantra details (JOIN)
  async findByUserIdWithMantras(userId: number, limit = 20): Promise<Array<RecommendationLog & { mantra_title: string }>> {
    const results = await db
      .selectFrom('RecommendationLog')
      .innerJoin('Mantra', 'RecommendationLog.mantra_id', 'Mantra.mantra_id')
      .where('RecommendationLog.user_id', '=', userId)
      .select([
        'RecommendationLog.rec_id',
        'RecommendationLog.user_id',
        'RecommendationLog.mantra_id',
        'RecommendationLog.timestamp',
        'RecommendationLog.reason',
        'Mantra.title as mantra_title',
      ])
      .orderBy('RecommendationLog.timestamp', 'desc')
      .limit(limit)
      .execute();

    return results as Array<RecommendationLog & { mantra_title: string }>;
  },

  // Get recent recommendations (last N days)
  async findRecent(userId: number, daysBack: number = 7): Promise<RecommendationLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return await db
      .selectFrom('RecommendationLog')
      .where('user_id', '=', userId)
      .where('timestamp', '>=', cutoffDate.toISOString())
      .selectAll()
      .orderBy('timestamp', 'desc')
      .execute();
  },

  // Count recommendations for a user
  async countByUserId(userId: number): Promise<number> {
    const result = await db
      .selectFrom('RecommendationLog')
      .where('user_id', '=', userId)
      .select((eb) => eb.fn.count('rec_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Delete a recommendation log entry
  async delete(recId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('RecommendationLog')
      .where('rec_id', '=', recId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Delete all recommendations for a user
  async deleteByUserId(userId: number): Promise<number> {
    const result = await db
      .deleteFrom('RecommendationLog')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },
};
