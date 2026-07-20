import express from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { requireDeviceAuth } from '../../middleware/requireDeviceAuth.js';

const router = express.Router();

// Device route uses custom authentication, not JWT
router.use(requireDeviceAuth);

router.post('/telemetry', deviceController.postTelemetry);

export default router;
