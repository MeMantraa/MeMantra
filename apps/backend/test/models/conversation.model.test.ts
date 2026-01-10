jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const insertIntoMock = jest.fn();
const selectFromMock = jest.fn();
const updateTableMock = jest.fn();
const deleteFromMock = jest.fn();

jest.mock('../../src/db', () => ({
  db: {
    insertInto: insertIntoMock,
    selectFrom: selectFromMock,
    updateTable: updateTableMock,
    deleteFrom: deleteFromMock,
  },
}));

jest.mock('../../src/models/message.model', () => ({
  MessageModel: {
    getLatestMessage: jest.fn(),
    countUnread: jest.fn(),
  },
}));

import { ConversationModel } from '../../src/models/conversation.model';
import { MessageModel } from '../../src/models/message.model';

describe('ConversationModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertIntoMock.mockReset();
    selectFromMock.mockReset();
    updateTableMock.mockReset();
    deleteFromMock.mockReset();
  });

  describe('create', () => {
    it('should create a new conversation', async () => {
      const mockConversation = {
        conversation_id: 1,
        user1_id: 1,
        user2_id: 2,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockConversation);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await ConversationModel.create(1, 2);

      expect(insertIntoMock).toHaveBeenCalledWith('Conversation');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user1_id: 1,
          user2_id: 2,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      );
      expect(result).toEqual(mockConversation);
    });
  });

  describe('findById', () => {
    it('should find conversation by id', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockConversation);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await ConversationModel.findById(1);

      expect(selectFromMock).toHaveBeenCalledWith('Conversation');
      expect(whereMock).toHaveBeenCalledWith('conversation_id', '=', 1);
      expect(result).toEqual(mockConversation);
    });

    it('should return undefined if conversation not found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await ConversationModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByUsers', () => {
    it('should find conversation between two users (user1, user2)', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockConversation);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await ConversationModel.findByUsers(1, 2);

      expect(selectFromMock).toHaveBeenCalledWith('Conversation');
      expect(result).toEqual(mockConversation);
    });

    it('should find conversation between two users (reversed order)', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 2, user2_id: 1 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockConversation);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await ConversationModel.findByUsers(1, 2);

      expect(result).toEqual(mockConversation);
    });

    it('should return undefined if no conversation exists', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await ConversationModel.findByUsers(1, 999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByUserId', () => {
    it('should return enriched conversations for a user', async () => {
      const mockConversations = [
        { conversation_id: 1, user1_id: 1, user2_id: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      const mockParticipant = { username: 'user2', email: 'user2@example.com' };
      const mockLatestMessage = { content: 'Hello', created_at: '2024-01-02' };

      const executeMock = jest.fn().mockResolvedValue(mockConversations);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockParticipant);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereParticipantMock = jest.fn().mockReturnValue({ select: selectMock });
      
      selectFromMock.mockImplementation((table: string) => {
        if (table === 'Conversation') {
          return { where: whereMock };
        } else if (table === 'User') {
          return { where: whereParticipantMock };
        }
        return { where: whereMock };
      });

      (MessageModel.getLatestMessage as jest.Mock).mockResolvedValue(mockLatestMessage);
      (MessageModel.countUnread as jest.Mock).mockResolvedValue(3);

      const result = await ConversationModel.findByUserId(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        conversation_id: 1,
        participant_id: 2,
        participant_username: 'user2',
        participant_email: 'user2@example.com',
        last_message: 'Hello',
        unread_count: 3,
      });
    });

    it('should handle conversations with no latest message', async () => {
      const mockConversations = [
        { conversation_id: 1, user1_id: 1, user2_id: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      const mockParticipant = { username: 'user2', email: 'user2@example.com' };

      const executeMock = jest.fn().mockResolvedValue(mockConversations);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockParticipant);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereParticipantMock = jest.fn().mockReturnValue({ select: selectMock });
      
      selectFromMock.mockImplementation((table: string) => {
        if (table === 'Conversation') {
          return { where: whereMock };
        } else if (table === 'User') {
          return { where: whereParticipantMock };
        }
        return { where: whereMock };
      });

      (MessageModel.getLatestMessage as jest.Mock).mockResolvedValue(null);
      (MessageModel.countUnread as jest.Mock).mockResolvedValue(0);

      const result = await ConversationModel.findByUserId(1);

      expect(result[0].last_message).toBe('');
      expect(result[0].last_message_time).toBe('2024-01-01');
    });

    it('should sort conversations by last message time', async () => {
      const mockConversations = [
        { conversation_id: 1, user1_id: 1, user2_id: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
        { conversation_id: 2, user1_id: 1, user2_id: 3, created_at: '2024-01-02', updated_at: '2024-01-02' },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockConversations);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const executeTakeFirstMock = jest.fn()
        .mockResolvedValueOnce({ username: 'user2', email: 'user2@example.com' })
        .mockResolvedValueOnce({ username: 'user3', email: 'user3@example.com' });
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereParticipantMock = jest.fn().mockReturnValue({ select: selectMock });
      
      selectFromMock.mockImplementation((table: string) => {
        if (table === 'Conversation') {
          return { where: whereMock };
        } else if (table === 'User') {
          return { where: whereParticipantMock };
        }
        return { where: whereMock };
      });

      (MessageModel.getLatestMessage as jest.Mock)
        .mockResolvedValueOnce({ content: 'Old', created_at: '2024-01-01T10:00:00.000Z' })
        .mockResolvedValueOnce({ content: 'New', created_at: '2024-01-05T10:00:00.000Z' });
      (MessageModel.countUnread as jest.Mock).mockResolvedValue(0);

      const result = await ConversationModel.findByUserId(1);

      expect(result[0].conversation_id).toBe(2);
      expect(result[1].conversation_id).toBe(1);
    });
  });

  describe('updateTimestamp', () => {
    it('should update conversation timestamp', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      updateTableMock.mockReturnValue({ set: setMock });

      await ConversationModel.updateTimestamp(1);

      expect(updateTableMock).toHaveBeenCalledWith('Conversation');
      expect(setMock).toHaveBeenCalledWith({ updated_at: expect.any(String) });
      expect(whereMock).toHaveBeenCalledWith('conversation_id', '=', 1);
    });
  });

  describe('delete', () => {
    it('should delete conversation and its messages', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 1n });
      const whereConvMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      
      deleteFromMock.mockImplementation((table: string) => {
        if (table === 'Message') {
          return { where: whereMock };
        } else if (table === 'Conversation') {
          return { where: whereConvMock };
        }
        return { where: whereMock };
      });

      const result = await ConversationModel.delete(1);

      expect(deleteFromMock).toHaveBeenCalledWith('Message');
      expect(deleteFromMock).toHaveBeenCalledWith('Conversation');
      expect(result).toBe(true);
    });

    it('should return false if conversation not found', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 0n });
      const whereConvMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      
      deleteFromMock.mockImplementation((table: string) => {
        if (table === 'Message') {
          return { where: whereMock };
        } else if (table === 'Conversation') {
          return { where: whereConvMock };
        }
        return { where: whereMock };
      });

      const result = await ConversationModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('isParticipant', () => {
    it('should return true if user is user1', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockConversation);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await ConversationModel.isParticipant(1, 1);

      expect(result).toBe(true);
    });

    it('should return true if user is user2', async () => {
      const mockConversation = { conversation_id: 1, user1_id: 1, user2_id: 2 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockConversation);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await ConversationModel.isParticipant(1, 2);

      expect(result).toBe(true);
    });

    it('should return false if user is not a participant', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await ConversationModel.isParticipant(1, 999);

      expect(result).toBe(false);
    });
  });
});
