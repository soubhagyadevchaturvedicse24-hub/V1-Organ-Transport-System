import { AUTH_ERRORS } from '../constants/errorCodes.js';
import { HOSPITAL_PERMISSIONS } from '../permissions/hospital.permissions.js';
import { ORGAN_PERMISSIONS } from '../permissions/organ.permissions.js';
import { TRANSPORT_PERMISSIONS } from '../permissions/transport.permissions.js';
import { AUDIT_PERMISSIONS, DONOR_PERMISSIONS } from '../permissions/domain.permissions.js';
import logger from '../logger/index.js';

/**
 * Role → Permission mapping.
 * Built from named constants — no magic strings.
 */
const ROLE_PERMISSIONS = Object.freeze({
  PLATFORM_ADMIN: [
    HOSPITAL_PERMISSIONS.CREATE,
    HOSPITAL_PERMISSIONS.VIEW,
    HOSPITAL_PERMISSIONS.UPDATE,
    HOSPITAL_PERMISSIONS.APPROVE,
    HOSPITAL_PERMISSIONS.SUSPEND,
    DONOR_PERMISSIONS.VIEW,
    ORGAN_PERMISSIONS.VIEW,
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
    AUDIT_PERMISSIONS.VIEW,
  ],
  NOTTO_OFFICER: [
    HOSPITAL_PERMISSIONS.CREATE,
    HOSPITAL_PERMISSIONS.VIEW,
    HOSPITAL_PERMISSIONS.APPROVE,
    DONOR_PERMISSIONS.VIEW,
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
    AUDIT_PERMISSIONS.VIEW,
  ],
  ROTTO_SOTTO_OFFICER: [
    HOSPITAL_PERMISSIONS.VIEW,
    DONOR_PERMISSIONS.VIEW,
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
    AUDIT_PERMISSIONS.VIEW,
  ],
  HOSPITAL_COORDINATOR: [
    HOSPITAL_PERMISSIONS.VIEW,
    DONOR_PERMISSIONS.CREATE,
    DONOR_PERMISSIONS.VIEW,
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
  ],
  TRANSPLANT_SURGEON: [
    HOSPITAL_PERMISSIONS.VIEW,
    DONOR_PERMISSIONS.CREATE,
    DONOR_PERMISSIONS.VIEW,
    ORGAN_PERMISSIONS.VIEW,
    ORGAN_PERMISSIONS.MATCH,
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
  ],
  TRANSPORT_COORDINATOR: [
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
    TRANSPORT_PERMISSIONS.START,
    TRANSPORT_PERMISSIONS.COMPLETE,
  ],
  COURIER: [
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
    TRANSPORT_PERMISSIONS.START,
    TRANSPORT_PERMISSIONS.COMPLETE,
  ],
  AUDITOR: [
    AUDIT_PERMISSIONS.VIEW,
    HOSPITAL_PERMISSIONS.VIEW,
    DONOR_PERMISSIONS.VIEW,
    ORGAN_PERMISSIONS.VIEW,
    TRANSPORT_PERMISSIONS.VIEW_MISSION,
  ],
});

/**
 * Middleware factory: requirePermission('hospital:create')
 * Must be used after requireAuth — relies on req.user being populated.
 */
export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.warn(`PERMISSION_DENIED: No role found on req.user`);
      return next(AUTH_ERRORS.ACCESS_DENIED);
    }

    const permissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (!permissions.includes(requiredPermission)) {
      logger.warn(
        `PERMISSION_DENIED: User [${req.user.sub}] role [${req.user.role}] lacks permission [${requiredPermission}]`
      );
      return next(AUTH_ERRORS.ACCESS_DENIED);
    }

    next();
  };
};
