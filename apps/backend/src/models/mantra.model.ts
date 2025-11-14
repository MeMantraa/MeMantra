import { db } from '../db';
import { Mantra, NewMantra, MantraUpdate } from '../types/database.types';

export const MantraModel = {
  // Create a new mantra
  async create(mantraData: NewMantra): Promise<Mantra> {
    const result = await db
      .insertInto('Mantra')
      .values({
        ...mantraData,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find mantra by ID
  async findById(id: number): Promise<Mantra | undefined> {
    return await db
      .selectFrom('Mantra')
      .where('mantra_id', '=', id)
      .where('is_active', '=', true) // Only active mantras
      .selectAll()
      .executeTakeFirst();
  },

  // Get all active mantras
  async findAll(limit = 50, offset = 0): Promise<Mantra[]> {
    return await db
      .selectFrom('Mantra')
      .where('is_active', '=', true)
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  },

  // Get mantras by category (with join)
  async findByCategory(categoryId: number): Promise<Mantra[]> {
    return await db
      .selectFrom('Mantra')
      .innerJoin('MantraCategory', 'Mantra.mantra_id', 'MantraCategory.mantra_id')
      .where('MantraCategory.category_id', '=', categoryId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra') // Only select from Mantra table
      .execute();
  },

  // Update a mantra
  async update(id: number, updates: MantraUpdate): Promise<Mantra | undefined> {
    return await db
      .updateTable('Mantra')
      .set(updates)
      .where('mantra_id', '=', id)
      .returningAll()
      .executeTakeFirst();
  },

  // Soft delete (set is_active to false)
  async softDelete(id: number): Promise<boolean> {
    const result = await db
      .updateTable('Mantra')
      .set({ is_active: false })
      .where('mantra_id', '=', id)
      .executeTakeFirst();

    return result.numUpdatedRows > 0;
  },

  // Search mantras by title or key takeaway
  async search(query: string, limit = 20): Promise<Mantra[]> {
    const searchTerm = `%${query}%`;

    return await db
      .selectFrom('Mantra')
      .where('is_active', '=', true)
      .where((eb) =>
        eb.or([
          eb('title', 'ilike', searchTerm),
          eb('key_takeaway', 'ilike', searchTerm),
        ])
      )
      .selectAll()
      .limit(limit)
      .execute();
  },

  // Get mantras with like count (advanced join + aggregation)
  async findWithLikeCount(limit = 50): Promise<Array<Mantra & { like_count: number }>> {
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
