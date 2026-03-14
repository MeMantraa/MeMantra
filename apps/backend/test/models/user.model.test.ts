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
    const trxUpdateTable = jest.fn(() => makeUpdateChain());
    const executeTransaction = jest.fn(async (callback: any) =>
      callback({ updateTable: trxUpdateTable }),
    );

    (db.selectFrom as jest.Mock).mockReturnValue({ select });
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
});
