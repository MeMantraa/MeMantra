import { db } from '../db';

export interface UserBlock {
  block_id: number;
  blocker_id: number;
  blocked_id: number;
  created_at: string;
}

export const UserBlockModel = {
  async blockUser(blockerId: number, blockedId: number) {
    // Check if block already exists
    const existing = await db
      .selectFrom('UserBlock')
      .selectAll()
      .where('blocker_id', '=', blockerId)
      .where('blocked_id', '=', blockedId)
      .executeTakeFirst();

    if (existing) {
      return existing;
    }

    return db
      .insertInto('UserBlock')
      .values({
        blocker_id: blockerId,
        blocked_id: blockedId,
      })
      .returningAll()
      .executeTakeFirst();
  },

  async unblockUser(blockerId: number, blockedId: number) {
    return db
      .deleteFrom('UserBlock')
      .where('blocker_id', '=', blockerId)
      .where('blocked_id', '=', blockedId)
      .executeTakeFirst();
  },

  async isBlocked(blockerId: number, blockedId: number) {
    const result = await db
      .selectFrom('UserBlock')
      .select(db.fn.countAll().as('count'))
      .where('blocker_id', '=', blockerId)
      .where('blocked_id', '=', blockedId)
      .executeTakeFirst();

    return result ? Number(result.count) > 0 : false;
  },

  async getBlockedUsers(userId: number) {
    return db.selectFrom('UserBlock').selectAll().where('blocker_id', '=', userId).execute();
  },

  async getBlockingUsers(userId: number) {
    return db.selectFrom('UserBlock').selectAll().where('blocked_id', '=', userId).execute();
  },

  async findById(blockId: number) {
    return db
      .selectFrom('UserBlock')
      .selectAll()
      .where('block_id', '=', blockId)
      .executeTakeFirst();
  },

  async deleteBlock(blockId: number) {
    return db.deleteFrom('UserBlock').where('block_id', '=', blockId).executeTakeFirst();
  },
};
