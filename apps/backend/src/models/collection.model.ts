import { db } from '../db';
import { Collection, CollectionUpdate } from '../types/database.types';
import { Mantra } from '../types/database.types';

export const CollectionModel = {
  // Create a new collection
  async create(userId: number, name: string, description?: string): Promise<Collection> {
    const result = await db
      .insertInto('Collection')
      .values({
        user_id: userId,
        name: name,
        description: description || null,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Get all collections for a user
  async findByUserId(userId: number): Promise<Collection[]> {
    return await db
      .selectFrom('Collection')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  // Get specific collection by ID
  async findById(collectionId: number): Promise<Collection | undefined> {
    return await db
      .selectFrom('Collection')
      .where('collection_id', '=', collectionId)
      .selectAll()
      .executeTakeFirst();
  },

  // Update collection (name, description)
  async update(collectionId: number, updates: CollectionUpdate): Promise<Collection | undefined> {
    return await db
      .updateTable('Collection')
      .set(updates)
      .where('collection_id', '=', collectionId)
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a collection
  async delete(collectionId: number): Promise<boolean> {
    // First, remove all mantras from the collection
    await db
      .deleteFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .execute();

    // Then delete the collection itself
    const result = await db
      .deleteFrom('Collection')
      .where('collection_id', '=', collectionId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Add a mantra to a collection
  async addMantra(collectionId: number, mantraId: number): Promise<void> {
    await db
      .insertInto('CollectionMantra')
      .values({
        collection_id: collectionId,
        mantra_id: mantraId,
      })
      .execute();
  },

  // Remove a mantra from a collection
  async removeMantra(collectionId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .where('mantra_id', '=', mantraId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Get all mantras in a collection (with JOIN)
  async getMantrasInCollection(collectionId: number): Promise<Mantra[]> {
    const mantras = await db
      .selectFrom('Mantra')
      .innerJoin('CollectionMantra', 'Mantra.mantra_id', 'CollectionMantra.mantra_id')
      .where('CollectionMantra.collection_id', '=', collectionId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .execute();

    return mantras;
  },

  // Get collection with all its mantras
  async getCollectionWithMantras(collectionId: number): Promise<{
    collection: Collection;
    mantras: Mantra[];
  } | null> {
    const collection = await db
      .selectFrom('Collection')
      .where('collection_id', '=', collectionId)
      .selectAll()
      .executeTakeFirst();

    if (!collection) return null;

    const mantras = await db
      .selectFrom('Mantra')
      .innerJoin('CollectionMantra', 'Mantra.mantra_id', 'CollectionMantra.mantra_id')
      .where('CollectionMantra.collection_id', '=', collectionId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .execute();

    return { collection, mantras };
  },

  // Check if a mantra is in a collection
  async isMantraInCollection(collectionId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();

    return !!result;
  },

  // Count mantras in a collection
  async countMantrasInCollection(collectionId: number): Promise<number> {
    const result = await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .select((eb) => eb.fn.count('mantra_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Get all collections that contain a specific mantra
  async getCollectionsContainingMantra(mantraId: number, userId?: number): Promise<Collection[]> {
    let query = db
      .selectFrom('Collection')
      .innerJoin('CollectionMantra', 'Collection.collection_id', 'CollectionMantra.collection_id')
      .where('CollectionMantra.mantra_id', '=', mantraId);

    if (userId) {
      query = query.where('Collection.user_id', '=', userId);
    }

    return await query
      .selectAll('Collection')
      .execute();
  },
};

