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
    expect(insertIntoMock).toHaveBeenCalledWith('User');
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'john',
        email: 'john@example.com',
        password_hash: 'hashed',
        device_token: null,
        created_at: expect.any(String),
      }),
    );
    expect(result).toBe(fakeUser);
  });

  it('finds user by email', async () => {
    const fakeUser = { user_id: 2 };
    const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
    const selectAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findByEmail('search@example.com');

    expect(selectFromMock).toHaveBeenCalledWith('User');
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

    expect(selectFromMock).toHaveBeenCalledWith('User');
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

    expect(selectFromMock).toHaveBeenCalledWith('User');
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

  it('returns empty array when finding by empty ids', async () => {
    const result = await UserModel.findByIds([]);
    expect(result).toEqual([]);
  });

  it('updates user email', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ numUpdatedRows: 1n });
    const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const setMock = jest.fn().mockReturnValue({ where: whereMock });
    updateTableMock.mockReturnValue({ set: setMock });

    await UserModel.updateEmail(1, 'new@example.com');

    expect(updateTableMock).toHaveBeenCalledWith('User');
    expect(setMock).toHaveBeenCalledWith({ email: 'new@example.com' });
    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
  });

  it('finds users with specific flag', async () => {
    const fakeUsers = [{ user_id: 1, feature_flags: ['DARK_MODE'] }];
    const executeMock = jest.fn().mockResolvedValue(fakeUsers);
    const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findUsersWithFlag('DARK_MODE');

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(result).toBe(fakeUsers);
  });

  it('finds users without specific flag', async () => {
    const fakeUsers = [{ user_id: 2, feature_flags: [] }];
    const executeMock = jest.fn().mockResolvedValue(fakeUsers);
    const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findUsersWithoutFlag('DARK_MODE');

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(result).toBe(fakeUsers);
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

  it('updates user', async () => {
    const fakeUser = { user_id: 1, username: 'updated' };
    const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
    const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
    const setMock = jest.fn().mockReturnValue({ where: whereMock });
    updateTableMock.mockReturnValue({ set: setMock });

    const result = await UserModel.update(1, { username: 'updated' });

    expect(updateTableMock).toHaveBeenCalledWith('User');
    expect(setMock).toHaveBeenCalledWith({ username: 'updated' });
    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
    expect(result).toBe(fakeUser);
  });

  it('deletes user', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 1n });
    const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    deleteFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.delete(1);

    expect(deleteFromMock).toHaveBeenCalledWith('User');
    expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
    expect(result).toBe(true);
  });

  it('returns false when deleting non-existent user', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ numDeletedRows: 0n });
    const whereMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    deleteFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.delete(999);

    expect(result).toBe(false);
  });

  it('checks if user has specific flag', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue({ user_id: 1 });
    const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock2 = jest.fn().mockReturnValue({ select: selectMock });
    const whereMock1 = jest.fn().mockReturnValue({ where: whereMock2 });
    selectFromMock.mockReturnValue({ where: whereMock1 });

    const result = await UserModel.hasFlag(1, 'DARK_MODE');

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(result).toBe(true);
  });

  it('returns false when user does not have flag', async () => {
    const executeTakeFirstMock = jest.fn().mockResolvedValue(undefined);
    const selectMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
    const whereMock2 = jest.fn().mockReturnValue({ select: selectMock });
    const whereMock1 = jest.fn().mockReturnValue({ where: whereMock2 });
    selectFromMock.mockReturnValue({ where: whereMock1 });

    const result = await UserModel.hasFlag(1, 'DARK_MODE');

    expect(result).toBe(false);
  });

  it('finds all users with a specific flag', async () => {
    const fakeUsers = [
      { user_id: 1, username: 'user1', feature_flags: ['DARK_MODE'] },
      { user_id: 2, username: 'user2', feature_flags: ['DARK_MODE', 'BETA'] },
    ];

    const executeMock = jest.fn().mockResolvedValue(fakeUsers);
    const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findUsersWithFlag('DARK_MODE');

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(result).toEqual(fakeUsers);
  });

  it('finds all users without a specific flag', async () => {
    const fakeUsers = [
      { user_id: 3, username: 'user3', feature_flags: [] },
      { user_id: 4, username: 'user4', feature_flags: ['BETA'] },
    ];

    const executeMock = jest.fn().mockResolvedValue(fakeUsers);
    const selectAllMock = jest.fn().mockReturnValue({ execute: executeMock });
    const whereMock = jest.fn().mockReturnValue({ selectAll: selectAllMock });
    selectFromMock.mockReturnValue({ where: whereMock });

    const result = await UserModel.findUsersWithoutFlag('DARK_MODE');

    expect(selectFromMock).toHaveBeenCalledWith('User');
    expect(result).toEqual(fakeUsers);
  });
});
