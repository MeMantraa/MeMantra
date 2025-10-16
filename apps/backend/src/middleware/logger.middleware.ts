import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  //log requests
  console.log('\n==================== API REQUEST ====================');
  console.log(`[${new Date().toISOString()}]`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`IP: ${req.ip || req.socket.remoteAddress}`);
  
  //log headers
  console.log('Headers:', {
    'content-type': req.get('content-type'),
    'user-agent': req.get('user-agent'),
    'authorization': req.get('authorization') ? 'Bearer [REDACTED]' : 'None',
  });
  
  //log body
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '[REDACTED]';
    console.log('Body:', sanitizedBody);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query:', req.query);
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
      console.log('Response Preview:', responsePreview + (responsePreview.length >= 500 ? '...' : ''));
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
  console.error(`Method: ${req.method}`);
  console.error(`Path: ${req.path}`);
  console.error(`Error Name: ${err.name}`);
  console.error(`Error Message: ${err.message}`);
  console.error(`Stack Trace:`, err.stack);
  console.error('====================================================\n');
  
  next(err);
};