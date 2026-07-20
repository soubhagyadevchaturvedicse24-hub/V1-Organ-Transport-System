import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import app from './app.js';
import logger from './logger/index.js';
import { connectDB } from './config/db.js';
import { initializeAuditSubscriber } from './blockchain/subscribers/audit.subscriber.js';

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  initializeAuditSubscriber();
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
});
