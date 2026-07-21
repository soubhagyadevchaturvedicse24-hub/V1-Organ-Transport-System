import { Router } from 'express';
import * as matchingController from '../controllers/matching.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { MATCHING_PERMISSIONS } from '../../permissions/matching.permissions.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission(MATCHING_PERMISSIONS.VIEW),
  matchingController.listMatches
);

router.post(
  '/organs/:organId/run',
  requirePermission(MATCHING_PERMISSIONS.TRIGGER),
  matchingController.runMatching
);

router.get(
  '/organs/:organId',
  requirePermission(MATCHING_PERMISSIONS.VIEW),
  matchingController.getMatch
);

router.post(
  '/:matchId/recipients/:recipientId/accept',
  requirePermission(MATCHING_PERMISSIONS.ACCEPT),
  matchingController.acceptRecommendation
);

router.post(
  '/:matchId/recipients/:recipientId/decline',
  requirePermission(MATCHING_PERMISSIONS.DECLINE),
  matchingController.declineRecommendation
);

export default router;
