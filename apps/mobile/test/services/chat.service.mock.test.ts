import { __mockChatService } from '../../services/chat.service';
import { CreateMessagePayload, CreateConversationPayload } from '../../types/chat.types';

/**
 * Tests for mockChatService implementation
 * These tests cover the mock service functions
 */

describe('mockChatService', () => {
  const mockToken = 'test-token-123';

  describe('getConversations', () => {
    it('returns mock conversations after delay', async () => {
      const result = await __mockChatService.getConversations(mockToken);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('conversation_id');
      expect(result[0]).toHaveProperty('participant_username');
    });
  });

  describe('getMessages', () => {
    it('returns messages for existing conversation', async () => {
      const result = await __mockChatService.getMessages(1, mockToken);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('message_id');
      expect(result[0]).toHaveProperty('content');
    });

    it('returns empty array for non-existent conversation', async () => {
      const result = await __mockChatService.getMessages(999, mockToken);

      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('creates and returns a new message', async () => {
      const payload: CreateMessagePayload = {
        conversation_id: 1,
        content: 'Test message from unit test',
      };

      const result = await __mockChatService.sendMessage(payload, mockToken);

      expect(result).toMatchObject({
        conversation_id: 1,
        sender_id: 1,
        content: 'Test message from unit test',
        read: false,
      });
      expect(result.message_id).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.reply_to_message_id).toBeNull();
    });

    it('creates message with reply_to_message_id', async () => {
      const payload: CreateMessagePayload = {
        conversation_id: 1,
        content: 'Reply message',
        reply_to_message_id: 5,
      };

      const result = await __mockChatService.sendMessage(payload, mockToken);

      expect(result.reply_to_message_id).toBe(5);
      expect(result.content).toBe('Reply message');
    });

    it('adds message to new conversation storage', async () => {
      const payload: CreateMessagePayload = {
        conversation_id: 9999,
        content: 'First message in new conversation',
      };

      const result = await __mockChatService.sendMessage(payload, mockToken);

      expect(result.conversation_id).toBe(9999);
      expect(result.content).toBe('First message in new conversation');
    });
  });

  describe('createConversation', () => {
    it('creates and returns a new conversation', async () => {
      const payload: CreateConversationPayload = {
        participant_id: 99,
      };

      const result = await __mockChatService.createConversation(payload, mockToken);

      expect(result).toMatchObject({
        participant_id: 99,
        participant_username: 'new_user',
        last_message: '',
        unread_count: 0,
      });
      expect(result.conversation_id).toBeDefined();
      expect(result.last_message_time).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('resolves without error', async () => {
      await expect(__mockChatService.markAsRead(1, mockToken)).resolves.toBeUndefined();
    });
  });

  describe('addReaction', () => {
    it('resolves without error', async () => {
      await expect(__mockChatService.addReaction(1, '👍', mockToken)).resolves.toBeUndefined();
    });
  });

  describe('getReactions', () => {
    it('returns empty reactions array', async () => {
      const result = await __mockChatService.getReactions(1, mockToken);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
