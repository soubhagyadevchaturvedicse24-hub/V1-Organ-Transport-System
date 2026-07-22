import express from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { AUDIT_PERMISSIONS } from '../../permissions/domain.permissions.js';

const router = express.Router();

router.get('/blocks', auditController.getAllBlocks);
router.get('/entity/:type/:id', auditController.getEntityHistory);
router.get('/verify', auditController.verifyLedger);
router.get('/verify-block/:blockIndex', auditController.verifyBlock);

export default router;
