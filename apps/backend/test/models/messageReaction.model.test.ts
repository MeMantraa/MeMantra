jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const insertIntoMock = jest.fn();
const selectFromMock = jest.fn();
const deleteFromMock = jest.fn();

jest.mock('../../src/db', () => ({
  db: {
    insertInto: insertIntoMock,
    selectFrom: selectFromMock,
    deleteFrom: deleteFromMock,
  },
}));

import { MessageReactionModel } from '../../src/models/messageReaction.model';

describe('MessageReactionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertIntoMock.mockReset();
    selectFromMock.mockReset();
    deleteFromMock.mockReset();
  });

  describe('create', () => {
    it('should create a new message reaction', async () => {
      const mockReaction = {
        reaction_id: 1,
        message_id: 1,
        user_id: 1,
        emoji: '👍',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockReaction);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await MessageReactionModel.create({
        message_id: 1,
        user_id: 1,
        emoji: '👍',
      });

      expect(insertIntoMock).toHaveBeenCalledWith('MessageReaction');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message_id: 1,
          user_id: 1,
          emoji: '👍',
          created_at: expect.any(String),
        }),
      );
      expect(result).toEqual(mockReaction);
    });
  });

  describe('delete', () => {
    it('should delete a message reaction', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 1n });
      const whereEmojiMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereUserMock = jest.fn().mockReturnValue({ where: whereEmojiMock });
      const whereMsgMock = jest.fn().mockReturnValue({ where: whereUserMock });
      deleteFromMock.mockReturnValue({ where: whereMsgMock });

      const result = await MessageReactionModel.delete(1, 1, '👍');

      expect(deleteFromMock).toHaveBeenCalledWith('MessageReaction');
      expect(result).toBe(true);
    });

    it('should return false if reaction not found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 0n });
      const whereEmojiMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereUserMock = jest.fn().mockReturnValue({ where: whereEmojiMock });
      const whereMsgMock = jest.fn().mockReturnValue({ where: whereUserMock });
      deleteFromMock.mockReturnValue({ where: whereMsgMock });

      const result = await MessageReactionModel.delete(999, 999, '👍');

      expect(result).toBe(false);
    });
  });

  describe('findByMessageId', () => {
    it('should find all reactions for a message', async () => {
      const mockReactions = [
        { reaction_id: 1, message_id: 1, user_id: 1, emoji: '👍' },
        { reaction_id: 2, message_id: 1, user_id: 2, emoji: '❤️' },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockReactions);
      const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.findByMessageId(1);

      expect(selectFromMock).toHaveBeenCalledWith('MessageReaction');
      expect(whereMock).toHaveBeenCalledWith('message_id', '=', 1);
      expect(orderByMock).toHaveBeenCalledWith('created_at', 'asc');
      expect(result).toEqual(mockReactions);
    });

    it('should return empty array if no reactions found', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.findByMessageId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByMessageIds', () => {
    it('should find reactions for multiple messages', async () => {
      const mockReactions = [
        { reaction_id: 1, message_id: 1, user_id: 1, emoji: '👍' },
        { reaction_id: 2, message_id: 2, user_id: 2, emoji: '❤️' },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockReactions);
      const orderByCreatedMock = jest.fn().mockReturnValue({ execute: executeMock });
      const orderByMsgMock = jest.fn().mockReturnValue({ orderBy: orderByCreatedMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMsgMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.findByMessageIds([1, 2]);

      expect(selectFromMock).toHaveBeenCalledWith('MessageReaction');
      expect(result).toEqual(mockReactions);
    });

    it('should return empty array if messageIds is empty', async () => {
      const result = await MessageReactionModel.findByMessageIds([]);

      expect(result).toEqual([]);
      expect(selectFromMock).not.toHaveBeenCalled();
    });

    it('should return empty array if no reactions found', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const orderByCreatedMock = jest.fn().mockReturnValue({ execute: executeMock });
      const orderByMsgMock = jest.fn().mockReturnValue({ orderBy: orderByCreatedMock });
      const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMsgMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.findByMessageIds([999]);

      expect(result).toEqual([]);
    });
  });

  describe('exists', () => {
    it('should return true if reaction exists', async () => {
      const mockReaction = { reaction_id: 1 };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockReaction);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereEmojiMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereUserMock = jest.fn().mockReturnValue({ where: whereEmojiMock });
      const whereMsgMock = jest.fn().mockReturnValue({ where: whereUserMock });
      selectFromMock.mockReturnValue({ where: whereMsgMock });

      const result = await MessageReactionModel.exists(1, 1, '👍');

      expect(selectFromMock).toHaveBeenCalledWith('MessageReaction');
      expect(result).toBe(true);
    });

    it('should return false if reaction does not exist', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereEmojiMock = jest.fn().mockReturnValue({ select: selectMock });
      const whereUserMock = jest.fn().mockReturnValue({ where: whereEmojiMock });
      const whereMsgMock = jest.fn().mockReturnValue({ where: whereUserMock });
      selectFromMock.mockReturnValue({ where: whereMsgMock });

      const result = await MessageReactionModel.exists(999, 999, '👍');

      expect(result).toBe(false);
    });
  });

  describe('getReactionCounts', () => {
    it('should return reaction counts grouped by emoji', async () => {
      const mockReactions = [
        { emoji: '👍', user_id: 1 },
        { emoji: '👍', user_id: 2 },
        { emoji: '❤️', user_id: 3 },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockReactions);
      const selectMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ select: selectMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.getReactionCounts(1);

      expect(selectFromMock).toHaveBeenCalledWith('MessageReaction');
      expect(whereMock).toHaveBeenCalledWith('message_id', '=', 1);
      expect(result).toEqual([
        { emoji: '👍', count: 2, users: [1, 2] },
        { emoji: '❤️', count: 1, users: [3] },
      ]);
    });

    it('should return empty array if no reactions', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const selectMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ select: selectMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.getReactionCounts(999);

      expect(result).toEqual([]);
    });

    it('should group multiple users with same emoji correctly', async () => {
      const mockReactions = [
        { emoji: '🔥', user_id: 1 },
        { emoji: '🔥', user_id: 2 },
        { emoji: '🔥', user_id: 3 },
        { emoji: '🔥', user_id: 4 },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockReactions);
      const selectMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ select: selectMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.getReactionCounts(1);

      expect(result).toEqual([
        { emoji: '🔥', count: 4, users: [1, 2, 3, 4] },
      ]);
    });

    it('should handle multiple different emojis', async () => {
      const mockReactions = [
        { emoji: '👍', user_id: 1 },
        { emoji: '❤️', user_id: 2 },
        { emoji: '😂', user_id: 3 },
        { emoji: '👍', user_id: 4 },
      ];

      const executeMock = jest.fn().mockResolvedValue(mockReactions);
      const selectMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ select: selectMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await MessageReactionModel.getReactionCounts(1);

      expect(result).toHaveLength(3);
      expect(result.find((r) => r.emoji === '👍')).toEqual({ emoji: '👍', count: 2, users: [1, 4] });
      expect(result.find((r) => r.emoji === '❤️')).toEqual({ emoji: '❤️', count: 1, users: [2] });
      expect(result.find((r) => r.emoji === '😂')).toEqual({ emoji: '😂', count: 1, users: [3] });
    });
  });
});
