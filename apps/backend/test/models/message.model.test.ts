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

import { MessageModel } from '../../src/models/message.model';

describe('MessageModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertIntoMock.mockReset();
    selectFromMock.mockReset();
    updateTableMock.mockReset();
    deleteFromMock.mockReset();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const mockMessage = {
        message_id: 1,
        conversation_id: 1,
        sender_id: 1,
        content: 'Hello',
        created_at: '2024-01-01T00:00:00.000Z',
        read: false,
        reply_to_message_id: null,
      };

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockMessage);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await MessageModel.create({
        conversation_id: 1,
        sender_id: 1,
        content: 'Hello',
        created_at: '2024-01-01T00:00:00.000Z',
        read: false,
        reply_to_message_id: null,
      });

      expect(insertIntoMock).toHaveBeenCalledWith('Message');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 1,
          sender_id: 1,
          content: 'Hello',
          created_at: expect.any(String),
          read: false,
        }),
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('findById', () => {
    it('should find message by id', async () => {
      const mockMessage = { message_id: 1, content: 'Hello' };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockMessage);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.findById(1);

      expect(selectFromMock).toHaveBeenCalledWith('Message');
      expect(whereMock).toHaveBeenCalledWith('message_id', '=', 1);
      expect(result).toEqual(mockMessage);
    });

    it('should return undefined if message not found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByConversationId', () => {
    it('should find all messages in a conversation', async () => {
      const mockMessages = [
        { message_id: 1, content: 'Hello' },
        { message_id: 2, content: 'Hi' },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockMessages);
      const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.findByConversationId(1);

      expect(selectFromMock).toHaveBeenCalledWith('Message');
      expect(whereMock).toHaveBeenCalledWith('conversation_id', '=', 1);
      expect(orderByMock).toHaveBeenCalledWith('created_at', 'asc');
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array if no messages found', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.findByConversationId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadMessages', () => {
    it('should get unread messages for a user', async () => {
      const mockMessages = [{ message_id: 1, content: 'Unread', read: false }];

      const executeMock = jest.fn().mockResolvedValue(mockMessages);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereReadMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      const whereSenderMock = jest.fn().mockReturnValue({ where: whereReadMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereSenderMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await MessageModel.getUnreadMessages(1, 2);

      expect(result).toEqual(mockMessages);
    });

    it('should return empty array if no unread messages', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereReadMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      const whereSenderMock = jest.fn().mockReturnValue({ where: whereReadMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereSenderMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await MessageModel.getUnreadMessages(1, 2);

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereReadMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereSenderMock = jest.fn().mockReturnValue({ where: whereReadMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereSenderMock });
      const setMock = jest.fn().mockReturnValue({ where: whereConvMock });
      updateTableMock.mockReturnValue({ set: setMock });

      await MessageModel.markAsRead(1, 2);

      expect(updateTableMock).toHaveBeenCalledWith('Message');
      expect(setMock).toHaveBeenCalledWith({ read: true });
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      const mockUpdatedMessage = { message_id: 1, content: 'Updated content' };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockUpdatedMessage);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      updateTableMock.mockReturnValue({ set: setMock });

      const result = await MessageModel.update(1, { content: 'Updated content' });

      expect(updateTableMock).toHaveBeenCalledWith('Message');
      expect(setMock).toHaveBeenCalledWith({ content: 'Updated content' });
      expect(whereMock).toHaveBeenCalledWith('message_id', '=', 1);
      expect(result).toEqual(mockUpdatedMessage);
    });

    it('should return undefined if message not found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      updateTableMock.mockReturnValue({ set: setMock });

      const result = await MessageModel.update(999, { content: 'Updated' });

      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a message', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 1n });
      const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.delete(1);

      expect(deleteFromMock).toHaveBeenCalledWith('Message');
      expect(whereMock).toHaveBeenCalledWith('message_id', '=', 1);
      expect(result).toBe(true);
    });

    it('should return false if message not found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 0n });
      const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('countUnread', () => {
    it('should count unread messages', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ count: 5 });
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereReadMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereSenderMock = jest.fn().mockReturnValue({ where: whereReadMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereSenderMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await MessageModel.countUnread(1, 2);

      expect(result).toBe(5);
    });

    it('should return 0 if no unread messages', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ count: 0 });
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereReadMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereSenderMock = jest.fn().mockReturnValue({ where: whereReadMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereSenderMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await MessageModel.countUnread(1, 2);

      expect(result).toBe(0);
    });

    it('should handle null count', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(null);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereReadMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereSenderMock = jest.fn().mockReturnValue({ where: whereReadMock });
      const whereConvMock = jest.fn().mockReturnValue({ where: whereSenderMock });
      selectFromMock.mockReturnValue({ where: whereConvMock });

      const result = await MessageModel.countUnread(1, 2);

      expect(result).toBe(0);
    });
  });

  describe('getLatestMessage', () => {
    it('should get latest message in conversation', async () => {
      const mockMessage = { message_id: 5, content: 'Latest', created_at: '2024-01-05' };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockMessage);
      const limitMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const orderByMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.getLatestMessage(1);

      expect(selectFromMock).toHaveBeenCalledWith('Message');
      expect(whereMock).toHaveBeenCalledWith('conversation_id', '=', 1);
      expect(orderByMock).toHaveBeenCalledWith('created_at', 'desc');
      expect(limitMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMessage);
    });

    it('should return undefined if no messages in conversation', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const limitMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const orderByMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.getLatestMessage(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getReplies', () => {
    it('should get all replies to a message', async () => {
      const mockReplies = [
        { message_id: 2, reply_to_message_id: 1, content: 'Reply 1' },
        { message_id: 3, reply_to_message_id: 1, content: 'Reply 2' },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockReplies);
      const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.getReplies(1);

      expect(selectFromMock).toHaveBeenCalledWith('Message');
      expect(whereMock).toHaveBeenCalledWith('reply_to_message_id', '=', 1);
      expect(orderByMock).toHaveBeenCalledWith('created_at', 'asc');
      expect(result).toEqual(mockReplies);
    });

    it('should return empty array if no replies', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageModel.getReplies(1);

      expect(result).toEqual([]);
    });
  });

  describe('existsInConversation', () => {
    it('should return true if message exists in conversation', async () => {
      const mockMessage = { message_id: 1 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockMessage);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereConvMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereMsgMock = jest.fn().mockReturnValue({ where: whereConvMock });
      selectFromMock.mockReturnValue({ where: whereMsgMock });

      const result = await MessageModel.existsInConversation(1, 1);

      expect(result).toBe(true);
    });

    it('should return false if message does not exist in conversation', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereConvMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereMsgMock = jest.fn().mockReturnValue({ where: whereConvMock });
      selectFromMock.mockReturnValue({ where: whereMsgMock });

      const result = await MessageModel.existsInConversation(1, 999);

      expect(result).toBe(false);
    });
  });
});
