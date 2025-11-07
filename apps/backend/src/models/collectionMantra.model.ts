import { db } from '../db';
import { CollectionMantra } from '../types/database.types';

export const CollectionMantraModel = {
  // Add a mantra to a collection with user tracking
  async add(collectionId: number, mantraId: number, userId: number): Promise<void> {
    await db
      .insertInto('CollectionMantra')
      .values({
        collection_id: collectionId,
        mantra_id: mantraId,
        added_by: userId,
      })
      .execute();
  },

  // Remove a mantra from a collection
  async remove(collectionId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .where('mantra_id', '=', mantraId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Check if a mantra is in a collection
  async exists(collectionId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();

    return !!result;
  },

  // Get all mantra IDs in a collection
  async findMantrasByCollection(collectionId: number): Promise<number[]> {
    const results = await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .select('mantra_id')
      .execute();

    return results.map(r => r.mantra_id);
  },

  // Get all collection IDs containing a mantra
  async findCollectionsByMantra(mantraId: number): Promise<number[]> {
    const results = await db
      .selectFrom('CollectionMantra')
      .where('mantra_id', '=', mantraId)
      .select('collection_id')
      .execute();

    return results.map(r => r.collection_id);
  },

  // Count mantras in a collection
  async countMantras(collectionId: number): Promise<number> {
    const result = await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .select((eb) => eb.fn.count('mantra_id').as('count'))
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Get CollectionMantra entry with details (who added it and when)
  async getDetails(collectionId: number, mantraId: number): Promise<CollectionMantra | undefined> {
    return await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();
  },

  // Get all entries for a collection with details
  async getAllByCollection(collectionId: number): Promise<CollectionMantra[]> {
    return await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .selectAll()
      .orderBy('added_at', 'desc')
      .execute();
  },

  // Remove all mantras from a collection (used when deleting collection)
  async removeAllFromCollection(collectionId: number): Promise<number> {
    const result = await db
      .deleteFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },
};

