import { db } from '../db';
import { Conversation } from '../types/database.types';
import { MessageModel } from './message.model';

export const ConversationModel = {
  // Create a new conversation
  async create(user1Id: number, user2Id: number): Promise<Conversation> {
    const result = await db
      .insertInto('Conversation')
      .values({
        user1_id: user1Id,
        user2_id: user2Id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find conversation by ID
  async findById(conversationId: number): Promise<Conversation | undefined> {
    return await db
      .selectFrom('Conversation')
      .where('conversation_id', '=', conversationId)
      .selectAll()
      .executeTakeFirst();
  },

  // Find conversation between two users
  async findByUsers(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    return await db
      .selectFrom('Conversation')
      .where((eb) =>
        eb.or([
          eb.and([eb('user1_id', '=', user1Id), eb('user2_id', '=', user2Id)]),
          eb.and([eb('user1_id', '=', user2Id), eb('user2_id', '=', user1Id)]),
        ]),
      )
      .selectAll()
      .executeTakeFirst();
  },

  // Get all conversations for a user with participant details and latest message
  async findByUserId(userId: number): Promise<
    Array<{
      conversation_id: number;
      participant_id: number;
      participant_username: string | null;
      participant_email: string | null;
      last_message: string;
      last_message_time: string;
      unread_count: number;
      created_at: string;
      updated_at: string;
    }>
  > {
    // Get all conversations for the user
    const conversations = await db
      .selectFrom('Conversation')
      .where((eb) => eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]))
      .selectAll()
      .execute();

    // Enrich each conversation with participant details and latest message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Determine the other participant
        const participantId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

        // Get participant details
        const participant = await db
          .selectFrom('User')
          .where('user_id', '=', participantId)
          .select(['username', 'email'])
          .executeTakeFirst();

        // Get latest message
        const latestMessage = await MessageModel.getLatestMessage(conv.conversation_id);

        // Get unread count
        const unreadCount = await MessageModel.countUnread(conv.conversation_id, userId);

        return {
          conversation_id: conv.conversation_id,
          participant_id: participantId,
          participant_username: participant?.username || null,
          participant_email: participant?.email || null,
          last_message: latestMessage?.content || '',
          last_message_time: latestMessage?.created_at || conv.created_at,
          unread_count: unreadCount,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        };
      }),
    );

    // Sort by last message time (most recent first)
    return enrichedConversations.sort(
      (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime(),
    );
  },

  // Update conversation timestamp
  async updateTimestamp(conversationId: number): Promise<void> {
    await db
      .updateTable('Conversation')
      .set({ updated_at: new Date().toISOString() })
      .where('conversation_id', '=', conversationId)
      .execute();
  },

  // Delete a conversation
  async delete(conversationId: number): Promise<boolean> {
    // First delete all messages in the conversation
    await db.deleteFrom('Message').where('conversation_id', '=', conversationId).execute();

    // Then delete the conversation
    const result = await db
      .deleteFrom('Conversation')
      .where('conversation_id', '=', conversationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Check if user is participant in conversation
  async isParticipant(conversationId: number, userId: number): Promise<boolean> {
    const conversation = await db
      .selectFrom('Conversation')
      .where('conversation_id', '=', conversationId)
      .where((eb) => eb.or([eb('user1_id', '=', userId), eb('user2_id', '=', userId)]))
      .selectAll()
      .executeTakeFirst();

    return !!conversation;
  },
};
