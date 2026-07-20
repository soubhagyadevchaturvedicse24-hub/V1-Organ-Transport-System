/**
 * Organ resource permissions.
 * All middleware and services that reference organ access must import from here.
 */
export const ORGAN_PERMISSIONS = Object.freeze({
  CREATE: 'organ:create',
  VIEW: 'organ:view',
  UPDATE: 'organ:update',
  ASSESS: 'organ:assess',
  ALLOCATE: 'organ:allocate',
  DISPATCH: 'organ:dispatch',
  DISCARD: 'organ:discard',
  VIEW_AUDIT: 'organ:viewAudit', // Added for future audit APIs
});
