import express from 'express';
import * as boxController from '../controllers/box.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { TRANSPORT_PERMISSIONS } from '../../permissions/transport.permissions.js';

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(TRANSPORT_PERMISSIONS.MANAGE_BOX),
  boxController.registerBox
);

router.get(
  '/',
  requirePermission(TRANSPORT_PERMISSIONS.VIEW_MISSION), // usually whoever can view missions can view boxes
  boxController.listBoxes
);

router.patch(
  '/:boxId/status',
  requirePermission(TRANSPORT_PERMISSIONS.MANAGE_BOX),
  boxController.updateBoxStatus
);

export default router;
