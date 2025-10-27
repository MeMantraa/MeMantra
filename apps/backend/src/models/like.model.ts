import { db } from '../db';
import { Like, NewLike } from '../types/database.types';

export const LikeModel = {
  // Create a like
  async create(userId: number, mantraId: number): Promise<Like> {
    return await db
      .insertInto('Like')
      .values({
        user_id: userId,
        mantra_id: mantraId,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  // Remove a like
  async delete(userId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Like')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Check if user has liked a mantra
  async exists(userId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .selectFrom('Like')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();

    return !!result;
  },

  // Get all liked mantras for a user
  async getUserLikes(userId: number) {
    return await db
      .selectFrom('Mantra')
      .innerJoin('Like', 'Mantra.mantra_id', 'Like.mantra_id')
      .where('Like.user_id', '=', userId)
      .where('Mantra.is_active', '=', true)
      .select([
        'Mantra.mantra_id',
        'Mantra.title',
        'Mantra.key_takeaway',
        'Mantra.background_author',
        'Mantra.background_description',
        'Mantra.jamie_take',
        'Mantra.when_where',
        'Mantra.negative_thoughts',
        'Mantra.cbt_principles',
        'Mantra.references',
        'Mantra.created_by',
        'Mantra.is_active',
        'Mantra.created_at',
        'Like.created_at as liked_at',
      ])
      .orderBy('Like.created_at', 'desc')
      .execute();
  },

  // Get like count for a mantra
  async getMantraLikeCount(mantraId: number): Promise<number> {
    const result = await db
      .selectFrom('Like')
      .where('mantra_id', '=', mantraId)
      .select((eb) => eb.fn.count('like_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Get like counts for multiple mantras
  async getMantraLikeCounts(mantraIds: number[]) {
    return await db
      .selectFrom('Like')
      .where('mantra_id', 'in', mantraIds)
      .select(['mantra_id', (eb) => eb.fn.count('like_id').as('like_count')])
      .groupBy('mantra_id')
      .execute();
  },
};
