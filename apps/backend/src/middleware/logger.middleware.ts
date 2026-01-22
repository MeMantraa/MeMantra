import { Request, Response, NextFunction } from 'express';

const sanitizeForLog = (value: unknown): string =>
  String(value).replaceAll(/[\r\n\u2028\u2029]+/g, ' ');


const SENSITIVE_FIELDS = new Set([
  'password',
  'code',
  'token',
  'content',
  'message',
  'text',
  'review',
  'device',
  'google_id',
]);


const keyCache = new Map<string, boolean>();

const shouldRedactKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();

  if (keyCache.has(lowerKey)) {
    return keyCache.get(lowerKey)!;
  }

  let shouldRedact = false;
  for (const field of SENSITIVE_FIELDS) {
    if (lowerKey.includes(field)) {
      shouldRedact = true;
      break;
    }
  }

  if (keyCache.size < 1000) {
    keyCache.set(lowerKey, shouldRedact);
  }
  return shouldRedact;
};

const redactSensitiveData = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const redacted: any = Object.create(null);
    for (const [key, value] of Object.entries(data)) {
      
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      if (shouldRedactKey(key)) {
        Object.defineProperty(redacted, key, {
          value: '[REDACTED]',
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else if (value !== null && typeof value === 'object') {
        Object.defineProperty(redacted, key, {
          value: redactSensitiveData(value),
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        Object.defineProperty(redacted, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      }
    }
    return redacted;
  }

  return data;
};

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

  //log body with sensitive data redacted
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = Array.isArray(req.body)
      ? [...req.body]
      : ({ ...req.body } as Record<string, unknown>);
    try {
      const redactedBody = redactSensitiveData(sanitizedBody);
      console.log('Body:', sanitizeForLog(JSON.stringify(redactedBody)));
    } catch {
      console.log('Body: [Unserializable Body]');
    }
  }

  if (req.query && Object.keys(req.query).length > 0) {
    try {
      const redactedQuery = redactSensitiveData(req.query);
      console.log('Query:', sanitizeForLog(JSON.stringify(redactedQuery)));
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
      const redactedResponse = redactSensitiveData(responseData);
      const responsePreview = JSON.stringify(redactedResponse).substring(0, 500);
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
