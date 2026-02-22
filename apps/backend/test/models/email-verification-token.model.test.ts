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

import { EmailVerificationTokenModel } from '../../src/models/email-verification-token.model';

describe('EmailVerificationTokenModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertIntoMock.mockReset();
    selectFromMock.mockReset();
    deleteFromMock.mockReset();
  });

  describe('create', () => {
    it('should delete existing tokens and create a new one with default 10 minute expiration', async () => {
      const mockToken = {
        token_id: 1,
        email: 'user@example.com',
        code: '123456',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      // Mock deleteFrom chain (cleanup old tokens)
      const deleteExecuteMock = jest.fn().mockResolvedValue(undefined);
      const deleteWhereMock = jest.fn().mockReturnValue({ execute: deleteExecuteMock });
      deleteFromMock.mockReturnValue({ where: deleteWhereMock });

      // Mock insertInto chain
      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockToken);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await EmailVerificationTokenModel.create('User@Example.COM', '123456');

      expect(deleteFromMock).toHaveBeenCalledWith('EmailVerificationToken');
      expect(deleteWhereMock).toHaveBeenCalledWith('email', '=', 'user@example.com');
      expect(insertIntoMock).toHaveBeenCalledWith('EmailVerificationToken');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          code: '123456',
          expires_at: expect.any(String),
        }),
      );
      expect(result).toBe(mockToken);
    });

    it('should create a token with custom expiration time', async () => {
      const mockToken = {
        token_id: 2,
        email: 'user@example.com',
        code: '654321',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const deleteExecuteMock = jest.fn().mockResolvedValue(undefined);
      const deleteWhereMock = jest.fn().mockReturnValue({ execute: deleteExecuteMock });
      deleteFromMock.mockReturnValue({ where: deleteWhereMock });

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockToken);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      const result = await EmailVerificationTokenModel.create('user@example.com', '654321', 15);

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          code: '654321',
          expires_at: expect.any(String),
        }),
      );
      expect(result).toBe(mockToken);
    });

    it('should trim and lowercase the email', async () => {
      const mockToken = {
        token_id: 3,
        email: 'user@example.com',
        code: '111111',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const deleteExecuteMock = jest.fn().mockResolvedValue(undefined);
      const deleteWhereMock = jest.fn().mockReturnValue({ execute: deleteExecuteMock });
      deleteFromMock.mockReturnValue({ where: deleteWhereMock });

      const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(mockToken);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      await EmailVerificationTokenModel.create('  USER@Example.COM  ', '111111');

      expect(deleteWhereMock).toHaveBeenCalledWith('email', '=', 'user@example.com');
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
        }),
      );
    });

    it('should handle database errors during creation', async () => {
      const deleteExecuteMock = jest.fn().mockResolvedValue(undefined);
      const deleteWhereMock = jest.fn().mockReturnValue({ execute: deleteExecuteMock });
      deleteFromMock.mockReturnValue({ where: deleteWhereMock });

      const executeTakeFirstOrThrowMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
      const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      insertIntoMock.mockReturnValue({ values: valuesMock });

      await expect(EmailVerificationTokenModel.create('user@example.com', '123456')).rejects.toThrow('Database error');
    });
  });

  describe('findValidToken', () => {
    it('should find a valid token by email and code', async () => {
      const mockToken = {
        token_id: 1,
        email: 'user@example.com',
        code: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockToken);
      const whereExpiresMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereCodeMock = jest.fn().mockReturnValue({ where: whereExpiresMock });
      const whereEmailMock = jest.fn().mockReturnValue({ where: whereCodeMock });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereEmailMock });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      const result = await EmailVerificationTokenModel.findValidToken('User@Example.COM', '123456');

      expect(selectFromMock).toHaveBeenCalledWith('EmailVerificationToken');
      expect(whereEmailMock).toHaveBeenCalledWith('email', '=', 'user@example.com');
      expect(whereCodeMock).toHaveBeenCalledWith('code', '=', '123456');
      expect(whereExpiresMock).toHaveBeenCalledWith('expires_at', '>', expect.any(String));
      expect(result).toBe(mockToken);
    });

    it('should return null when no valid token is found', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const whereExpiresMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereCodeMock = jest.fn().mockReturnValue({ where: whereExpiresMock });
      const whereEmailMock = jest.fn().mockReturnValue({ where: whereCodeMock });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereEmailMock });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      const result = await EmailVerificationTokenModel.findValidToken('user@example.com', '999999');

      expect(result).toBeNull();
    });

    it('should handle database errors during lookup', async () => {
      const executeTakeFirstMock = jest.fn().mockRejectedValue(new Error('Connection lost'));
      const whereExpiresMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereCodeMock = jest.fn().mockReturnValue({ where: whereExpiresMock });
      const whereEmailMock = jest.fn().mockReturnValue({ where: whereCodeMock });
      const selectAllMock = jest.fn().mockReturnValue({ where: whereEmailMock });
      selectFromMock.mockReturnValue({ selectAll: selectAllMock });

      await expect(EmailVerificationTokenModel.findValidToken('user@example.com', '123456')).rejects.toThrow('Connection lost');
    });
  });

  describe('deleteByEmail', () => {
    it('should delete all tokens for the given email', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await EmailVerificationTokenModel.deleteByEmail('User@Example.COM');

      expect(deleteFromMock).toHaveBeenCalledWith('EmailVerificationToken');
      expect(whereMock).toHaveBeenCalledWith('email', '=', 'user@example.com');
      expect(executeMock).toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const executeMock = jest.fn().mockRejectedValue(new Error('Delete failed'));
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await expect(EmailVerificationTokenModel.deleteByEmail('user@example.com')).rejects.toThrow('Delete failed');
    });
  });

  describe('getLastTokenTime', () => {
    it('should return the created_at date of the most recent token', async () => {
      const createdAt = '2026-02-22T10:00:00.000Z';
      const mockResult = { created_at: createdAt };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockResult);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await EmailVerificationTokenModel.getLastTokenTime('user@example.com');

      expect(selectFromMock).toHaveBeenCalledWith('EmailVerificationToken');
      expect(selectMock).toHaveBeenCalledWith('created_at');
      expect(whereMock).toHaveBeenCalledWith('email', '=', 'user@example.com');
      expect(orderByMock).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(new Date(createdAt));
    });

    it('should return null when no tokens exist for the email', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await EmailVerificationTokenModel.getLastTokenTime('nobody@example.com');

      expect(result).toBeNull();
    });

    it('should return null when created_at is falsy', async () => {
      const mockResult = { created_at: null };

      const executeTakeFirstMock = jest.fn().mockResolvedValue(mockResult);
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await EmailVerificationTokenModel.getLastTokenTime('user@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const executeTakeFirstMock = jest.fn().mockRejectedValue(new Error('Query failed'));
      const orderByMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      await expect(EmailVerificationTokenModel.getLastTokenTime('user@example.com')).rejects.toThrow('Query failed');
    });
  });

  describe('deleteExpired', () => {
    it('should delete all expired tokens', async () => {
      const executeMock = jest.fn().mockResolvedValue(undefined);
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await EmailVerificationTokenModel.deleteExpired();

      expect(deleteFromMock).toHaveBeenCalledWith('EmailVerificationToken');
      expect(whereMock).toHaveBeenCalledWith('expires_at', '<', expect.any(String));
      expect(executeMock).toHaveBeenCalled();
    });

    it('should handle database errors during cleanup', async () => {
      const executeMock = jest.fn().mockRejectedValue(new Error('Cleanup failed'));
      const whereMock = jest.fn().mockReturnValue({ execute: executeMock });
      deleteFromMock.mockReturnValue({ where: whereMock });

      await expect(EmailVerificationTokenModel.deleteExpired()).rejects.toThrow('Cleanup failed');
    });
  });
});
