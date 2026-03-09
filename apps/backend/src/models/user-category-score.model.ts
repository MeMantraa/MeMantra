import { db } from '../db';
import { sql } from 'kysely';
import { UserCategoryScore } from '../types/database.types';

/**
 * Model for the UserCategoryScore table.
 *
 * Tracks how many "points" a user has accumulated for each mantra category
 * based on their interactions (likes, saves, ratings, reminders, journals).
 *
 * Points system:
 *   Reminder   +5 for every category of the mantra
 *   5-star     +5 for every category of the mantra
 *   4-star     +4 for every category of the mantra
 *   Like       +3 for every category of the mantra
 *   Save       +3 for every category of the mantra
 *   Journal    +2 for every category of the mantra
 */
export const UserCategoryScoreModel = {
  // CRUD operations for algorithm updates 

  /**
   * Increment scores for all categories associated with a mantra.
   */
  async addScoreForMantra(
    userId: number,
    mantraId: number,
    points: number,
  ): Promise<void> {
    // 1. Look up which categories the mantra belongs to
    const categories = await db
      .selectFrom('MantraCategory')
      .where('mantra_id', '=', mantraId)
      .select('category_id')
      .execute();

    if (categories.length === 0) return;

    // 2. Upsert each category score
    const now = new Date().toISOString();
    for (const { category_id } of categories) {
      await db
        .insertInto('UserCategoryScore')
        .values({
          user_id: userId,
          category_id,
          score: points,
          updated_at: now,
        })
        .onConflict((oc) =>
          oc.columns(['user_id', 'category_id']).doUpdateSet({
            score: sql`GREATEST("UserCategoryScore"."score" + ${points}, 0)`,
            updated_at: now,
          }),
        )
        .execute();
    }
  },

  /**
   * Subtract scores for all categories associated with a mantra (undo action).
   * Score never drops below 0.
   */
  async removeScoreForMantra(
    userId: number,
    mantraId: number,
    points: number,
  ): Promise<void> {
    const categories = await db
      .selectFrom('MantraCategory')
      .where('mantra_id', '=', mantraId)
      .select('category_id')
      .execute();

    if (categories.length === 0) return;

    const now = new Date().toISOString();
    const categoryIds = categories.map((c) => c.category_id);

    await db
      .updateTable('UserCategoryScore')
      .set({
        score: sql`GREATEST("UserCategoryScore"."score" - ${points}, 0)`,
        updated_at: now,
      })
      .where('user_id', '=', userId)
      .where('category_id', 'in', categoryIds)
      .execute();
  },

  // Read operations for algorithm display (for users in the UI so they can modify etc)

  /**
   * Get all category scores for a user, ordered by score descending.
   */
  async getScoresForUser(userId: number): Promise<UserCategoryScore[]> {
    return await db
      .selectFrom('UserCategoryScore')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('score', 'desc')
      .execute();
  },

  /**
   * Get category scores for a user enriched with category name and type.
   */
  async getScoresForUserWithNames(
    userId: number,
  ): Promise<
    Array<{
      category_id: number;
      name: string;
      category_type: string | null;
      score: number;
    }>
  > {
    return await db
      .selectFrom('UserCategoryScore')
      .innerJoin(
        'Category',
        'Category.category_id',
        'UserCategoryScore.category_id',
      )
      .where('UserCategoryScore.user_id', '=', userId)
      .select([
        'UserCategoryScore.category_id',
        'Category.name',
        'Category.category_type',
        'UserCategoryScore.score',
      ])
      .orderBy('UserCategoryScore.score', 'desc')
      .execute();
  },

  /**
   * Get top categories for a user.
   */
  async getTopCategories(
    userId: number,
    limit = 10,
  ): Promise<
    Array<{
      category_id: number;
      name: string;
      category_type: string | null;
      score: number;
    }>
  > {
    return await db
      .selectFrom('UserCategoryScore')
      .innerJoin(
        'Category',
        'Category.category_id',
        'UserCategoryScore.category_id',
      )
      .where('UserCategoryScore.user_id', '=', userId)
      .where('UserCategoryScore.score', '>', 0)
      .select([
        'UserCategoryScore.category_id',
        'Category.name',
        'Category.category_type',
        'UserCategoryScore.score',
      ])
      .orderBy('UserCategoryScore.score', 'desc')
      .limit(limit)
      .execute();
  },

  /**
   * Get score for a specific user and category pair.
   */
  async getScore(
    userId: number,
    categoryId: number,
  ): Promise<number> {
    const row = await db
      .selectFrom('UserCategoryScore')
      .where('user_id', '=', userId)
      .where('category_id', '=', categoryId)
      .select('score')
      .executeTakeFirst();

    return row?.score ?? 0;
  },

  // Manual CRUD so that user can edit own algorithm basically

  /**
   * Set the score for a specific user + category directly.
   */
  async setScore(
    userId: number,
    categoryId: number,
    score: number,
  ): Promise<UserCategoryScore> {
    const now = new Date().toISOString();
    const result = await db
      .insertInto('UserCategoryScore')
      .values({
        user_id: userId,
        category_id: categoryId,
        score: Math.max(0, score),
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'category_id']).doUpdateSet({
          score: Math.max(0, score),
          updated_at: now,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Reset all category scores for a user to 0.
   */
  async resetAllScores(userId: number): Promise<void> {
    await db
      .deleteFrom('UserCategoryScore')
      .where('user_id', '=', userId)
      .execute();
  },

  /**
   * Reset a single category score for a user.
   */
  async resetScore(userId: number, categoryId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('UserCategoryScore')
      .where('user_id', '=', userId)
      .where('category_id', '=', categoryId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },
};
