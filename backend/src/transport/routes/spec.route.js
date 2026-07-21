import express from 'express';
import * as telemetryController from '../controllers/telemetry.controller.js';
import * as auditController from '../../blockchain/controllers/audit.controller.js';
import * as missionController from '../controllers/mission.controller.js';

const router = express.Router();

// spec-aligned endpoints mounted directly under /api
router.post('/telemetry/ingress', telemetryController.postIngressTelemetry);
router.post('/device/register-key', telemetryController.registerDeviceKey);
router.get('/transit/active-shipments', missionController.getActiveShipments);
router.get('/audit/verify-block/:blockIndex', auditController.verifyBlock);

export default router;
