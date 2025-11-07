import { db } from '../db';
import { Collection, CollectionUpdate, Mantra } from '../types/database.types';
import { CollectionMantraModel } from './collectionMantra.model';

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
    // First, remove all mantras from the collection using CollectionMantraModel
    await CollectionMantraModel.removeAllFromCollection(collectionId);

    // Then delete the collection itself
    const result = await db
      .deleteFrom('Collection')
      .where('collection_id', '=', collectionId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Add a mantra to a collection (with user tracking)
  async addMantra(collectionId: number, mantraId: number, userId: number): Promise<void> {
    await CollectionMantraModel.add(collectionId, mantraId, userId);
  },

  // Remove a mantra from a collection
  async removeMantra(collectionId: number, mantraId: number): Promise<boolean> {
    return await CollectionMantraModel.remove(collectionId, mantraId);
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
    return await CollectionMantraModel.exists(collectionId, mantraId);
  },

  // Count mantras in a collection
  async countMantrasInCollection(collectionId: number): Promise<number> {
    return await CollectionMantraModel.countMantras(collectionId);
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

