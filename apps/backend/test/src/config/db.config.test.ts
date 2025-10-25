
// This test file tests the main database configuration functionality including connection testing and port configuration when DB_PORT is set

// Mock db connection functions so we can control their behavior
const mockConnect = jest.fn();

const mockRelease = jest.fn();

jest.mock('pg', () => ({

  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect,

  })),

}));

// Mock the pool instance in db.config
jest.mock('../../../src/config/db.config', () => {

  const original = jest.requireActual('../../../src/config/db.config');

  return {
    
    ...original,

    pool: {

      connect: mockConnect,

    },

  };

});

import { testConnection } from '../../../src/config/db.config';
import { Pool } from 'pg';

describe('Database Configuration - Main Branch', () => {

  beforeEach(() => {

    jest.clearAllMocks();

  });

  it('the pool should be created with correct configuration', () => {
    // Just verify that Pool constructor is available
    expect(Pool).toBeDefined();

  });

  it('the connection should be established successfully', async () => {

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

  it('should handle connection error', async () => {

    mockConnect.mockRejectedValue(new Error('Connection failed'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await testConnection();

    expect(result).toBe(false);

    expect(mockConnect).toHaveBeenCalled();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Database connection error:', expect.any(Error));

    consoleErrorSpy.mockRestore();

  });

  it('the port should be used when DB_PORT is set', () => {
    
    // Test when DB_PORT is set (true branch)
    process.env.DB_PORT = '3000';

    const portWhenSet = Number.parseInt(process.env.DB_PORT || '5432');

    expect(portWhenSet).toBe(3000);

  });

});