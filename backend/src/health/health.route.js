import { Router } from 'express';
import logger from '../logger/index.js';

const router = Router();

import mongoose from 'mongoose';

router.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  
  const isMongoConnected = mongoose.connection.readyState === 1;
  
  res.status(200).json({
    status: 'Server Running',
    database: isMongoConnected ? 'Mongo Connected' : 'Mongo Disconnected',
    service: 'Organ Transport Backend',
    version: '1.0.0'
  });
});

export default router;
