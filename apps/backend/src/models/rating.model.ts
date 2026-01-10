import { db } from '../db';
import { Rating, NewRating, RatingUpdate } from '../types/database.types';

export const RatingModel = {
  /**
   * User rates a mantra (creates or updates existing rating)
   * @example await RatingModel.upsert(userId, mantraId, 5, 'This mantra changed my life!')
   */
  async upsert(userId: number, mantraId: number, rating: number, reviewText?: string): Promise<Rating> {
    // Check if user already rated this mantra
    const existing = await this.findByUserAndMantra(userId, mantraId);

    if (existing) {
      // Update existing rating
      return await db
        .updateTable('Rating')
        .set({
          rating,
          review_text: reviewText || null,
          updated_at: new Date().toISOString(),
        })
        .where('rating_id', '=', existing.rating_id)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      // Create new rating
      return await db
        .insertInto('Rating')
        .values({
          user_id: userId,
          mantra_id: mantraId,
          rating,
          review_text: reviewText || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }
  },

  /**
   * Get user's rating for a specific mantra
   * @example await RatingModel.findByUserAndMantra(userId, mantraId)
   */
  async findByUserAndMantra(userId: number, mantraId: number): Promise<Rating | undefined> {
    return await db
      .selectFrom('Rating')
      .where('user_id', '=', userId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();
  },

  /**
   * Get all ratings by a user
   * @example await RatingModel.findByUserId(userId)
   */
  async findByUserId(userId: number): Promise<Rating[]> {
    return await db
      .selectFrom('Rating')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  /**
   * Get all ratings for a mantra
   * @example await RatingModel.findByMantraId(mantraId)
   */
  async findByMantraId(mantraId: number): Promise<Rating[]> {
    return await db
      .selectFrom('Rating')
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  /**
   * Calculate average rating for a mantra
   * @example await RatingModel.getAverageRating(mantraId)
   * @returns { average: 4.5, count: 142 }
   */
  async getAverageRating(mantraId: number): Promise<{ average: number; count: number }> {
    const result = await db
      .selectFrom('Rating')
      .where('mantra_id', '=', mantraId)
      .select([
        (eb) => eb.fn.avg('rating').as('average'),
        (eb) => eb.fn.count('rating_id').as('count'),
      ])
      .executeTakeFirst();

    return {
      average: Number(result?.average || 0),
      count: Number(result?.count || 0),
    };
  },

  /**
   * Get mantras with highest ratings (5 stars)
   * @example await RatingModel.getTopRatedMantras(10)
   */
  async getTopRatedMantras(limit = 10) {
    const results = await db
      .selectFrom('Mantra')
      .leftJoin('Rating', 'Mantra.mantra_id', 'Rating.mantra_id')
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
        (eb) => eb.fn.avg('Rating.rating').as('avg_rating'),
        (eb) => eb.fn.count('Rating.rating_id').as('rating_count'),
      ])
      .groupBy('Mantra.mantra_id')
      .having((eb) => eb.fn.count('Rating.rating_id'), '>=', 5) // at least 5 ratings
      .orderBy('avg_rating', 'desc')
      .limit(limit)
      .execute();

    return results.map((r) => ({
      ...r,
      avg_rating: Number(r.avg_rating).toFixed(1),
      rating_count: Number(r.rating_count),
    }));
  },

  /**
   * Get user's highly rated mantras (4-5 stars)
   * @example await RatingModel.getUserHighlyRatedMantras(userId)
   */
  async getUserHighlyRatedMantras(userId: number) {
    return await db
      .selectFrom('Mantra')
      .innerJoin('Rating', 'Mantra.mantra_id', 'Rating.mantra_id')
      .where('Rating.user_id', '=', userId)
      .where('Rating.rating', '>=', 4)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .execute();
  },

  /**
   * Delete a rating
   * @example await RatingModel.delete(ratingId)
   */
  async delete(ratingId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Rating')
      .where('rating_id', '=', ratingId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  /**
   * Get rating distribution for a mantra
   * @example await RatingModel.getRatingDistribution(mantraId)
   * @returns { 5: 50, 4: 30, 3: 15, 2: 3, 1: 2 }
   */
  async getRatingDistribution(mantraId: number): Promise<Record<number, number>> {
    const results = await db
      .selectFrom('Rating')
      .where('mantra_id', '=', mantraId)
      .select(['rating', (eb) => eb.fn.count('rating_id').as('count')])
      .groupBy('rating')
      .execute();

    // Convert to object: { 5: 50, 4: 30, ... }
    const distribution: Record<number, number> = {};
    results.forEach((r) => {
      distribution[r.rating] = Number(r.count);
    });

    return distribution;
  },

  /**
   * Get mantras rated by a user with specific rating
   * @example await RatingModel.getUserMantrasByRating(userId, 5) // Get all 5-star ratings
   */
  async getUserMantrasByRating(userId: number, rating: number) {
    return await db
      .selectFrom('Mantra')
      .innerJoin('Rating', 'Mantra.mantra_id', 'Rating.mantra_id')
      .where('Rating.user_id', '=', userId)
      .where('Rating.rating', '=', rating)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .orderBy('Rating.created_at', 'desc')
      .execute();
  },

  /**
   * Update only the rating value (keep review text)
   * @example await RatingModel.updateRating(ratingId, 4)
   */
  async updateRating(ratingId: number, rating: number): Promise<Rating | undefined> {
    return await db
      .updateTable('Rating')
      .set({
        rating,
        updated_at: new Date().toISOString(),
      })
      .where('rating_id', '=', ratingId)
      .returningAll()
      .executeTakeFirst();
  },

  /**
   * Count total ratings by a user
   * @example await RatingModel.countByUserId(userId)
   */
  async countByUserId(userId: number): Promise<number> {
    const result = await db
      .selectFrom('Rating')
      .where('user_id', '=', userId)
      .select((eb) => eb.fn.count('rating_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },
};
