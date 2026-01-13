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

import { PasswordResetTokenModel } from '../../src/models/password-reset-token.model';

describe('PasswordResetTokenModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertIntoMock.mockReset();
    selectFromMock.mockReset();
    deleteFromMock.mockReset();
  });

  describe('create', () => {
    it('should create a password reset token with default 10 minute expiration', async () => {
      const mockToken = {
        token_id: 1,
        user_id: 123,
        code: '123456',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockToken);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await PasswordResetTokenModel.create(123, '123456');

      expect(insertIntoMock).toHaveBeenCalledWith('PasswordResetToken');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 123,
          code: '123456',
          expires_at: expect.any(String),
        }),
      );
      expect(result).toBe(mockToken);
    });

    it('should create a password reset token with custom expiration time', async () => {
      const mockToken = {
        token_id: 2,
        user_id: 456,
        code: '654321',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockToken);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await PasswordResetTokenModel.create(456, '654321', 15);

      expect(insertIntoMock).toHaveBeenCalledWith('PasswordResetToken');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 456,
          code: '654321',
          expires_at: expect.any(String),
        }),
      );
      expect(result).toBe(mockToken);
    });

    it('should handle database errors during token creation', async () => {
      const executeTakeFirstOrThrowMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      await expect(PasswordResetTokenModel.create(123, '123456')).rejects.toThrow('Database error');
    });
  });

  describe('findValidToken', () => {
    it('should find a valid token by userId and code', async () => {
      const mockToken = {
        token_id: 1,
        user_id: 123,
        code: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in future
        created_at: new Date().toISOString(),
      };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockToken);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereChain3 = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereChain2 = jest.fn().mockReturnValue({ where: whereChain3 });
      const whereChain1 = jest.fn().mockReturnValue({ where: whereChain2 });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereChain1 });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      const result = await PasswordResetTokenModel.findValidToken(123, '123456');

      expect(selectFromMock).toHaveBeenCalledWith('PasswordResetToken');
      expect(result).toBe(mockToken);
    });

    it('should return null if no valid token is found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereChain3 = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereChain2 = jest.fn().mockReturnValue({ where: whereChain3 });
      const whereChain1 = jest.fn().mockReturnValue({ where: whereChain2 });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereChain1 });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      const result = await PasswordResetTokenModel.findValidToken(123, 'wrongcode');

      expect(result).toBeNull();
    });

    it('should return null for expired tokens', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereChain3 = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereChain2 = jest.fn().mockReturnValue({ where: whereChain3 });
      const whereChain1 = jest.fn().mockReturnValue({ where: whereChain2 });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereChain1 });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      const result = await PasswordResetTokenModel.findValidToken(123, '123456');

      expect(result).toBeNull();
    });

    it('should order by created_at desc to get most recent token', async () => {
      const mockToken = {
        token_id: 2,
        user_id: 123,
        code: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockToken);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereChain3 = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereChain2 = jest.fn().mockReturnValue({ where: whereChain3 });
      const whereChain1 = jest.fn().mockReturnValue({ where: whereChain2 });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereChain1 });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      await PasswordResetTokenModel.findValidToken(123, '123456');

      expect(orderByMock).toHaveBeenCalledWith('created_at', 'desc');
    });

    it('should handle database errors during token lookup', async () => {
      const executeTakeFirstMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereChain3 = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const whereChain2 = jest.fn().mockReturnValue({ where: whereChain3 });
      const whereChain1 = jest.fn().mockReturnValue({ where: whereChain2 });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereChain1 });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      await expect(PasswordResetTokenModel.findValidToken(123, '123456')).rejects.toThrow('Database error');
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all tokens for a given user', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await PasswordResetTokenModel.deleteByUserId(123);

      expect(deleteFromMock).toHaveBeenCalledWith('PasswordResetToken');
      expect(whereMock).toHaveBeenCalledWith('user_id', '=', 123);
      expect(executeMock).toHaveBeenCalled();
    });

    it('should not throw error if no tokens exist for user', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await expect(PasswordResetTokenModel.deleteByUserId(999)).resolves.not.toThrow();
    });

    it('should handle database errors during deletion', async () => {
      const executeMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await expect(PasswordResetTokenModel.deleteByUserId(123)).rejects.toThrow('Database error');
    });
  });

  describe('deleteExpired', () => {
    it('should delete all expired tokens', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await PasswordResetTokenModel.deleteExpired();

      expect(deleteFromMock).toHaveBeenCalledWith('PasswordResetToken');
      expect(whereMock).toHaveBeenCalledWith('expires_at', '<', expect.any(String));
      expect(executeMock).toHaveBeenCalled();
    });

    it('should only delete tokens where expires_at is in the past', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      const beforeCall = new Date().toISOString();
      await PasswordResetTokenModel.deleteExpired();
      const afterCall = new Date().toISOString();

      const callArgs = whereMock.mock.calls[0];
      expect(callArgs[0]).toBe('expires_at');
      expect(callArgs[1]).toBe('<');
      // Verify timestamp is between before and after
      expect(callArgs[2]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(callArgs[2] >= beforeCall && callArgs[2] <= afterCall).toBe(true);
    });

    it('should handle database errors during expired token deletion', async () => {
      const executeMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await expect(PasswordResetTokenModel.deleteExpired()).rejects.toThrow('Database error');
    });
  });

  describe('getLastTokenTime', () => {
    it('should return the most recent token creation time for a user', async () => {
      const mockDate = '2026-01-10T12:00:00.000Z';
      const mockResult = {
        created_at: mockDate,
      };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockResult);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await PasswordResetTokenModel.getLastTokenTime(123);

      expect(selectFromMock).toHaveBeenCalledWith('PasswordResetToken');
      expect(selectMock).toHaveBeenCalledWith('created_at');
      expect(whereMock).toHaveBeenCalledWith('user_id', '=', 123);
      expect(orderByMock).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(new Date(mockDate));
    });

    it('should return null if no tokens exist for user', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await PasswordResetTokenModel.getLastTokenTime(999);

      expect(result).toBeNull();
    });

    it('should return null if created_at is not present in result', async () => {
      const mockResult = {};

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockResult);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await PasswordResetTokenModel.getLastTokenTime(123);

      expect(result).toBeNull();
    });

    it('should convert ISO string to Date object correctly', async () => {
      const mockDateString = '2026-01-10T15:30:00.000Z';
      const mockResult = {
        created_at: mockDateString,
      };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockResult);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await PasswordResetTokenModel.getLastTokenTime(123);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(mockDateString);
    });

    it('should handle database errors during last token time lookup', async () => {
      const executeTakeFirstMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      await expect(PasswordResetTokenModel.getLastTokenTime(123)).rejects.toThrow('Database error');
    });
  });
});
