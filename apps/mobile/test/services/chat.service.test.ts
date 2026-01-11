import { chatService } from '../../services/chat.service';
import { apiClient } from '../../services/api.config';
import {
  Conversation,
  Message,
  CreateMessagePayload,
  CreateConversationPayload,
} from '../../types/chat.types';

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('chatService', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversations', () => {
    it('fetches conversations successfully', async () => {
      const mockConversations: Conversation[] = [
        {
          conversation_id: 1,
          participant_id: 2,
          participant_username: 'john_doe',
          participant_email: 'john@example.com',
          last_message: 'Hey!',
          last_message_time: new Date().toISOString(),
          unread_count: 1,
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            conversations: mockConversations,
          },
        },
      });

      const result = await chatService.getConversations(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/chat/conversations', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockConversations);
    });

    it('handles errors when fetching conversations', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(chatService.getConversations(mockToken)).rejects.toThrow('Network error');
    });
  });

  describe('getMessages', () => {
    it('fetches messages for a conversation successfully', async () => {
      const conversationId = 1;
      const mockMessages: Message[] = [
        {
          message_id: 1,
          conversation_id: conversationId,
          sender_id: 2,
          content: 'Hello!',
          created_at: new Date().toISOString(),
          read: true,
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            messages: mockMessages,
          },
        },
      });

      const result = await chatService.getMessages(conversationId, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith(`/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockMessages);
    });

    it('handles errors when fetching messages', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(chatService.getMessages(1, mockToken)).rejects.toThrow('Not found');
    });
  });

  describe('sendMessage', () => {
    it('sends a message successfully', async () => {
      const payload: CreateMessagePayload = {
        conversation_id: 1,
        content: 'Test message',
      };

      const mockMessage: Message = {
        message_id: 1,
        conversation_id: 1,
        sender_id: 1,
        content: 'Test message',
        created_at: new Date().toISOString(),
        read: false,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          data: {
            message: mockMessage,
          },
        },
      });

      const result = await chatService.sendMessage(payload, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/chat/messages', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockMessage);
    });

    it('sends a reply message successfully', async () => {
      const payload: CreateMessagePayload = {
        conversation_id: 1,
        content: 'Reply message',
        reply_to_message_id: 5,
      };

      const mockMessage: Message = {
        message_id: 6,
        conversation_id: 1,
        sender_id: 1,
        content: 'Reply message',
        created_at: new Date().toISOString(),
        read: false,
        reply_to_message_id: 5,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          data: {
            message: mockMessage,
          },
        },
      });

      const result = await chatService.sendMessage(payload, mockToken);

      expect(result).toEqual(mockMessage);
      expect(result.reply_to_message_id).toBe(5);
    });

    it('handles errors when sending message', async () => {
      const payload: CreateMessagePayload = {
        conversation_id: 1,
        content: 'Test message',
      };

      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Send failed'));

      await expect(chatService.sendMessage(payload, mockToken)).rejects.toThrow('Send failed');
    });
  });

  describe('createConversation', () => {
    it('creates a conversation successfully', async () => {
      const payload: CreateConversationPayload = {
        participant_id: 2,
      };

      const mockConversation: Conversation = {
        conversation_id: 1,
        participant_id: 2,
        participant_username: 'jane_doe',
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          data: {
            conversation: mockConversation,
          },
        },
      });

      const result = await chatService.createConversation(payload, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith('/chat/conversations', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockConversation);
    });

    it('handles errors when creating conversation', async () => {
      const payload: CreateConversationPayload = {
        participant_id: 2,
      };

      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await expect(chatService.createConversation(payload, mockToken)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('markAsRead', () => {
    it('marks conversation as read successfully', async () => {
      const conversationId = 1;

      (apiClient.patch as jest.Mock).mockResolvedValue({
        data: { success: true },
      });

      await chatService.markAsRead(conversationId, mockToken);

      expect(apiClient.patch).toHaveBeenCalledWith(
        `/chat/conversations/${conversationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('handles errors when marking as read', async () => {
      (apiClient.patch as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(chatService.markAsRead(1, mockToken)).rejects.toThrow('Update failed');
    });
  });

  describe('addReaction', () => {
    it('adds reaction to message successfully', async () => {
      const messageId = 1;
      const emoji = '👍';

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { success: true },
      });

      await chatService.addReaction(messageId, emoji, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/chat/messages/${messageId}/reactions`,
        { emoji },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('handles errors when adding reaction', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Reaction failed'));

      await expect(chatService.addReaction(1, '👍', mockToken)).rejects.toThrow('Reaction failed');
    });
  });

  describe('getReactions', () => {
    it('fetches reactions for a message successfully', async () => {
      const messageId = 1;
      const mockReactions = [
        { emoji: '👍', count: 2, users: [1, 2] },
        { emoji: '❤️', count: 1, users: [3] },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            reactions: mockReactions,
          },
        },
      });

      const result = await chatService.getReactions(messageId, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith(`/chat/messages/${messageId}/reactions`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockReactions);
    });

    it('handles errors when fetching reactions', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      await expect(chatService.getReactions(1, mockToken)).rejects.toThrow('Fetch failed');
    });
  });
});
