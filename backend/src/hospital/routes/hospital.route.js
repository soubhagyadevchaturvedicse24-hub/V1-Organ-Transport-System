import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { HOSPITAL_PERMISSIONS } from '../../permissions/hospital.permissions.js';

const router = Router();

// All hospital routes require authentication
router.use(requireAuth);

// CRUD
router.post(
  '/',
  requirePermission(HOSPITAL_PERMISSIONS.CREATE),
  hospitalController.createHospital
);
router.get(
  '/',
  requirePermission(HOSPITAL_PERMISSIONS.VIEW),
  hospitalController.listHospitals
);
router.get(
  '/:id',
  requirePermission(HOSPITAL_PERMISSIONS.VIEW),
  hospitalController.getHospital
);
router.patch(
  '/:id',
  requirePermission(HOSPITAL_PERMISSIONS.UPDATE),
  hospitalController.updateHospital
);

// Workflow Actions
router.post(
  '/:id/submit',
  requirePermission(HOSPITAL_PERMISSIONS.SUBMIT),
  hospitalController.submitHospital
);
router.post(
  '/:id/approve',
  requirePermission(HOSPITAL_PERMISSIONS.APPROVE),
  hospitalController.approveHospital
);
router.post(
  '/:id/reject',
  requirePermission(HOSPITAL_PERMISSIONS.REJECT),
  hospitalController.rejectHospital
);
router.post(
  '/:id/activate',
  requirePermission(HOSPITAL_PERMISSIONS.APPROVE),
  hospitalController.activateHospital
);
router.post(
  '/:id/suspend',
  requirePermission(HOSPITAL_PERMISSIONS.SUSPEND),
  hospitalController.suspendHospital
);
router.post(
  '/:id/reactivate',
  requirePermission(HOSPITAL_PERMISSIONS.SUSPEND),
  hospitalController.reactivateHospital
);
router.post(
  '/:id/deactivate',
  requirePermission(HOSPITAL_PERMISSIONS.DEACTIVATE),
  hospitalController.deactivateHospital
);

export default router;
