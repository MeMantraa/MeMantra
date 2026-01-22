// Mock db.selectFrom().where().selectAll().executeTakeFirst()
const executeTakeFirst = jest.fn();
const mockDb = {
  selectFrom: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  selectAll: jest.fn().mockReturnThis(),
  executeTakeFirst,
};

jest.mock('../../src/db', () => ({
  db: mockDb,
}));

import { requireAdmin } from '../../src/middleware/admin.middleware';
import { Request, Response, NextFunction } from 'express';



describe('Admin middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { user: undefined };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    executeTakeFirst.mockReset();
    mockDb.selectFrom.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.selectAll.mockReturnThis();
    process.env.ADMIN_EMAILS = 'admin@memantra.com,super@admin.com';
  });

  it('should return 401 if not authenticated', async () => {
    await requireAdmin(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user not found in database', async () => {
    req.user = { userId: 42, email: 'test@example.com' };
    executeTakeFirst.mockResolvedValue(null);

    await requireAdmin(req as Request, res as Response, next);

    expect(mockDb.selectFrom).toHaveBeenCalledWith('User');
    expect(mockDb.where).toHaveBeenCalledWith('user_id', '=', 42);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'User not found',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not admin', async () => {
    req.user = { userId: 7, email: 'user@regular.com' };
    executeTakeFirst.mockResolvedValue({
      user_id: 7,
      email: 'user@regular.com',
    });
    await requireAdmin(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Admin access required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user email is in ADMIN_EMAILS', async () => {
    req.user = { userId: 1, email: 'admin@memantra.com' };
    executeTakeFirst.mockResolvedValue({
      user_id: 1,
      email: 'admin@memantra.com',
    });

    await requireAdmin(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });



  it('should handle db errors and return 500', async () => {
    req.user = { userId: 15, email: 'test@example.com' };
    executeTakeFirst.mockRejectedValue(new Error('DB error!'));

    // Suppress console.error in the test output
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await requireAdmin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error verifying admin status',
    });
    expect(next).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith('Admin check error:', expect.any(Error));
    errSpy.mockRestore();
  });

  it('should treat missing email as not admin', async () => {
    req.user = { userId: 8, email: 'test@example.com' };
    executeTakeFirst.mockResolvedValue({
      user_id: 8,
      email: undefined,
    });
    await requireAdmin(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Admin access required',
    });
    expect(next).not.toHaveBeenCalled();
  });
});