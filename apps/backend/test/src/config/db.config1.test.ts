// This test file specifically tests the default port scenario by not setting DB_PORT in the environment

// Override setupEnv behavior for this specific test
process.env.NODE_ENV = 'test';

const mockConnect = jest.fn();

const mockPoolConstructor = jest.fn().mockImplementation(() => ({

  connect: mockConnect,

}));

jest.mock('pg', () => ({

  Pool: mockPoolConstructor,

}));

// Delete DB_PORT before importing to ensure the default branch is tested
delete process.env.DB_PORT;

import { testConnection } from '../../../src/config/db.config';

describe('Database Configuration - 5432 Branch', () => {

  it('should use default port 5432 when DB_PORT is not set', () => {
    // Test the default port logic when DB_PORT is not available
    const portWhenNotSet = Number.parseInt(process.env.DB_PORT || '5432');

    expect(portWhenNotSet).toBe(5432);
    
    // Verify the Pool constructor was called with default port
    expect(mockPoolConstructor).toHaveBeenCalledWith(

      expect.objectContaining({

        port: 5432

      })

    );

  });

  it('should test connection with default configuration', async () => {

    const mockRelease = jest.fn();

    mockConnect.mockResolvedValue({

      release: mockRelease,

    });

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await testConnection();

    expect(result).toBe(true);

    expect(mockConnect).toHaveBeenCalled();

    expect(mockRelease).toHaveBeenCalled();

    expect(consoleLogSpy).toHaveBeenCalledWith('Successfully connected to the database');

    consoleLogSpy.mockRestore();

  });

});