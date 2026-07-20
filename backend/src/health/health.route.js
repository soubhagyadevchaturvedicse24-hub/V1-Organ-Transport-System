import { Router } from 'express';
import logger from '../logger/index.js';

const router = Router();

router.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({
    status: 'UP',
    service: 'Organ Transport Backend',
    version: '1.0.0'
  });
});

export default router;
