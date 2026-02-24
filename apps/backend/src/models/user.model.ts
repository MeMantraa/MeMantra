import { db } from '../db';
import bcrypt from 'bcryptjs';
import { User, NewUser } from '../types/database.types';
import { sql } from 'kysely';

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  device_token?: string | null;
}

export const UserModel = {
  async create(userData: CreateUserData): Promise<User> {
    //hash pass
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    //data for insertion
    const newUser: NewUser = {
      username: userData.username,
      email: userData.email,
      password_hash: hashedPassword,
      device_token: userData.device_token || null,
      created_at: new Date().toISOString(),
      feature_flags: [],
    };
    
    //insert in db
    const result = await db
      .insertInto('User')
      .values(newUser)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    return result;
  },
  
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await db
      .selectFrom('User')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },
  
  async findByUsername(username: string): Promise<User | undefined> {
    const user = await db
      .selectFrom('User')
      .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },
  
  async findById(id: number): Promise<User | undefined> {
    const user = await db
      .selectFrom('User')
      .where('user_id', '=', id)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },

  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    
    const users = await db
      .selectFrom('User')
      .where('user_id', 'in', ids)
      .selectAll()
      .execute();
    
    return users;
  },

  async findAll(): Promise<User[]> {
    const users = await db
      .selectFrom('User')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    
    return users;
  },

  async update(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await db
      .updateTable('User')
      .set(updates)
      .where('user_id', '=', id)
      .returningAll()
      .executeTakeFirst();
    
    return user;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('User')
      .where('user_id', '=', id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  async updateEmail(userId: number, email: string) {
    return db
      .updateTable('User')
      .set({ email })
      .where('user_id', '=', userId)
      .executeTakeFirst();
  },
  // Theme functions
async updateTheme(userId: number, theme: string): Promise<User | undefined> {
  const user = await db
    .updateTable('User')
    .set({ theme })
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
  return user;
},

async getTheme(userId: number): Promise<string | undefined> {
  const user = await db
    .selectFrom('User')
    .select('theme')
    .where('user_id', '=', userId)
    .executeTakeFirst();
  return user?.theme || 'default';
}
,
  async findAllWithDeviceTokens(): Promise<User[]> {
    return db
      .selectFrom('User')
      .where('device_token', 'is not', null)
      .selectAll()
      .execute();
  },

  // Check if user has specific flag enabled
  async hasFlag(userId: number, flagName: string): Promise<boolean> {
    const result = await db
      .selectFrom('User')
      .where('user_id', '=', userId)
      .where(sql<boolean>`${sql.val(flagName)} = ANY(${sql.ref('feature_flags')})`)
      .select('user_id')
      .executeTakeFirst();

    return !!result;
  },

  // Add flag to user if not already present
  async addFlag(userId: number, flagName: string): Promise<User | undefined> {
    return await db
      .updateTable('User')
      .set({
        feature_flags: sql`array_append(${sql.ref('feature_flags')}, ${sql.val(flagName)})`,
      })
      .where('user_id', '=', userId)
      .where(
        sql<boolean>`NOT (${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}])`,
      )
      .returningAll()
      .executeTakeFirst();
  },

  // Remove flag from user
  async removeFlag(userId: number, flagName: string): Promise<User | undefined> {
    return await db
      .updateTable('User')
      .set({
        feature_flags: sql`array_remove(${sql.ref('feature_flags')}, ${sql.val(flagName)})`,
      })
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  },

  // Set multiple flags at once (replaces all existing flags)
  async setFlags(userId: number, flags: string[]): Promise<User | undefined> {
    return await db
      .updateTable('User')
      .set({
        feature_flags: flags,
      })
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  },

  // Get all users who have a specific flag
  async findUsersWithFlag(flagName: string): Promise<User[]> {
    return await db
      .selectFrom('User')
      .where(sql<boolean>`(${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}])`)
      .selectAll()
      .execute();
  },

  // Get all users who DON'T have a specific flag
  async findUsersWithoutFlag(flagName: string): Promise<User[]> {
    return await db
      .selectFrom('User')
      .where(
        sql<boolean>`NOT (${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}])`,
      )
      .selectAll()
      .execute();
  },

  //Set a flag to true for all users at once
  async enableFlagForAllUsers(flagName: string): Promise<number> {
    const result = await db
      .updateTable('User')
      .set({
        feature_flags: sql`array_append(${sql.ref('feature_flags')}, ${sql.val(flagName)})`,
      })
      .where(
        sql<boolean>`NOT (${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}])`,
      )
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  },

  //Set a flag to false for all users at once
  async disableFlagForAllUsers(flagName: string): Promise<number> {
    const result = await db
      .updateTable('User')
      .set({
        feature_flags: sql`array_remove(${sql.ref('feature_flags')}, ${sql.val(flagName)})`,
      })
      .where(sql<boolean>`${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}]`)
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  },


  //Set a flag to true for a defined percentage of users (not dynamic)
  async rolloutFlagToPercentage(
    flagName: string,
    percentage: number,
  ): Promise<{ totalUsers: number; selectedUsers: number }> {
    const users = await db
      .selectFrom('User')
      .select('user_id')
      .orderBy('user_id', 'asc')
      .execute();

    const totalUsers = users.length;
    if (totalUsers === 0) {
      return { totalUsers: 0, selectedUsers: 0 };
    }

    // Snapshot rollout: deterministic by user_id ordering.
    const selectedCount = Math.min(
      totalUsers,
      Math.max(0, Math.ceil((totalUsers * percentage) / 100)),
    );
    const selectedUserIds = users.slice(0, selectedCount).map((u) => u.user_id);

    await db.transaction().execute(async (trx) => {
      // Remove flag from everyone first so result matches requested percentage exactly.
      await trx
        .updateTable('User')
        .set({
          feature_flags: sql`array_remove(${sql.ref('feature_flags')}, ${sql.val(flagName)})`,
        })
        .where(sql<boolean>`${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}]`)
        .executeTakeFirst();

      if (selectedUserIds.length > 0) {
        await trx
          .updateTable('User')
          .set({
            feature_flags: sql`array_append(${sql.ref('feature_flags')}, ${sql.val(flagName)})`,
          })
          .where('user_id', 'in', selectedUserIds)
          .where(
            sql<boolean>`NOT (${sql.ref('feature_flags')} @> ARRAY[${sql.val(flagName)}])`,
          )
          .executeTakeFirst();
      }
    });

    return { totalUsers, selectedUsers: selectedCount };
  },

};

