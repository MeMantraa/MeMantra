import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.config';
import routes from './routes';
import { requestLogger, errorLogger } from './middleware/logger.middleware';

//load .env
dotenv.config();

//start express
const app: Express = express();
const PORT = process.env.PORT || 4000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//request logger 
app.use(requestLogger);

//routes
app.use('/api', routes);

//health check on the route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

//error logger
app.use(errorLogger);

//start server
const startServer = async () => {
  try {
    //test the db connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to the database');
    }
    
    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log('====================================================\n');
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();