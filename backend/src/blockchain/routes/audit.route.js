import express from 'express';
import * as auditController from '../controllers/audit.controller.js';

const router = express.Router();

// Public readable routes for frontend audit page
router.get('/blocks', auditController.getAllBlocks);
router.get('/entity/:type/:id', auditController.getEntityHistory);
router.get('/verify', auditController.verifyLedger);
router.get('/verify-block/:blockIndex', auditController.verifyBlock);

// Direct block write (device-auth – used by IoT simulator sequential flow)
router.post('/notarize', auditController.notarizeBlock);

export default router;
