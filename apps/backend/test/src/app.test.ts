import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createApp } from '../../src/app';

describe('Logging and Error Middleware', () => {

  let app: ReturnType<typeof createApp>;

  beforeAll(() => {

    process.env.NODE_ENV = 'development';

    const mainApp = createApp();

    app = express();

    app.use(mainApp);

    app.get('/error', (_req: Request, _res: Response, next: NextFunction) => {

      next(new Error('Test error'));

    });

  });

  it('should log request method and sanitized path', async () => {

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await request(app).get('/test/path\n\rwithnewline');

    expect(consoleLogSpy).toHaveBeenCalledWith('GET /test/pathwithnewline');

    consoleLogSpy.mockRestore();
    
  });

});
