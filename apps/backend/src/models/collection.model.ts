import { db } from '../db';
import { Collection, NewCollection, CollectionUpdate } from '../types/database.types';

export const CollectionModel = {
  // Create a new collection
  async create(data: NewCollection): Promise<Collection> {
    return await db
      .insertInto('Collection')
      .values({
        ...data,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  // Find collection by ID
  async findById(id: number): Promise<Collection | undefined> {
    return await db
      .selectFrom('Collection')
      .where('collection_id', '=', id)
      .selectAll()
      .executeTakeFirst();
  },

  // Find all collections by user ID
  async findByUserId(userId: number): Promise<Collection[]> {
    return await db
      .selectFrom('Collection')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  },

  // Update a collection
  async update(id: number, updates: CollectionUpdate): Promise<Collection | undefined> {
    return await db
      .updateTable('Collection')
      .set(updates)
      .where('collection_id', '=', id)
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a collection
  async delete(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Collection')
      .where('collection_id', '=', id)
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

  // Get all mantras in a collection
  async getMantras(collectionId: number) {
    return await db
      .selectFrom('Mantra')
      .innerJoin(
        'CollectionMantra',
        'Mantra.mantra_id',
        'CollectionMantra.mantra_id'
      )
      .where('CollectionMantra.collection_id', '=', collectionId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .execute();
  },

  // Get collection with its mantras
  async getCollectionWithMantras(collectionId: number) {
    const collection = await this.findById(collectionId);

    if (!collection) return null;

    const mantras = await this.getMantras(collectionId);

    return { ...collection, mantras };
  },

  // Check if user owns the collection
  async isOwner(collectionId: number, userId: number): Promise<boolean> {
    const collection = await this.findById(collectionId);
    return collection?.user_id === userId;
  },

  // Check if mantra is already in collection
  async hasMantra(collectionId: number, mantraId: number): Promise<boolean> {
    const result = await db
      .selectFrom('CollectionMantra')
      .where('collection_id', '=', collectionId)
      .where('mantra_id', '=', mantraId)
      .selectAll()
      .executeTakeFirst();

    return !!result;
  },
};
