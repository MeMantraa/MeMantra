import express, { RequestHandler, ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';
import { requestLogger, errorLogger } from './middleware/logger.middleware';

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:19006'],
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/', limiter);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));


  if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api', apiRoutes);
  app.get('/api/v1/hello', (_req, res) => {
    res.json({ message: 'Hello from MeMantra API!' });
  });

  // 404 handler
  const notFoundHandler: RequestHandler = (req, res) => {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  };

  app.use(notFoundHandler);

  app.use(errorLogger);

  // Error handler
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  };

  app.use(errorHandler);

  return app;
};