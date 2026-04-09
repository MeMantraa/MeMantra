import request from 'supertest';
import express from 'express';
import { ChatController } from '../../src/controllers/chat.controller';
import { ConversationModel } from '../../src/models/conversation.model';
import { MessageModel } from '../../src/models/message.model';
import { MessageReactionModel } from '../../src/models/messageReaction.model';
import { UserModel } from '../../src/models/user.model';
import { UserBlockModel } from '../../src/models/userBlock.model';

jest.mock('../../src/models/conversation.model');
jest.mock('../../src/models/message.model');
jest.mock('../../src/models/messageReaction.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/userBlock.model');

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuthMiddleware = (req: any, _res: any, next: any) => {
  req.user = { userId: 1 };
  next();
};

app.get('/api/chat/users', mockAuthMiddleware, ChatController.getChatUsers);
app.get('/api/chat/conversations', mockAuthMiddleware, ChatController.getConversations);
app.get('/api/chat/conversations/:id', mockAuthMiddleware, ChatController.getConversationById);
app.get('/api/chat/conversations/:id/messages', mockAuthMiddleware, ChatController.getMessages);
app.post('/api/chat/messages', mockAuthMiddleware, ChatController.sendMessage);
app.post('/api/chat/conversations', mockAuthMiddleware, ChatController.createConversation);
app.patch('/api/chat/conversations/:id/read', mockAuthMiddleware, ChatController.markAsRead);
app.delete('/api/chat/conversations/:id', mockAuthMiddleware, ChatController.deleteConversation);
app.post('/api/chat/messages/:id/reactions', mockAuthMiddleware, ChatController.addReaction);
app.get('/api/chat/messages/:id/reactions', mockAuthMiddleware, ChatController.getReactions);

describe('ChatController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatUsers', () => {
    it('should return all users except current user', async () => {
      const mockUsers = [
        {
          user_id: 1,
          username: 'user1',
          email: 'user1@example.com',
          auth_provider: 'local',
          created_at: '2024-01-01',
        },
        {
          user_id: 2,
          username: 'user2',
          email: 'user2@example.com',
          auth_provider: 'local',
          created_at: '2024-01-02',
        },
        {
          user_id: 3,
          username: 'user3',
          email: 'user3@example.com',
          auth_provider: 'local',
          created_at: '2024-01-03',
        },
      ];
      (UserModel.findAll as jest.Mock).mockResolvedValue(mockUsers);

      const res = await request(app).get('/api/chat/users');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.users).toHaveLength(2);
      expect(res.body.data.users.find((u: any) => u.user_id === 1)).toBeUndefined();
    });

    it('should return error if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.get('/api/chat/users', ChatController.getChatUsers);

      const res = await request(appNoAuth).get('/api/chat/users');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('should handle errors', async () => {
      (UserModel.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/chat/users');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving users');
    });
  });

  describe('getConversations', () => {
    it('should return all conversations for user', async () => {
      const mockConversations = [
        { conversation_id: 1, participant_id: 2, participant_username: 'user2' },
        { conversation_id: 2, participant_id: 3, participant_username: 'user3' },
      ];
      (ConversationModel.findByUserId as jest.Mock).mockResolvedValue(mockConversations);

      const res = await request(app).get('/api/chat/conversations');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.conversations).toEqual(mockConversations);
    });

    it('should return error if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.get('/api/chat/conversations', ChatController.getConversations);

      const res = await request(appNoAuth).get('/api/chat/conversations');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('should handle errors', async () => {
      (ConversationModel.findByUserId as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/chat/conversations');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving conversations');
    });
  });

  describe('getConversationById', () => {
    it('should return conversation if user is participant', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue(mockConversation);

      const res = await request(app).get('/api/chat/conversations/1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.conversation).toEqual(mockConversation);
    });

    it('should return 403 if user is not participant', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app).get('/api/chat/conversations/1');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should return 404 if conversation not found', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/chat/conversations/1');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Conversation not found');
    });

    it('should handle errors', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/chat/conversations/1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving conversation');
    });
  });

  describe('getMessages', () => {
    it('should return messages if user is participant', async () => {
      const mockMessages = [
        { message_id: 1, content: 'Hello', sender_id: 1 },
        { message_id: 2, content: 'Hi', sender_id: 2 },
      ];
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageModel.findByConversationId as jest.Mock).mockResolvedValue(mockMessages);

      const res = await request(app).get('/api/chat/conversations/1/messages');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.messages).toEqual(mockMessages);
      expect(MessageModel.findByConversationId).toHaveBeenCalledWith(1, 50);
    });

    it('should respect limit query param for messages', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageModel.findByConversationId as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/api/chat/conversations/1/messages?limit=20');

      expect(res.status).toBe(200);
      expect(MessageModel.findByConversationId).toHaveBeenCalledWith(1, 20);
    });

    it('should return 403 if user is not participant', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app).get('/api/chat/conversations/1/messages');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should handle errors', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/chat/conversations/1/messages');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving messages');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockMessage = { message_id: 1, content: 'Hello', sender_id: 1, conversation_id: 1 };
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue({
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
      });
      (UserBlockModel.isBlocked as jest.Mock).mockResolvedValue(false);
      (MessageModel.create as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.updateTimestamp as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Hello' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.message).toEqual(mockMessage);
    });

    it('should return 403 if sender is blocked by recipient', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue({
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
      });
      (UserBlockModel.isBlocked as jest.Mock)
        .mockResolvedValueOnce(true) // recipient blocked sender
        .mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Hello' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Cannot send messages to this user');
    });

    it('should return 403 if sender has blocked recipient', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue({
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
      });
      (UserBlockModel.isBlocked as jest.Mock)
        .mockResolvedValueOnce(false) // recipient has not blocked sender
        .mockResolvedValueOnce(true); // sender has blocked recipient

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Hello' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Cannot send messages to this user');
    });

    it('should return 400 if conversation_id missing', async () => {
      const res = await request(app).post('/api/chat/messages').send({ content: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Conversation ID and content are required');
    });

    it('should return 400 if content missing', async () => {
      const res = await request(app).post('/api/chat/messages').send({ conversation_id: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Conversation ID and content are required');
    });

    it('should return 403 if user is not participant', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Hello' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should handle reply to message', async () => {
      const mockReplyToMessage = { message_id: 1, conversation_id: 1, content: 'Original' };
      const mockMessage = { message_id: 2, content: 'Reply', sender_id: 1, conversation_id: 1 };
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue({
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
      });
      (UserBlockModel.isBlocked as jest.Mock).mockResolvedValue(false);
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockReplyToMessage);
      (MessageModel.create as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.updateTimestamp as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Reply', reply_to_message_id: 1 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
    });

    it('should return 404 if reply to message not found', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue({
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
      });
      (UserBlockModel.isBlocked as jest.Mock).mockResolvedValue(false);
      (MessageModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Reply', reply_to_message_id: 999 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Message to reply to not found');
    });

    it('should return 400 if reply message is from different conversation', async () => {
      const mockReplyToMessage = { message_id: 1, conversation_id: 2, content: 'Original' };
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.findById as jest.Mock).mockResolvedValue({
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
      });
      (UserBlockModel.isBlocked as jest.Mock).mockResolvedValue(false);
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockReplyToMessage);

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Reply', reply_to_message_id: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot reply to a message from a different conversation');
    });

    it('should handle errors', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/chat/messages')
        .send({ conversation_id: 1, content: 'Hello' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error sending message');
    });
  });

  describe('createConversation', () => {
    it('should create new conversation', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };
      (ConversationModel.findByUsers as jest.Mock).mockResolvedValue(null);
      (ConversationModel.create as jest.Mock).mockResolvedValue(mockConversation);

      const res = await request(app).post('/api/chat/conversations').send({ participant_id: 2 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.conversation).toEqual(mockConversation);
    });

    it('should return existing conversation if already exists', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };
      (ConversationModel.findByUsers as jest.Mock).mockResolvedValue(mockConversation);

      const res = await request(app).post('/api/chat/conversations').send({ participant_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Conversation already exists');
    });

    it('should return 400 if participant_id missing', async () => {
      const res = await request(app).post('/api/chat/conversations').send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Participant ID is required');
    });

    it('should return 400 if trying to create conversation with self', async () => {
      const res = await request(app).post('/api/chat/conversations').send({ participant_id: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot create conversation with yourself');
    });

    it('should handle errors', async () => {
      (ConversationModel.findByUsers as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/api/chat/conversations').send({ participant_id: 2 });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error creating conversation');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageModel.markAsRead as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).patch('/api/chat/conversations/1/read');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Messages marked as read');
    });

    it('should return 403 if user is not participant', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app).patch('/api/chat/conversations/1/read');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should handle errors', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch('/api/chat/conversations/1/read');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error marking messages as read');
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.delete as jest.Mock).mockResolvedValue(true);

      const res = await request(app).delete('/api/chat/conversations/1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Conversation deleted successfully');
    });

    it('should return 403 if user is not participant', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app).delete('/api/chat/conversations/1');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should return 404 if conversation not found', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (ConversationModel.delete as jest.Mock).mockResolvedValue(false);

      const res = await request(app).delete('/api/chat/conversations/1');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Conversation not found');
    });

    it('should handle errors', async () => {
      (ConversationModel.isParticipant as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete('/api/chat/conversations/1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error deleting conversation');
    });
  });

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      const mockMessage = { message_id: 1, conversation_id: 1, content: 'Hello' };
      const mockReaction = { reaction_id: 1, message_id: 1, user_id: 1, emoji: '👍' };
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageReactionModel.exists as jest.Mock).mockResolvedValue(false);
      (MessageReactionModel.create as jest.Mock).mockResolvedValue(mockReaction);

      const res = await request(app).post('/api/chat/messages/1/reactions').send({ emoji: '👍' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reaction).toEqual(mockReaction);
    });

    it('should remove reaction if already exists', async () => {
      const mockMessage = { message_id: 1, conversation_id: 1, content: 'Hello' };
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageReactionModel.exists as jest.Mock).mockResolvedValue(true);
      (MessageReactionModel.delete as jest.Mock).mockResolvedValue(true);

      const res = await request(app).post('/api/chat/messages/1/reactions').send({ emoji: '👍' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Reaction removed');
    });

    it('should return 400 if emoji missing', async () => {
      const res = await request(app).post('/api/chat/messages/1/reactions').send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Emoji is required');
    });

    it('should return 404 if message not found', async () => {
      (MessageModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/chat/messages/1/reactions').send({ emoji: '👍' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Message not found');
    });

    it('should return 403 if user is not participant', async () => {
      const mockMessage = { message_id: 1, conversation_id: 1, content: 'Hello' };
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app).post('/api/chat/messages/1/reactions').send({ emoji: '👍' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should handle errors', async () => {
      (MessageModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/api/chat/messages/1/reactions').send({ emoji: '👍' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error adding reaction');
    });
  });

  describe('getReactions', () => {
    it('should return reactions for message', async () => {
      const mockMessage = { message_id: 1, conversation_id: 1, content: 'Hello' };
      const mockReactions = [{ emoji: '👍', count: 2, users: [1, 2] }];
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageReactionModel.getReactionCounts as jest.Mock).mockResolvedValue(mockReactions);

      const res = await request(app).get('/api/chat/messages/1/reactions');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reactions).toEqual(mockReactions);
    });

    it('should return 404 if message not found', async () => {
      (MessageModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/chat/messages/1/reactions');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Message not found');
    });

    it('should return 403 if user is not participant', async () => {
      const mockMessage = { message_id: 1, conversation_id: 1, content: 'Hello' };
      (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      const res = await request(app).get('/api/chat/messages/1/reactions');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('should handle errors', async () => {
      (MessageModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/chat/messages/1/reactions');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error retrieving reactions');
    });
  });
});
