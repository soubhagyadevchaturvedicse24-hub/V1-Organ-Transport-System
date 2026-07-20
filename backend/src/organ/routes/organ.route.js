import { Router } from 'express';
import * as organController from '../controllers/organ.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { ORGAN_PERMISSIONS } from '../../permissions/organ.permissions.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  registerOrganSchema,
  updateAssessmentSchema,
  allocateOrganSchema,
  dispatchOrganSchema,
  discardOrganSchema,
  listOrgansSchema,
} from '../validators/organ.validator.js';

const router = Router();

// Apply auth to all routes
router.use(requireAuth);

// --- CRUD Endpoints ---
router.post(
  '/',
  requirePermission(ORGAN_PERMISSIONS.CREATE),
  validateRequest({ body: registerOrganSchema }),
  organController.registerOrgan
);

router.get(
  '/',
  requirePermission(ORGAN_PERMISSIONS.VIEW),
  validateRequest({ query: listOrgansSchema }),
  organController.listOrgans
);

router.get(
  '/:id',
  requirePermission(ORGAN_PERMISSIONS.VIEW),
  organController.getOrgan
);

router.patch(
  '/:id',
  requirePermission(ORGAN_PERMISSIONS.UPDATE),
  validateRequest({ body: updateAssessmentSchema }),
  organController.updateAssessment
);

// --- Workflow Endpoints ---
router.post(
  '/:id/begin-assessment',
  requirePermission(ORGAN_PERMISSIONS.ASSESS),
  organController.beginAssessment
);

router.post(
  '/:id/approve-viability',
  requirePermission(ORGAN_PERMISSIONS.ASSESS),
  organController.approveViability
);

router.post(
  '/:id/allocate',
  requirePermission(ORGAN_PERMISSIONS.ALLOCATE),
  validateRequest({ body: allocateOrganSchema }),
  organController.allocateOrgan
);

router.post(
  '/:id/dispatch',
  requirePermission(ORGAN_PERMISSIONS.DISPATCH),
  validateRequest({ body: dispatchOrganSchema }),
  organController.dispatchOrgan
);

router.post(
  '/:id/receive',
  requirePermission(ORGAN_PERMISSIONS.DISPATCH), // Reusing Dispatch permission logic for receiver, might need its own RECEIVE in a full app
  organController.receiveOrgan
);

router.post(
  '/:id/discard',
  requirePermission(ORGAN_PERMISSIONS.DISCARD),
  validateRequest({ body: discardOrganSchema }),
  organController.discardOrgan
);

export default router;
