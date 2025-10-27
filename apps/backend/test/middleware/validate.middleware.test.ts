import { z, ZodSchema } from 'zod';
import { validateRequest } from '../../src/middleware/validate.middleware';

describe('validate.middleware', () => {
  const createRes = () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    return {
      status,
      json,
    };
  };

  const baseReq = {
    params: {},
    query: {},
  };

  it('calls next when validation succeeds', async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
      query: z.any(),
      params: z.any(),
    });

    const req = {
      ...baseReq,
      body: { email: 'user@example.com' },
    };

    const res = createRes();
    const next = jest.fn();

    const middleware = validateRequest(schema);
    await middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with validation details on ZodError', async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
      query: z.any(),
      params: z.any(),
    });

    const req = {
      ...baseReq,
      body: { email: 'not-an-email' },
    };

    const res = createRes();
    const next = jest.fn();

    const middleware = validateRequest(schema);
    await middleware(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Validation failed',
        errors: expect.any(Array),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when schema throws non-Zod error', async () => {
    const schema = {
      parseAsync: jest.fn().mockRejectedValue(new Error('unexpected')),
    } as unknown as ZodSchema;

    const req = {
      ...baseReq,
      body: {},
    };

    const res = createRes();
    const next = jest.fn();

    const middleware = validateRequest(schema);
    await middleware(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Internal server error during validation',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
