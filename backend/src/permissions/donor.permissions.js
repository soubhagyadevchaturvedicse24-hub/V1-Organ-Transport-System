/**
 * Donor resource permissions.
 * All middleware and services that reference donor access must import from here.
 */
export const DONOR_PERMISSIONS = Object.freeze({
  CREATE: 'donor:create',
  UPDATE: 'donor:update',
  VIEW: 'donor:view',
  SUBMIT: 'donor:submit',
  MEDICAL_REVIEW: 'donor:medicalReview',
  VERIFY_CONSENT: 'donor:verifyConsent',
  ACTIVATE: 'donor:activate',
  ARCHIVE: 'donor:archive',
});
