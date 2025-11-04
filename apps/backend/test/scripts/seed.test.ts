import { db } from '../../src/db';
import { UserModel } from '../../src/models/user.model';
import { MantraModel } from '../../src/models/mantra.model';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
  },
}));

jest.mock('../../src/models/user.model', () => ({
  UserModel: {
    findByEmail: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/models/mantra.model', () => ({
  MantraModel: {
    create: jest.fn(),
    search: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('seedDatabase script', () => {
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = { 
      ...originalEnv, 
      SEED_ADMIN_PASSWORD: 'TestPassword123!' 
    };
    
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
    }) as any);
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should use existing admin and existing mantra', async () => {
    const mockAdmin = { user_id: 1, email: 'admin@memantra.com' };
    const mockMantra = { 
      mantra_id: 100, 
      title: 'Pressure Is a Privilege', 
      background_author: 'Billy Jean King' 
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);
    (MantraModel.search as jest.Mock).mockResolvedValue([mockMantra]);
    (MantraModel.findById as jest.Mock).mockResolvedValue(mockMantra);
    (MantraModel.findAll as jest.Mock).mockResolvedValue([mockMantra]);

    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(mockMantra),
          select: jest.fn().mockReturnThis(),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '1' }),
      };
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    const { seedDatabase } = await import('../../src/scripts/seed');
    await seedDatabase();

    expect(UserModel.findByEmail).toHaveBeenCalledWith('admin@memantra.com');
    expect(MantraModel.findAll).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should create new admin and new mantra if not existing', async () => {
    const mockAdmin = { user_id: 10, email: 'admin@memantra.com', username: 'admin' };
    const mockMantra = { 
      mantra_id: 200, 
      title: 'Pressure Is a Privilege',
      background_author: 'Billy Jean King',
      is_active: true
    };

    const mockInsertChain = {
      values: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
    (UserModel.create as jest.Mock).mockResolvedValue(mockAdmin);
    (db.insertInto as jest.Mock).mockReturnValue(mockInsertChain);
    
    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(null),
          select: jest.fn().mockReturnThis(),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '1' }),
      };
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);
    (MantraModel.create as jest.Mock).mockResolvedValue(mockMantra);
    (MantraModel.search as jest.Mock).mockResolvedValue([mockMantra]);
    (MantraModel.findById as jest.Mock).mockResolvedValue(mockMantra);
    (MantraModel.findAll as jest.Mock).mockResolvedValue([mockMantra]);

    const { seedDatabase } = await import('../../src/scripts/seed');
    await seedDatabase();

    expect(UserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'admin',
        email: 'admin@memantra.com',
        password: 'TestPassword123!',
      })
    );
    expect(db.insertInto).toHaveBeenCalledWith('Admin');
    expect(MantraModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pressure Is a Privilege',
        created_by: mockAdmin.user_id,
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle errors and exit with code 1', async () => {
    (UserModel.findByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { seedDatabase } = await import('../../src/scripts/seed');
    await seedDatabase();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Seed failed with error:'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should throw error if SEED_ADMIN_PASSWORD is not set', async () => {
    delete process.env.SEED_ADMIN_PASSWORD;

    const { seedDatabase } = await import('../../src/scripts/seed');
    await seedDatabase();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});