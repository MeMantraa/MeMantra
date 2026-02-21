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

const genSaltMock = jest.fn();
const hashMock = jest.fn();

jest.mock('bcryptjs', () => ({
  genSalt: genSaltMock,
  hash: hashMock,
}));

import { UserModel } from '../../src/models/user.model';

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertIntoMock.mockReset();
    selectFromMock.mockReset();
    updateTableMock.mockReset();
    deleteFromMock.mockReset();
    genSaltMock.mockReset();
    hashMock.mockReset();
  });

  it('creates a user with hashed password', async () => {
    const fakeUser = {
      user_id: 1,
      username: 'john',
      email: 'john@example.com',
      password_hash: 'hashed',
      device_token: null,
      created_at: '2024-01-01T00:00:00.000Z',
    };

    genSaltMock.mockResolvedValue('salt');
    hashMock.mockResolvedValue('hashed');

    const executeTakeFirstOrThrowMock = jest.fn().mockResolvedValue(fakeUser);
    const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowMock });
    const valuesMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
    insertIntoMock.mockReturnValue({ values: valuesMock });

    const result = await UserModel.create({
      username: 'john',
      email: 'john@example.com',
      password: 'plain-pass',
    });

    expect(genSaltMock).toHaveBeenCalledWith(10);
    expect(hashMock).toHaveBeenCalledWith('plain-pass', 'salt');
    expect(result).toBe(fakeUser);
  });

  it('finds user by email', async () => {
    const fakeUser = { user_id: 2 };
    const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
    const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findByEmail('search@example.com');

    expect(whereMock).toHaveBeenCalledWith('email', '=', 'search@example.com');
    expect(result).toBe(fakeUser);
  });

  it('finds user by username', async () => {
    const fakeUser = { user_id: 3 };
    const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
    const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findByUsername('memantra');

    expect(whereMock).toHaveBeenCalledWith('username', '=', 'memantra');
    expect(result).toBe(fakeUser);
  });

  it('finds user by id', async () => {
    const fakeUser = { user_id: 5 };
    const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
    const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findById(5);

    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 5);
    expect(result).toBe(fakeUser);
  });

  it('finds users by ids', async () => {
    const fakeUsers = [{ user_id: 1 }, { user_id: 2 }];
    const executeMock = jest.fn().mockResolvedValue(fakeUsers);
    const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findByIds([1, 2]);

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(whereMock).toHaveBeenCalledWith('user_id', 'in', [1, 2]);
    expect(result).toBe(fakeUsers);
  });

  it('returns empty array for findByIds with empty input', async () => {
    const result = await UserModel.findByIds([]);

    expect(result).toEqual([]);
    expect(selectFromMock).not.toHaveBeenCalled();
  });

  it('finds all users', async () => {
    const fakeUsers = [{ user_id: 1 }, { user_id: 2 }];
    const executeMock = jest.fn().mockResolvedValue(fakeUsers);
    const orderByMock = jest.fn().mockReturnValue({ execute: executeMock });
    const selectAllMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
    selectFromMock.mockReturnValue({ selectAll: selectAllMock });

    const result = await UserModel.findAll();

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(orderByMock).toHaveBeenCalledWith('created_at', 'desc');
    expect(result).toBe(fakeUsers);
  });

  it('updates a user', async () => {
    const updatedUser = { user_id: 1, username: 'updated' };
    const executeTakeFirstMock = jest.fn().mockResolvedValue(updatedUser);
    const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
    const setMock = jest.fn().mockReturnValue({ where: whereMock });
    updateTableMock.mockReturnValue({ set: setMock });

    const result = await UserModel.update(1, { username: 'updated' });

    expect(updateTableMock).toHaveBeenCalledWith('User');
    expect(setMock).toHaveBeenCalledWith({ username: 'updated' });
    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
    expect(result).toBe(updatedUser);
  });

  it('deletes a user and returns true', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) });
    const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    deleteFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.delete(1);

    expect(deleteFromMock).toHaveBeenCalledWith('User');
    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
    expect(result).toBe(true);
  });

  it('returns false when deleting non-existent user', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) });
    const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    deleteFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.delete(999);

    expect(result).toBe(false);
  });

  describe('findAllWithDeviceTokens', () => {
    it('returns users that have a non-null device token', async () => {
      const fakeUsers = [
        { user_id: 1, device_token: 'ExponentPushToken[abc]' },
        { user_id: 2, device_token: 'ExponentPushToken[xyz]' },
      ];
      const executeMock = jest.fn().mockResolvedValue(fakeUsers);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await UserModel.findAllWithDeviceTokens();

      expect(selectFromMock).toHaveBeenCalledWith('User');
      expect(whereMock).toHaveBeenCalledWith('device_token', 'is not', null);
      expect(result).toBe(fakeUsers);
    });

    it('returns an empty array when no users have device tokens', async () => {
      const executeMock = jest.fn().mockResolvedValue([]);
      const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
      const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
      selectFromMock.mockReturnValue({ where: whereMock });

      const result = await UserModel.findAllWithDeviceTokens();

      expect(result).toEqual([]);
    });
  });

  it('updates email', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ numUpdatedRows: BigInt(1) });
    const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const setMock = jest.fn().mockReturnValue({ where: whereMock });
    updateTableMock.mockReturnValue({ set: setMock });

    await UserModel.updateEmail(1, 'new@example.com');

    expect(updateTableMock).toHaveBeenCalledWith('User');
    expect(setMock).toHaveBeenCalledWith({ email: 'new@example.com' });
    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
  });

  describe('Theme functions', () => {
    it('updates user theme', async () => {
      const fakeUser = { user_id: 1, theme: 'dark' };
      const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      updateTableMock.mockReturnValue({ set: setMock });

      const result = await UserModel.updateTheme(1, 'dark');

      expect(updateTableMock).toHaveBeenCalledWith('User');
      expect(setMock).toHaveBeenCalledWith({ theme: 'dark' });
      expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(fakeUser);
    });

    it('gets user theme', async () => {
      const fakeUser = { theme: 'light' };
      const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
      const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await UserModel.getTheme(1);

      expect(selectFromMock).toHaveBeenCalledWith('User');
      expect(selectMock).toHaveBeenCalledWith('theme');
      expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe('light');
    });

    it('returns default theme when user has no theme', async () => {
      const executeTakeFirstMock = jest.fn().mockResolvedValue({ theme: undefined });
      const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const selectMock = jest.fn().mockReturnValue({ where: whereMock });
      selectFromMock.mockReturnValue({ select: selectMock });

      const result = await UserModel.getTheme(1);

      expect(result).toBe('default');
    });
  });
});