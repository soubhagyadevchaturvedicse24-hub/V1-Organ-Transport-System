import { Router } from 'express';
import * as donorController from '../controllers/donor.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { DONOR_PERMISSIONS } from '../../permissions/donor.permissions.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createDonorSchema,
  updateDonorSchema,
  listDonorsSchema,
  rejectDonorSchema,
} from '../validators/donor.validator.js';

const router = Router();

// Apply auth to all routes
router.use(requireAuth);

// --- CRUD Endpoints ---
router.post(
  '/',
  requirePermission(DONOR_PERMISSIONS.CREATE),
  validateRequest({ body: createDonorSchema }),
  donorController.createDonor
);

router.get(
  '/',
  requirePermission(DONOR_PERMISSIONS.VIEW),
  validateRequest({ query: listDonorsSchema }),
  donorController.listDonors
);

router.get(
  '/:id',
  requirePermission(DONOR_PERMISSIONS.VIEW),
  donorController.getDonor
);

router.patch(
  '/:id',
  requirePermission(DONOR_PERMISSIONS.UPDATE),
  validateRequest({ body: updateDonorSchema }),
  donorController.updateDonor
);

// --- Workflow Endpoints ---
router.post(
  '/:id/submit',
  requirePermission(DONOR_PERMISSIONS.SUBMIT),
  donorController.submitDonor
);

router.post(
  '/:id/medical-approve',
  requirePermission(DONOR_PERMISSIONS.MEDICAL_REVIEW),
  donorController.medicalReviewDonor
);

router.post(
  '/:id/consent-verify',
  requirePermission(DONOR_PERMISSIONS.VERIFY_CONSENT),
  donorController.verifyConsentDonor
);

router.post(
  '/:id/activate',
  requirePermission(DONOR_PERMISSIONS.ACTIVATE),
  donorController.activateDonor
);

router.post(
  '/:id/reject',
  requirePermission(DONOR_PERMISSIONS.MEDICAL_REVIEW), // Also could be verifyConsent, but we can rely on state machine and this basic permission check
  validateRequest({ body: rejectDonorSchema }),
  donorController.rejectDonor
);

router.post(
  '/:id/complete',
  requirePermission(DONOR_PERMISSIONS.ARCHIVE), // Complete is generally system level or admin level, map appropriately
  donorController.completeDonor
);

router.post(
  '/:id/archive',
  requirePermission(DONOR_PERMISSIONS.ARCHIVE),
  donorController.archiveDonor
);

export default router;
