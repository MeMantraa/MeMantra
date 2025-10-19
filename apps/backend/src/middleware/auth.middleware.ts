//auth middleware
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }
    
    // Attach user info to the request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    return next();
  } catch (_error) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};