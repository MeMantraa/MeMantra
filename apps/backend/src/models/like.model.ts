import { db } from '../db';
import { Like } from '../types/database.types';
import { Mantra } from '../types/database.types';

export const LikeModel = {
  // User likes a mantra
  async create(userId: number, mantraId: number): Promise<Like> {
    const result = await db
      .insertInto('Like')
      .values({
        user_id: userId,
        mantra_id: mantraId,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // User unlikes a mantra
  async remove(userId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Like')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Check if user already liked a mantra
  async hasUserLiked(userId: number, mantraId: number): Promise<boolean> {
    const like = await db
      .selectFrom('Like')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();

    return !!like;
  },

  // Get all likes by a specific user
  async findByUserId(userId: number): Promise<Like[]> {
    return await db
      .selectFrom('Like')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  // Get all likes for a specific mantra
  async findByMantraId(mantraId: number): Promise<Like[]> {
    return await db
      .selectFrom('Like')
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  // Get all mantras that a user has liked (with full mantra details)
  async getUserLikedMantras(userId: number): Promise<Mantra[]> {
    const mantras = await db
      .selectFrom('Mantra')
      .innerJoin('Like', 'Mantra.mantra_id', 'Like.mantra_id')
      .where('Like.user_id', '=', userId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .orderBy('Like.created_at', 'desc')
      .execute();

    return mantras;
  },

  // Count total likes for a mantra
  async countLikesForMantra(mantraId: number): Promise<number> {
    const result = await db
      .selectFrom('Like')
      .where('mantra_id', '=', mantraId)
      .select((eb) => eb.fn.count('like_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Get like by ID
  async findById(likeId: number): Promise<Like | undefined> {
    return await db
      .selectFrom('Like')
      .where('like_id', '=', likeId)
      .selectAll()
      .executeTakeFirst();
  },

  // Get most liked mantras (popular mantras)
  async getMostLikedMantras(limit = 10): Promise<Array<Mantra & { like_count: number }>> {
    const results = await db
      .selectFrom('Mantra')
      .leftJoin('Like', 'Mantra.mantra_id', 'Like.mantra_id')
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
        (eb) => eb.fn.count('Like.like_id').as('like_count'),
      ])
      .groupBy('Mantra.mantra_id')
      .orderBy('like_count', 'desc')
      .limit(limit)
      .execute();

    return results.map((result) => ({
      ...result,
      like_count: Number(result.like_count),
    })) as Array<Mantra & { like_count: number }>;
  },
};

