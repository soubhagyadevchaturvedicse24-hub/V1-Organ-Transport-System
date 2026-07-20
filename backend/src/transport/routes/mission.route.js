import express from 'express';
import * as missionController from '../controllers/mission.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { TRANSPORT_PERMISSIONS } from '../../permissions/transport.permissions.js';

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(TRANSPORT_PERMISSIONS.CREATE_MISSION),
  missionController.createMission
);

router.get(
  '/:missionId',
  requirePermission(TRANSPORT_PERMISSIONS.VIEW_MISSION),
  missionController.getMission
);

// Workflow endpoints
const actionPermissionMap = {
  dispatch: TRANSPORT_PERMISSIONS.DISPATCH,
  startTransit: TRANSPORT_PERMISSIONS.START,
  arrive: TRANSPORT_PERMISSIONS.ARRIVE,
  complete: TRANSPORT_PERMISSIONS.COMPLETE,
  cancel: TRANSPORT_PERMISSIONS.CANCEL,
};

router.post(
  '/:missionId/workflow/:action',
  (req, res, next) => {
    const perm = actionPermissionMap[req.params.action];
    if (!perm) return res.status(400).json({ error: 'Unknown workflow action' });
    requirePermission(perm)(req, res, next);
  },
  missionController.updateMissionWorkflow
);

export default router;
