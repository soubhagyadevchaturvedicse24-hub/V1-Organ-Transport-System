/**
 * Hospital resource permissions.
 * All middleware and services that reference hospital access must import from here.
 */
export const HOSPITAL_PERMISSIONS = Object.freeze({
  CREATE: 'hospital:create',
  VIEW: 'hospital:view',
  UPDATE: 'hospital:update',
  APPROVE: 'hospital:approve',
  SUSPEND: 'hospital:suspend',
});
