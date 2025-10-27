jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const insertIntoMock = jest.fn();
const selectFromMock = jest.fn();

jest.mock('../../src/db', () => ({
  db: {
    insertInto: insertIntoMock,
    selectFrom: selectFromMock,
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
});
