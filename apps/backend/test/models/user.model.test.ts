jest.mock('../../src/db', () => ({
  db: {
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('kysely', () => {
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => ({
    kind: 'sql',
    strings: [...strings],
    values,
  })) as any;
  sql.val = (value: unknown) => ({ kind: 'val', value });
  sql.ref = (value: string) => ({ kind: 'ref', value });
  return { sql };
});

import { db } from '../../src/db';
import { UserModel } from '../../src/models/user.model';

describe('UserModel feature flag methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false from hasFlag when no row matches', async () => {
    const executeTakeFirst = jest.fn().mockResolvedValue(undefined);
    const selectAll = jest.fn();
    const whereSecond = jest.fn(() => ({ select: selectAll }));
    const whereFirst = jest.fn(() => ({ where: whereSecond }));
    const selectFrom = jest.fn(() => ({ where: whereFirst }));
    selectAll.mockReturnValue({ executeTakeFirst });
    (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

    await expect(UserModel.hasFlag(3, 'DARK_MODE')).resolves.toBe(false);
    expect(db.selectFrom).toHaveBeenCalledWith('User');
  });

  it('returns updated row from addFlag', async () => {
    const updatedUser = { user_id: 1, feature_flags: ['DARK_MODE'] };
    const executeTakeFirst = jest.fn().mockResolvedValue(updatedUser);
    const returningAll = jest.fn(() => ({ executeTakeFirst }));
    const whereSecond = jest.fn(() => ({ returningAll }));
    const whereFirst = jest.fn(() => ({ where: whereSecond }));
    const set = jest.fn(() => ({ where: whereFirst }));
    (db.updateTable as jest.Mock).mockReturnValue({ set });

    await expect(UserModel.addFlag(1, 'DARK_MODE')).resolves.toEqual(updatedUser);
    expect(db.updateTable).toHaveBeenCalledWith('User');
  });

  it('returns updated row from removeFlag', async () => {
    const updatedUser = { user_id: 1, feature_flags: [] };
    const executeTakeFirst = jest.fn().mockResolvedValue(updatedUser);
    const returningAll = jest.fn(() => ({ executeTakeFirst }));
    const where = jest.fn(() => ({ returningAll }));
    const set = jest.fn(() => ({ where }));
    (db.updateTable as jest.Mock).mockReturnValue({ set });

    await expect(UserModel.removeFlag(1, 'DARK_MODE')).resolves.toEqual(updatedUser);
  });

  it('returns updated row from setFlags', async () => {
    const updatedUser = { user_id: 7, feature_flags: ['DARK_MODE', 'ADVANCED_ANALYTICS'] };
    const executeTakeFirst = jest.fn().mockResolvedValue(updatedUser);
    const returningAll = jest.fn(() => ({ executeTakeFirst }));
    const where = jest.fn(() => ({ returningAll }));
    const set = jest.fn(() => ({ where }));
    (db.updateTable as jest.Mock).mockReturnValue({ set });

    await expect(UserModel.setFlags(7, ['DARK_MODE', 'ADVANCED_ANALYTICS'])).resolves.toEqual(
      updatedUser,
    );
  });

  it('returns users from findUsersWithFlag', async () => {
    const users = [{ user_id: 1 }, { user_id: 2 }];
    const execute = jest.fn().mockResolvedValue(users);
    const selectAll = jest.fn(() => ({ execute }));
    const where = jest.fn(() => ({ selectAll }));
    (db.selectFrom as jest.Mock).mockReturnValue({ where });

    await expect(UserModel.findUsersWithFlag('DARK_MODE')).resolves.toEqual(users);
  });

  it('returns users from findUsersWithoutFlag', async () => {
    const users = [{ user_id: 3 }];
    const execute = jest.fn().mockResolvedValue(users);
    const selectAll = jest.fn(() => ({ execute }));
    const where = jest.fn(() => ({ selectAll }));
    (db.selectFrom as jest.Mock).mockReturnValue({ where });

    await expect(UserModel.findUsersWithoutFlag('DARK_MODE')).resolves.toEqual(users);
  });

  it('returns affected count when enabling a flag for all users', async () => {
    const executeTakeFirst = jest.fn().mockResolvedValue({ numUpdatedRows: 5 });
    const where = jest.fn(() => ({ executeTakeFirst }));
    const set = jest.fn(() => ({ where }));
    (db.updateTable as jest.Mock).mockReturnValue({ set });

    await expect(UserModel.enableFlagForAllUsers('DARK_MODE')).resolves.toBe(5);
  });

  it('returns affected count when disabling a flag for all users', async () => {
    const executeTakeFirst = jest.fn().mockResolvedValue({ numUpdatedRows: 2 });
    const where = jest.fn(() => ({ executeTakeFirst }));
    const set = jest.fn(() => ({ where }));
    (db.updateTable as jest.Mock).mockReturnValue({ set });

    await expect(UserModel.disableFlagForAllUsers('DARK_MODE')).resolves.toBe(2);
  });

  it('short-circuits rollout when there are no users', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const select = jest.fn(() => ({ execute }));
    (db.selectFrom as jest.Mock).mockReturnValue({ select });

    await expect(UserModel.rolloutFlagToPercentage('DARK_MODE', 10)).resolves.toEqual({
      totalUsers: 0,
      selectedUsers: 0,
    });
  });

  it('rolls out to a deterministic subset of users', async () => {
    const users = [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }];
    const selectExecute = jest.fn().mockResolvedValue(users);
    const select = jest.fn(() => ({ execute: selectExecute }));

    const makeUpdateChain = () => {
      const executeTakeFirst = jest.fn().mockResolvedValue({});
      const secondWhere = jest.fn(() => ({ executeTakeFirst }));
      const firstWhere = jest.fn((...args: unknown[]) => {
        if (args.length === 1) {
          return { executeTakeFirst };
        }
        return { where: secondWhere };
      });
      const set = jest.fn(() => ({ where: firstWhere }));
      return { set };
    };
    const updateTable = jest.fn(() => makeUpdateChain());
    const trxUpdateTable = jest.fn(() => makeUpdateChain());
    const executeTransaction = jest.fn(async (callback: any) =>
      callback({ updateTable: trxUpdateTable }),
    );

    (db.selectFrom as jest.Mock).mockReturnValue({ select });
    (db.updateTable as jest.Mock).mockImplementation(updateTable);
    (db.transaction as jest.Mock).mockReturnValue({ execute: executeTransaction });

    const result = await UserModel.rolloutFlagToPercentage('DARK_MODE', 50);

    expect(result.totalUsers).toBe(3);
    expect(result.selectedUsers).toBeGreaterThanOrEqual(0);
    expect(result.selectedUsers).toBeLessThanOrEqual(3);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('sets an exact rollout to a deterministic subset of users', async () => {
    const users = [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }];
    const selectExecute = jest.fn().mockResolvedValue(users);
    const select = jest.fn(() => ({ execute: selectExecute }));

    const makeUpdateChain = () => {
      const executeTakeFirst = jest.fn().mockResolvedValue({});
      const secondWhere = jest.fn(() => ({ executeTakeFirst }));
      const firstWhere = jest.fn((...args: unknown[]) => {
        if (args.length === 1) {
          return { executeTakeFirst };
        }
        return { where: secondWhere };
      });
      const set = jest.fn(() => ({ where: firstWhere }));
      return { set };
    };
    const trxUpdateTable = jest.fn(() => makeUpdateChain());
    const executeTransaction = jest.fn(async (callback: any) =>
      callback({ updateTable: trxUpdateTable }),
    );

    (db.selectFrom as jest.Mock).mockReturnValue({ select });
    (db.transaction as jest.Mock).mockReturnValue({ execute: executeTransaction });

    const result = await UserModel.setExactFlagRolloutToPercentage('DARK_MODE', 50);

    expect(result.totalUsers).toBe(3);
    expect(result.selectedUsers).toBeGreaterThanOrEqual(0);
    expect(result.selectedUsers).toBeLessThanOrEqual(3);
    expect(db.transaction).toHaveBeenCalled();
  });

  describe('updateProfilePhoto', () => {
    it('should update user profile photo', async () => {
      const photoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      const fakeUser = { user_id: 1, username: 'testuser', profile_photo: photoBase64 };
      const executeTakeFirstMock = jest.fn().mockResolvedValue(fakeUser);
      const returningAllMock = jest.fn().mockReturnValue({ executeTakeFirst: executeTakeFirstMock });
      const whereMock = jest.fn().mockReturnValue({ returningAll: returningAllMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.updateTable as jest.Mock).mockReturnValue({ set: setMock });

      const result = await UserModel.updateProfilePhoto(1, photoBase64);

      expect(db.updateTable).toHaveBeenCalledWith('User');
      expect(setMock).toHaveBeenCalledWith({ profile_photo: photoBase64 });
      expect(whereMock).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(fakeUser);
    });
  });

  describe('Basic CRUD methods', () => {
    describe('create', () => {
      it('should create a new user with hashed password', async () => {
        const userData = {
          username: 'newuser',
          email: 'new@test.com',
          password: 'password123',
        };
        const fakeUser = {
          user_id: 1,
          username: 'newuser',
          email: 'new@test.com',
          password_hash: 'hashed_password',
          feature_flags: [],
        };
        const executeTakeFirstOrThrow = jest.fn().mockResolvedValue(fakeUser);
        const returningAll = jest.fn().mockReturnValue({ executeTakeFirstOrThrow });
        const values = jest.fn().mockReturnValue({ returningAll });
        const insertInto = jest.fn().mockReturnValue({ values });
        (db.insertInto as jest.Mock) = insertInto;

        const result = await UserModel.create(userData);

        expect(result).toBe(fakeUser);
      });
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const fakeUser = { user_id: 1, email: 'test@test.com', username: 'testuser' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const selectAll = jest.fn().mockReturnValue({ executeTakeFirst });
        const where = jest.fn().mockReturnValue({ selectAll });
        const selectFrom = jest.fn().mockReturnValue({ where });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findByEmail('test@test.com');

        expect(result).toBe(fakeUser);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });
    });

    describe('findByUsername', () => {
      it('should find user by username', async () => {
        const fakeUser = { user_id: 1, email: 'test@test.com', username: 'testuser' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const selectAll = jest.fn().mockReturnValue({ executeTakeFirst });
        const where = jest.fn().mockReturnValue({ selectAll });
        const selectFrom = jest.fn().mockReturnValue({ where });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findByUsername('testuser');

        expect(result).toBe(fakeUser);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });
    });

    describe('findById', () => {
      it('should find user by id', async () => {
        const fakeUser = { user_id: 1, email: 'test@test.com', username: 'testuser' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const selectAll = jest.fn().mockReturnValue({ executeTakeFirst });
        const where = jest.fn().mockReturnValue({ selectAll });
        const selectFrom = jest.fn().mockReturnValue({ where });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findById(1);

        expect(result).toBe(fakeUser);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });
    });

    describe('findByIds', () => {
      it('should find users by multiple ids', async () => {
        const fakeUsers = [
          { user_id: 1, email: 'test1@test.com', username: 'user1' },
          { user_id: 2, email: 'test2@test.com', username: 'user2' },
        ];
        const execute = jest.fn().mockResolvedValue(fakeUsers);
        const selectAll = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ selectAll });
        const selectFrom = jest.fn().mockReturnValue({ where });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findByIds([1, 2]);

        expect(result).toBe(fakeUsers);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });

      it('should return empty array for empty ids', async () => {
        const result = await UserModel.findByIds([]);
        expect(result).toEqual([]);
      });
    });

    describe('findAll', () => {
      it('should find all users', async () => {
        const fakeUsers = [
          { user_id: 1, email: 'test1@test.com', username: 'user1' },
          { user_id: 2, email: 'test2@test.com', username: 'user2' },
        ];
        const execute = jest.fn().mockResolvedValue(fakeUsers);
        const orderBy = jest.fn().mockReturnValue({ execute });
        const selectAll = jest.fn().mockReturnValue({ orderBy });
        const selectFrom = jest.fn().mockReturnValue({ selectAll });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findAll();

        expect(result).toBe(fakeUsers);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });
    });

    describe('update', () => {
      it('should update user', async () => {
        const fakeUser = { user_id: 1, email: 'updated@test.com', username: 'testuser' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const returningAll = jest.fn().mockReturnValue({ executeTakeFirst });
        const where = jest.fn().mockReturnValue({ returningAll });
        const set = jest.fn().mockReturnValue({ where });
        (db.updateTable as jest.Mock).mockReturnValue({ set });

        const result = await UserModel.update(1, { email: 'updated@test.com' });

        expect(result).toBe(fakeUser);
        expect(db.updateTable).toHaveBeenCalledWith('User');
      });
    });

    describe('delete', () => {
      it('should delete user and return true', async () => {
        const executeTakeFirst = jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) });
        const where = jest.fn().mockReturnValue({ executeTakeFirst });
        const deleteFrom = jest.fn().mockReturnValue({ where });
        (db.deleteFrom as jest.Mock) = deleteFrom;

        const result = await UserModel.delete(1);

        expect(result).toBe(true);
      });

      it('should return false when user not found', async () => {
        const executeTakeFirst = jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) });
        const where = jest.fn().mockReturnValue({ executeTakeFirst });
        const deleteFrom = jest.fn().mockReturnValue({ where });
        (db.deleteFrom as jest.Mock) = deleteFrom;

        const result = await UserModel.delete(999);

        expect(result).toBe(false);
      });
    });

    describe('updateEmail', () => {
      it('should update user email', async () => {
        const fakeUser = { user_id: 1, email: 'new@test.com' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const where = jest.fn().mockReturnValue({ executeTakeFirst });
        const set = jest.fn().mockReturnValue({ where });
        (db.updateTable as jest.Mock).mockReturnValue({ set });

        const result = await UserModel.updateEmail(1, 'new@test.com');

        expect(result).toBe(fakeUser);
        expect(db.updateTable).toHaveBeenCalledWith('User');
      });
    });

    describe('clearDeviceToken', () => {
      it('should clear device token', async () => {
        const execute = jest.fn().mockResolvedValue(undefined);
        const where = jest.fn().mockReturnValue({ execute });
        const set = jest.fn().mockReturnValue({ where });
        (db.updateTable as jest.Mock).mockReturnValue({ set });

        await UserModel.clearDeviceToken(1);

        expect(db.updateTable).toHaveBeenCalledWith('User');
        expect(set).toHaveBeenCalledWith({ device_token: null });
      });
    });

    describe('findByDeviceToken', () => {
      it('should find user by device token', async () => {
        const fakeUser = { user_id: 1, device_token: 'token123' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const selectAll = jest.fn().mockReturnValue({ executeTakeFirst });
        const where = jest.fn().mockReturnValue({ selectAll });
        const selectFrom = jest.fn().mockReturnValue({ where });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findByDeviceToken('token123');

        expect(result).toBe(fakeUser);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });
    });

    describe('findAllWithDeviceTokens', () => {
      it('should find all users with device tokens', async () => {
        const fakeUsers = [
          { user_id: 1, device_token: 'token1' },
          { user_id: 2, device_token: 'token2' },
        ];
        const execute = jest.fn().mockResolvedValue(fakeUsers);
        const selectAll = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ selectAll });
        const selectFrom = jest.fn().mockReturnValue({ where });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.findAllWithDeviceTokens();

        expect(result).toBe(fakeUsers);
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });
    });

    describe('updateTheme', () => {
      it('should update user theme', async () => {
        const fakeUser = { user_id: 1, theme: 'dark' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const returningAll = jest.fn().mockReturnValue({ executeTakeFirst });
        const where = jest.fn().mockReturnValue({ returningAll });
        const set = jest.fn().mockReturnValue({ where });
        (db.updateTable as jest.Mock).mockReturnValue({ set });

        const result = await UserModel.updateTheme(1, 'dark');

        expect(result).toBe(fakeUser);
        expect(db.updateTable).toHaveBeenCalledWith('User');
      });
    });

    describe('getTheme', () => {
      it('should get user theme', async () => {
        const fakeUser = { user_id: 1, theme: 'dark' };
        const executeTakeFirst = jest.fn().mockResolvedValue(fakeUser);
        const where = jest.fn().mockReturnValue({ executeTakeFirst });
        const select = jest.fn().mockReturnValue({ where });
        const selectFrom = jest.fn().mockReturnValue({ select });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.getTheme(1);

        expect(result).toBe('dark');
        expect(db.selectFrom).toHaveBeenCalledWith('User');
      });

      it('should return default when user not found', async () => {
        const executeTakeFirst = jest.fn().mockResolvedValue(undefined);
        const where = jest.fn().mockReturnValue({ executeTakeFirst });
        const select = jest.fn().mockReturnValue({ where });
        const selectFrom = jest.fn().mockReturnValue({ select });
        (db.selectFrom as jest.Mock).mockImplementation(selectFrom);

        const result = await UserModel.getTheme(999);

        expect(result).toBe('default');
      });
    });
  });
});
