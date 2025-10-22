if (process.env.NODE_ENV === 'test') {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testjwtsecret';
  
  // Database test configuration
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.DB_PORT || '5432';
  process.env.DB_USER = process.env.DB_USER || 'testuser';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'testpassword';
  process.env.DB_NAME = process.env.DB_NAME || 'testdb';
  
  // Override dotenv behavior in test environment for false branch (5432)
  require('dotenv').config = () => {
    return { parsed: {} };
  };

}
