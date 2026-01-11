import { Request, Response, NextFunction } from 'express';

const sanitizeForLog = (value: unknown): string =>
  String(value).replaceAll(/[\r\n\u2028\u2029]+/g, ' ');

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  //log requests
  console.log('\n==================== API REQUEST ====================');
  console.log(`[${new Date().toISOString()}]`);
  console.log(`Method: ${sanitizeForLog(req.method)}`);
  console.log(`Path: ${sanitizeForLog(req.path)}`);
  const fullUrl = `Full URL: ${sanitizeForLog(req.protocol)}://${sanitizeForLog(
    req.get('host') || '',
  )}${sanitizeForLog(req.originalUrl)}`;
  console.log(fullUrl);
  console.log(`IP: ${sanitizeForLog(req.ip || req.socket.remoteAddress || '')}`);

  //log headers
  console.log('Headers:', {
    'content-type': sanitizeForLog(req.get('content-type') || ''),
    'user-agent': sanitizeForLog(req.get('user-agent') || ''),
    authorization: req.get('authorization') ? 'Bearer [REDACTED]' : 'None',
  });

  //log body
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = Array.isArray(req.body)
      ? [...req.body]
      : ({ ...req.body } as Record<string, unknown>);
    try {
      console.log('Body:', sanitizeForLog(JSON.stringify(sanitizedBody)));
    } catch {
      console.log('Body: [Unserializable Body]');
    }
  }

  if (req.query && Object.keys(req.query).length > 0) {
    try {
      console.log('Query:', sanitizeForLog(JSON.stringify(req.query)));
    } catch {
      console.log('Query: [Unserializable Query]');
    }
  }

  //response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    console.log('\n==================== API RESPONSE ====================');
    console.log(`[${new Date().toISOString()}]`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Duration: ${duration}ms`);

    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      const responsePreview = JSON.stringify(responseData).substring(0, 500);
      const previewWithEllipsis = responsePreview + (responsePreview.length >= 500 ? '...' : '');
      console.log('Response Preview:', sanitizeForLog(previewWithEllipsis));
    } catch {
      console.log('Response: [Non-JSON or Binary Data]');
    }

    console.log('====================================================\n');

    return originalSend.call(this, data);
  };

  next();
};

export const errorLogger = (err: any, req: Request, _res: Response, next: NextFunction) => {
  console.error('\n==================== API ERROR ====================');
  console.error(`[${new Date().toISOString()}]`);
  console.error(`Method: ${sanitizeForLog(req.method)}`);
  console.error(`Path: ${sanitizeForLog(req.path)}`);
  console.error(`Error Name: ${sanitizeForLog(err?.name || 'Error')}`);
  console.error(
    `Error Message: ${sanitizeForLog(err?.message || 'Unknown error')}`,
  );
  console.error(
    `Stack Trace: ${sanitizeForLog(err?.stack ? err.stack : 'None')}`,
  );
  console.error('====================================================\n');

  next(err);
};
