import { db } from '../db';
import { Message, NewMessage, MessageUpdate } from '../types/database.types';

export const MessageModel = {
  // Create a new message
  async create(messageData: NewMessage): Promise<Message> {
    const result = await db
      .insertInto('Message')
      .values({
        ...messageData,
        created_at: new Date().toISOString(),
        read: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find message by ID
  async findById(messageId: number): Promise<Message | undefined> {
    return await db
      .selectFrom('Message')
      .where('message_id', '=', messageId)
      .selectAll()
      .executeTakeFirst();
  },

  // Get all messages in a conversation
  async findByConversationId(conversationId: number): Promise<Message[]> {
    return await db
      .selectFrom('Message')
      .where('conversation_id', '=', conversationId)
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();
  },

  // Get unread messages for a user in a conversation
  async getUnreadMessages(conversationId: number, userId: number): Promise<Message[]> {
    return await db
      .selectFrom('Message')
      .where('conversation_id', '=', conversationId)
      .where('sender_id', '!=', userId)
      .where('read', '=', false)
      .selectAll()
      .execute();
  },

  // Mark messages as read
  async markAsRead(conversationId: number, userId: number): Promise<void> {
    await db
      .updateTable('Message')
      .set({ read: true })
      .where('conversation_id', '=', conversationId)
      .where('sender_id', '!=', userId)
      .where('read', '=', false)
      .execute();
  },

  // Update a message
  async update(messageId: number, updates: MessageUpdate): Promise<Message | undefined> {
    return await db
      .updateTable('Message')
      .set(updates)
      .where('message_id', '=', messageId)
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a message
  async delete(messageId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Message')
      .where('message_id', '=', messageId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Count unread messages in a conversation for a user
  async countUnread(conversationId: number, userId: number): Promise<number> {
    const result = await db
      .selectFrom('Message')
      .where('conversation_id', '=', conversationId)
      .where('sender_id', '!=', userId)
      .where('read', '=', false)
      .select(({ fn }) => [fn.count<number>('message_id').as('count')])
      .executeTakeFirst();

    return Number(result?.count || 0);
  },

  // Get latest message in a conversation
  async getLatestMessage(conversationId: number): Promise<Message | undefined> {
    return await db
      .selectFrom('Message')
      .where('conversation_id', '=', conversationId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  },

  // Get all replies to a specific message
  async getReplies(messageId: number): Promise<Message[]> {
    return await db
      .selectFrom('Message')
      .where('reply_to_message_id', '=', messageId)
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();
  },

  // Check if a message exists in a specific conversation
  async existsInConversation(messageId: number, conversationId: number): Promise<boolean> {
    const message = await db
      .selectFrom('Message')
      .where('message_id', '=', messageId)
      .where('conversation_id', '=', conversationId)
      .select('message_id')
      .executeTakeFirst();

    return !!message;
  },
};
