import jwt, { Algorithm, SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
if (NODE_ENV !== 'test' && JWT_SECRET === 'testjwtsecret') {
  throw new Error('Insecure JWT secret value detected in non-test environment');
}
if (NODE_ENV !== 'test' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is too short; must be at least 32 characters for HS256');
}

export interface TokenPayload {
  userId: number;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const algorithm: Algorithm = 'HS256';

  const envExpires = process.env.JWT_EXPIRES_IN;
  const resolvedExpires: SignOptions['expiresIn'] = envExpires
    ? Number.isFinite(Number(envExpires))
      ? Number(envExpires)
      : (envExpires as unknown as SignOptions['expiresIn'])
    : ('1d' as unknown as SignOptions['expiresIn']);

  return jwt.sign(payload, JWT_SECRET as Secret, {
    expiresIn: resolvedExpires,
    algorithm,
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as Secret, { algorithms: ['HS256'] });
    return decoded as TokenPayload;
  } catch (error) {
    return null;
  }
};
