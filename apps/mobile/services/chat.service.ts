import { apiClient } from './api.config';
import {
  Message,
  Conversation,
  CreateMessagePayload,
  CreateConversationPayload,
  MessageReaction,
} from '../types/chat.types';

const USE_MOCK_DATA = false; //Since backend is ready, I put it to false

/**
 * MOCK DATA
 * ---------
 * Used while backend endpoints aren't connected.
 */
const mockConversations: Conversation[] = [
  {
    conversation_id: 1,
    participant_id: 2,
    participant_username: 'john_doe',
    participant_email: 'john@example.com',
    last_message: 'Hey! How are you doing?',
    last_message_time: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 2,
  },
  {
    conversation_id: 2,
    participant_id: 3,
    participant_username: 'jane_smith',
    participant_email: 'jane@example.com',
    last_message: 'Thanks for sharing that mantra!',
    last_message_time: new Date(Date.now() - 7200000).toISOString(),
    unread_count: 0,
  },
  {
    conversation_id: 3,
    participant_id: 4,
    participant_username: 'alex_brown',
    participant_email: 'alex@example.com',
    last_message: 'See you tomorrow!',
    last_message_time: new Date(Date.now() - 86400000).toISOString(),
    unread_count: 1,
  },
];

const mockMessages: { [key: number]: Message[] } = {
  1: [
    {
      message_id: 1,
      conversation_id: 1,
      sender_id: 2,
      content: 'Hey! How are you doing?',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
    {
      message_id: 2,
      conversation_id: 1,
      sender_id: 1,
      content: "I'm doing great! Just finished my morning meditation.",
      created_at: new Date(Date.now() - 3000000).toISOString(),
      read: true,
    },
    {
      message_id: 3,
      conversation_id: 1,
      sender_id: 2,
      content: 'That sounds wonderful! Which mantra did you use?',
      created_at: new Date(Date.now() - 2400000).toISOString(),
      read: false,
    },
    {
      message_id: 4,
      conversation_id: 1,
      sender_id: 1,
      content: 'I used "This too shall pass". Very calming!',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      read: false,
    },
  ],
  2: [
    {
      message_id: 5,
      conversation_id: 2,
      sender_id: 3,
      content: 'Thanks for sharing that mantra!',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
    {
      message_id: 6,
      conversation_id: 2,
      sender_id: 1,
      content: 'My pleasure! Glad you found it helpful.',
      created_at: new Date(Date.now() - 7000000).toISOString(),
      read: true,
    },
  ],
  3: [
    {
      message_id: 7,
      conversation_id: 3,
      sender_id: 4,
      content: 'See you tomorrow!',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ],
};

const mockChatService = {
  async getConversations(token: string): Promise<Conversation[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockConversations), 500);
    });
  },

  async getMessages(conversationId: number, token: string): Promise<Message[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockMessages[conversationId] || []), 500);
    });
  },

  async sendMessage(payload: CreateMessagePayload, token: string): Promise<Message> {
    return new Promise((resolve) => {
      const newMessage: Message = {
        message_id: Date.now(),
        conversation_id: payload.conversation_id,
        sender_id: 1, // Current user
        content: payload.content,
        created_at: new Date().toISOString(),
        read: false,
        reply_to_message_id: payload.reply_to_message_id || null,
      };

      // Add to mock storage
      if (!mockMessages[payload.conversation_id]) {
        mockMessages[payload.conversation_id] = [];
      }
      mockMessages[payload.conversation_id].push(newMessage);

      setTimeout(() => resolve(newMessage), 300);
    });
  },

  async createConversation(
    payload: CreateConversationPayload,
    token: string,
  ): Promise<Conversation> {
    return new Promise((resolve) => {
      const newConversation: Conversation = {
        conversation_id: Date.now(),
        participant_id: payload.participant_id,
        participant_username: 'new_user',
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0,
      };
      setTimeout(() => resolve(newConversation), 500);
    });
  },

  async markAsRead(conversationId: number, token: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 200);
    });
  },

  async addReaction(messageId: number, emoji: string, token: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 200);
    });
  },

  async getReactions(messageId: number, token: string): Promise<MessageReaction[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 200);
    });
  },
};

/**
 * REAL SERVICE (for when backend is ready)
 */
const realChatService = {
  async getConversations(token: string): Promise<Conversation[]> {
    const response = await apiClient.get('/chat/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.conversations;
  },

  async getMessages(conversationId: number, token: string): Promise<Message[]> {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.messages;
  },

  async sendMessage(payload: CreateMessagePayload, token: string): Promise<Message> {
    const response = await apiClient.post('/chat/messages', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.message;
  },

  async createConversation(
    payload: CreateConversationPayload,
    token: string,
  ): Promise<Conversation> {
    const response = await apiClient.post('/chat/conversations', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.conversation;
  },

  async markAsRead(conversationId: number, token: string): Promise<void> {
    await apiClient.patch(
      `/chat/conversations/${conversationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },

  async addReaction(messageId: number, emoji: string, token: string): Promise<void> {
    await apiClient.post(
      `/chat/messages/${messageId}/reactions`,
      { emoji },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },

  async getReactions(messageId: number, token: string): Promise<MessageReaction[]> {
    const response = await apiClient.get(`/chat/messages/${messageId}/reactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.reactions;
  },
};

export const chatService = USE_MOCK_DATA ? mockChatService : realChatService;
