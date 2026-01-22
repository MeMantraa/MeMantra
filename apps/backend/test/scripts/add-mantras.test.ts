import { db } from '../../src/db';
import { UserModel } from '../../src/models/user.model';
import { MantraModel } from '../../src/models/mantra.model';

jest.mock('../../src/db', () => ({
  db: {
    selectFrom: jest.fn(),
  },
}));

jest.mock('../../src/models/user.model', () => ({
  UserModel: {
    findByEmail: jest.fn(),
  },
}));

jest.mock('../../src/models/mantra.model', () => ({
  MantraModel: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('addMantras script', () => {
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = { 
      ...originalEnv, 
      SEED_ADMIN_EMAIL: 'admin@memantra.com'
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

  it('should successfully add all new mantras when none exist', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    const mockMantras = [
      { mantra_id: 1, title: 'Pressure Is a Privilege' },
      { mantra_id: 2, title: "Sometimes it's better to pay for parking" },
      { mantra_id: 3, title: 'Give people an excuse that has nothing to do with you' },
      { mantra_id: 4, title: 'I am healthy, my favourite people are healthy. Inhale deep. Exhale slow.' },
      { mantra_id: 5, title: 'When life feels good, take a deep breath and notice something - get absorbed in the feelings and emotions that come up' },
    ];

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    // Mock db.selectFrom for checking existing mantras (returns null = new mantra)
    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(null), // No existing mantra
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    // Mock MantraModel.create for each new mantra
    (MantraModel.create as jest.Mock)
      .mockResolvedValueOnce(mockMantras[1]) // First new mantra
      .mockResolvedValueOnce(mockMantras[2]) // Second new mantra
      .mockResolvedValueOnce(mockMantras[3]) // Third new mantra
      .mockResolvedValueOnce(mockMantras[4]); // Fourth new mantra

    // Mock MantraModel.findAll for verification
    (MantraModel.findAll as jest.Mock).mockResolvedValue(mockMantras);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(UserModel.findByEmail).toHaveBeenCalledWith('admin@memantra.com');
    expect(MantraModel.create).toHaveBeenCalledTimes(4);
    expect(MantraModel.findAll).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should skip mantras that already exist (duplicate protection)', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    const existingMantra = { 
      mantra_id: 2, 
      title: "Sometimes it's better to pay for parking" 
    };

    const newMantra = { 
      mantra_id: 3, 
      title: 'Give people an excuse that has nothing to do with you' 
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    // Mock db.selectFrom - first mantra exists, others don't
    let callCount = 0;
    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        callCount++;
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(
            callCount === 1 ? existingMantra : null // First exists, others don't
          ),
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    // Only 3 new mantras should be created (1 skipped)
    (MantraModel.create as jest.Mock)
      .mockResolvedValueOnce(newMantra)
      .mockResolvedValueOnce({ mantra_id: 4, title: 'I am healthy...' })
      .mockResolvedValueOnce({ mantra_id: 5, title: 'When life feels good...' });

    (MantraModel.findAll as jest.Mock).mockResolvedValue([
      { mantra_id: 1, title: 'Pressure Is a Privilege' },
      existingMantra,
      newMantra,
    ]);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(MantraModel.create).toHaveBeenCalledTimes(3); // Only 3 created, 1 skipped
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle all mantras already existing (all skipped)', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    const existingMantras = [
      { mantra_id: 2, title: "Sometimes it's better to pay for parking" },
      { mantra_id: 3, title: 'Give people an excuse that has nothing to do with you' },
      { mantra_id: 4, title: 'I am healthy, my favourite people are healthy. Inhale deep. Exhale slow.' },
      { mantra_id: 5, title: 'When life feels good, take a deep breath and notice something - get absorbed in the feelings and emotions that come up' },
    ];

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    // All mantras already exist
    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(existingMantras[0]), // All exist
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    (MantraModel.findAll as jest.Mock).mockResolvedValue([
      { mantra_id: 1, title: 'Pressure Is a Privilege' },
      ...existingMantras,
    ]);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(MantraModel.create).not.toHaveBeenCalled(); // No new mantras created
    expect(MantraModel.findAll).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should throw error and exit with code 1 if admin not found', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Script failed with error:')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should use default admin email when SEED_ADMIN_EMAIL not set', async () => {
    delete process.env.SEED_ADMIN_EMAIL;

    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(null),
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    (MantraModel.create as jest.Mock).mockResolvedValue({ mantra_id: 2, title: 'Test' });
    (MantraModel.findAll as jest.Mock).mockResolvedValue([{ mantra_id: 1, title: 'Test' }]);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(UserModel.findByEmail).toHaveBeenCalledWith('admin@memantra.com'); // Default email
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle database errors during mantra creation', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Script failed with error:')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle errors during MantraModel.create', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(null), // New mantra
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);
    (MantraModel.create as jest.Mock).mockRejectedValue(new Error('Failed to create mantra'));

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Script failed with error:')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should verify and display all mantras after processing', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    const allMantras = [
      { mantra_id: 1, title: 'Pressure Is a Privilege' },
      { mantra_id: 2, title: "Sometimes it's better to pay for parking" },
      { mantra_id: 3, title: 'Give people an excuse that has nothing to do with you' },
    ];

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(null),
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    (MantraModel.create as jest.Mock).mockResolvedValue({ mantra_id: 2, title: 'Test' });
    (MantraModel.findAll as jest.Mock).mockResolvedValue(allMantras);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(MantraModel.findAll).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Current mantras in database:')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should correctly map all mantra fields when creating', async () => {
    const mockAdmin = { 
      user_id: 1, 
      username: 'admin',
      email: 'admin@memantra.com' 
    };

    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockAdmin);

    const mockSelectFrom = jest.fn((table: string) => {
      if (table === 'Mantra') {
        return {
          where: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue(null),
        };
      }
      return {} as any;
    });

    (db.selectFrom as jest.Mock).mockImplementation(mockSelectFrom);

    const createdMantra = {
      mantra_id: 2,
      title: "Sometimes it's better to pay for parking",
      key_takeaway: 'Test takeaway',
      background_author: null,
      background_description: null,
      jamie_take: 'Test jamie take',
      when_where: 'Test when where',
      negative_thoughts: 'Test negative thoughts',
      cbt_principles: 'Test CBT principles',
      references: 'Test references',
      created_by: 1,
      is_active: true,
    };

    (MantraModel.create as jest.Mock).mockResolvedValue(createdMantra);
    (MantraModel.findAll as jest.Mock).mockResolvedValue([createdMantra]);

    const { addMantras } = await import('../../src/scripts/add-mantras');
    await addMantras();

    expect(MantraModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        key_takeaway: expect.any(String),
        background_author: null,
        background_description: null,
        jamie_take: expect.any(String),
        when_where: expect.any(String),
        negative_thoughts: expect.any(String),
        cbt_principles: expect.any(String),
        references: expect.any(String),
        created_by: mockAdmin.user_id,
        is_active: true,
      })
    );
  });
});

