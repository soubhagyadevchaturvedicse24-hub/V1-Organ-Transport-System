import express from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { AUDIT_PERMISSIONS } from '../../permissions/domain.permissions.js';

const router = express.Router();

// All audit routes require authentication and AUDIT_PERMISSIONS.VIEW
router.use(requireAuth);
router.use(requirePermission(AUDIT_PERMISSIONS.VIEW));

router.get('/entity/:type/:id', auditController.getEntityHistory);
router.get('/verify', auditController.verifyLedger);

export default router;
