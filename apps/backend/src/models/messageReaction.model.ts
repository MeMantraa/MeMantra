import { db } from '../db';
import { MessageReaction, NewMessageReaction } from '../types/database.types';

export const MessageReactionModel = {
  // Add a reaction to a message
  async create(reactionData: NewMessageReaction): Promise<MessageReaction> {
    const result = await db
      .insertInto('MessageReaction')
      .values({
        ...reactionData,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Remove a reaction from a message
  async delete(messageId: number, userId: number, emoji: string): Promise<boolean> {
    const result = await db
      .deleteFrom('MessageReaction')
      .where('message_id', '=', messageId)
      .where('user_id', '=', userId)
      .where('emoji', '=', emoji)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Get all reactions for a message
  async findByMessageId(messageId: number): Promise<MessageReaction[]> {
    return await db
      .selectFrom('MessageReaction')
      .where('message_id', '=', messageId)
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();
  },

  // Get reactions for multiple messages 
  async findByMessageIds(messageIds: number[]): Promise<MessageReaction[]> {
    if (messageIds.length === 0) return [];
    
    return await db
      .selectFrom('MessageReaction')
      .where('message_id', 'in', messageIds)
      .selectAll()
      .orderBy('message_id', 'asc')
      .orderBy('created_at', 'asc')
      .execute();
  },

  // Check if a user has reacted to a message with a specific emoji
  async exists(messageId: number, userId: number, emoji: string): Promise<boolean> {
    const reaction = await db
      .selectFrom('MessageReaction')
      .where('message_id', '=', messageId)
      .where('user_id', '=', userId)
      .where('emoji', '=', emoji)
      .select('reaction_id')
      .executeTakeFirst();

    return !!reaction;
  },

 
  async getReactionCounts(messageId: number): Promise<{ emoji: string; count: number; users: number[] }[]> {
    const reactions = await db
      .selectFrom('MessageReaction')
      .where('message_id', '=', messageId)
      .select(['emoji', 'user_id'])
      .execute();

    
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.user_id);
      return acc;
    }, {} as Record<string, number[]>);

    
    return Object.entries(groupedReactions).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users,
    }));
  },
};
