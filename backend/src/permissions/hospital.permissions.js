/**
 * Hospital resource permissions.
 * All middleware and services that reference hospital access must import from here.
 */
export const HOSPITAL_PERMISSIONS = Object.freeze({
  CREATE: 'hospital:create',
  VIEW: 'hospital:view',
  UPDATE: 'hospital:update',
  SUBMIT: 'hospital:submit',
  APPROVE: 'hospital:approve',
  REJECT: 'hospital:reject',
  SUSPEND: 'hospital:suspend',
  DEACTIVATE: 'hospital:deactivate',
});
