jest.mock('dotenv', () => ({

  config: jest.fn(),

}));

describe('jwt.utils full branch coverage', () => {

  const originalEnv = process.env;

  beforeEach(() => {

    jest.resetModules();

    process.env = {

      ...originalEnv,
      NODE_ENV: 'test',
      JWT_SECRET: 'testjwtsecretvalue-which-is-longer-than-32chars',

    };

  });

  afterEach(() => {

    process.env = originalEnv;

  });

  it('generates and verifies a token with string expiry', () => {

    process.env.JWT_EXPIRES_IN = '1h';

    const { generateToken, verifyToken } = require('../../src/utils/jwt.utils');

    const token = generateToken({ userId: 1, email: 'user@example.com' });

    expect(typeof token).toBe('string');

    const payload = verifyToken(token);

    expect(payload).toMatchObject({ userId: 1, email: 'user@example.com' });

  });

  it('generates a token with numeric expiry', () => {

    process.env.JWT_EXPIRES_IN = '3600';

    const { generateToken } = require('../../src/utils/jwt.utils');

    const token = generateToken({ userId: 2, email: 'num@example.com' });

    expect(typeof token).toBe('string');

  });

  it('generates a token with default expiry if JWT_EXPIRES_IN undefined', () => {

    delete process.env.JWT_EXPIRES_IN;

    const { generateToken } = require('../../src/utils/jwt.utils');

    const token = generateToken({ userId: 3, email: 'default@example.com' });

    expect(typeof token).toBe('string');

  });

  it('returns null for invalid token verification', () => {

    const { verifyToken } = require('../../src/utils/jwt.utils');

    const payload = verifyToken('invalid.token');

    expect(payload).toBeNull();

  });

  it('throws if JWT secret is missing', () => {

    process.env.JWT_SECRET = '';

    expect(() => require('../../src/utils/jwt.utils')).toThrow(

      'JWT_SECRET is not defined in environment variables'

    );

  });

  it('throws for insecure secret in non-test env', () => {

    process.env.NODE_ENV = 'development';

    process.env.JWT_SECRET = 'testjwtsecret';

    expect(() => require('../../src/utils/jwt.utils')).toThrow(

      'Insecure JWT secret value detected in non-test environment'

    );

  });

  it('throws for short secret in non-test env', () => {

    process.env.NODE_ENV = 'production';

    process.env.JWT_SECRET = 'shortsecret';

    expect(() => require('../../src/utils/jwt.utils')).toThrow(

      'JWT_SECRET is too short; must be at least 32 characters for HS256'

    );

  });
  
});
