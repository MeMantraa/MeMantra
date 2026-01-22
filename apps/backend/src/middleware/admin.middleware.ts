import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || 'admin@memantra.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
);

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Get user from database
    const user = await db
      .selectFrom('User')
      .where('user_id', '=', userId)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if user email is in admin list using Set.has()
    const isAdmin = user.email && ADMIN_EMAILS.has(user.email.toLowerCase());

    if (!isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
      });
    }

    // User is admin, continue
    return next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error verifying admin status',
    });
  }
};