/**
 * Transport resource permissions.
 */
export const TRANSPORT_PERMISSIONS = Object.freeze({
  VIEW_MISSION: 'mission:view',
  CREATE_MISSION: 'mission:create',
  UPDATE_MISSION: 'mission:update',
  DISPATCH: 'transport:dispatch',
  START: 'transport:start',
  ARRIVE: 'transport:arrive',
  COMPLETE: 'transport:complete',
  CANCEL: 'transport:cancel',
  LOG_TELEMETRY: 'transport:telemetry',
  MANAGE_BOX: 'box:manage',
});
