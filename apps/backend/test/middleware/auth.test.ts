import { authenticate } from '../../src/middleware/auth.middleware';
import { verifyToken } from '../../src/utils/jwt.utils';
import { Request, Response, NextFunction } from 'express';

// Mock verifyToken so we can control its behavior
jest.mock('../../src/utils/jwt.utils');

describe('Authentication middleware', () => {

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {

    req = { headers: {} } ;

    res = { 
        status: jest.fn().mockReturnThis(),
        json: jest.fn() 
    };

    next = jest.fn();

    jest.clearAllMocks();

});

it("when there is no autorization header, it should return 401", async () => {

    await authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    
    expect(res.json).toHaveBeenCalledWith({ 
      status: 'error',
      message: 'Authentication required' 
    });
    
    expect(next).not.toHaveBeenCalled();

});

it("when the token is invalid, it should return 401", async () => {

    req.headers =  { authorization: 'Bearer invalidtoken' };

    (verifyToken as jest.Mock).mockReturnValue(null);
    
    await authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid or expired token',
    });

    expect(next).not.toHaveBeenCalled();

  });

  it("if token is valid it should call next() and attach user", async () => {

    req.headers = { authorization: 'Bearer validtoken' };

    const decoded = { userId: 1, email: 'memantra@memantra.com' };

    (verifyToken as jest.Mock).mockReturnValue(decoded);

    await authenticate(req as Request, res as Response, next);

    expect(req.user).toEqual(decoded);

    expect(next).toHaveBeenCalled();

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();

  });

});