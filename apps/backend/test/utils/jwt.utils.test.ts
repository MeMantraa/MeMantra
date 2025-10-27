jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('jwt.utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test', JWT_SECRET: 'testjwtsecretvalue-which-is-longer' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('generates and verifies a token', () => {
    process.env.JWT_EXPIRES_IN = '3600';

    // eslint-disable-next-line global-require
    const { generateToken, verifyToken } = require('../../src/utils/jwt.utils');

    const token = generateToken({ userId: 1, email: 'user@example.com' });
    expect(typeof token).toBe('string');

    const payload = verifyToken(token);
    expect(payload).toMatchObject({ userId: 1, email: 'user@example.com' });
  });

  it('returns null when verification fails', () => {
    // eslint-disable-next-line global-require
    const { verifyToken } = require('../../src/utils/jwt.utils');
    const payload = verifyToken('invalid.token.value');
    expect(payload).toBeNull();
  });

  it('throws if JWT secret is missing', () => {
    process.env.JWT_SECRET = '';

    expect(() => {
      // eslint-disable-next-line global-require
      require('../../src/utils/jwt.utils');
    }).toThrow('JWT_SECRET is not defined in environment variables');
  });
});
