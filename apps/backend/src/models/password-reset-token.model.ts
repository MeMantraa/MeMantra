import { db } from '../db';
import { PasswordResetToken } from '../types/database.types';

export const PasswordResetTokenModel = {
  
   // Create a new password reset token
  async create(userId: number, code: string, expiresInMinutes: number = 10): Promise<PasswordResetToken> {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    
    const result = await db
      .insertInto('PasswordResetToken')
      .values({
        user_id: userId,
        code,
        expires_at: expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    return result;
  },

  //Find a valid token by user_id and code
  async findValidToken(userId: number, code: string): Promise<PasswordResetToken | null> {
    const now = new Date().toISOString();
    const result = await db
      .selectFrom('PasswordResetToken')
      .selectAll()
      .where('user_id', '=', userId)
      .where('code', '=', code)
      .where('expires_at', '>', now)
      .orderBy('created_at', 'desc')
      .executeTakeFirst();
    
    return result || null;
  },

  // Delete all tokens for a user
  async deleteByUserId(userId: number): Promise<void> {
    await db
      .deleteFrom('PasswordResetToken')
      .where('user_id', '=', userId)
      .execute();
  },

  // Delete expired tokens (cleanup)
  async deleteExpired(): Promise<void> {
    const now = new Date().toISOString();
    await db
      .deleteFrom('PasswordResetToken')
      .where('expires_at', '<', now)
      .execute();
  },

  // Check if a code was recently sent (for rate limiting)
  async getLastTokenTime(userId: number): Promise<Date | null> {
    const result = await db
      .selectFrom('PasswordResetToken')
      .select('created_at')
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .executeTakeFirst();
    
    return result?.created_at ? new Date(result.created_at) : null;
  },
};
