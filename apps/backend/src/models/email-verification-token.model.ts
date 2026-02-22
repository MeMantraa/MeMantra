import { db } from '../db';
import { EmailVerificationToken } from '../types/database.types';

export const EmailVerificationTokenModel = {
  // Create a new email verification token (replaces any previous one for the same email)
  async create(email: string, code: string, expiresInMinutes: number = 10): Promise<EmailVerificationToken> {
    // Remove any previous tokens for this email first to keep the table clean
    await db
      .deleteFrom('EmailVerificationToken')
      .where('email', '=', email.toLowerCase().trim())
      .execute();

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const result = await db
      .insertInto('EmailVerificationToken')
      .values({
        email: email.toLowerCase().trim(),
        code,
        expires_at: expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find a valid (non-expired) token by email and code
  async findValidToken(email: string, code: string): Promise<EmailVerificationToken | null> {
    const now = new Date().toISOString();

    const result = await db
      .selectFrom('EmailVerificationToken')
      .selectAll()
      .where('email', '=', email.toLowerCase().trim())
      .where('code', '=', code)
      .where('expires_at', '>', now)
      .executeTakeFirst();

    return result || null;
  },

  // Delete token by email (called after successful registration)
  async deleteByEmail(email: string): Promise<void> {
    await db
      .deleteFrom('EmailVerificationToken')
      .where('email', '=', email.toLowerCase().trim())
      .execute();
  },

  // Get the time the last token was created for this email (for rate limiting)
  async getLastTokenTime(email: string): Promise<Date | null> {
    const result = await db
      .selectFrom('EmailVerificationToken')
      .select('created_at')
      .where('email', '=', email.toLowerCase().trim())
      .orderBy('created_at', 'desc')
      .executeTakeFirst();

    return result?.created_at ? new Date(result.created_at) : null;
  },

  // Delete all expired tokens (cleanup utility)
  async deleteExpired(): Promise<void> {
    const now = new Date().toISOString();
    await db
      .deleteFrom('EmailVerificationToken')
      .where('expires_at', '<', now)
      .execute();
  },
};
