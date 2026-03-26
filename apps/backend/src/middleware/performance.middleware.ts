import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../services/performance-monitor.service';

export const requestPerformanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const requestId = String(req.headers['x-request-id'] || randomUUID());
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const route = req.originalUrl.split('?')[0];
    const method = req.method;
    const statusCode = res.statusCode;

    PerformanceMonitor.trackEvent({
      kind: 'api_request',
      name: `${method} ${route}`,
      duration_ms: durationMs,
      status: statusCode >= 400 ? 'error' : 'success',
      source: 'backend',
      route,
      method,
      request_id: requestId,
      metadata: {
        status_code: statusCode,
      },
    });
  });

  next();
};
