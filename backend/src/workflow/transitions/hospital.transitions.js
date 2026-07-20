import { createStateMachine } from '../stateMachine.js';

/**
 * Hospital Workflow Transition Map
 *
 * Each key is the action name (matches the API endpoint action).
 * `from` is the list of statuses from which this action is permitted.
 * `to` is the resulting status.
 *
 * Lifecycle:
 *   DRAFT → [submit] → PENDING_VERIFICATION
 *   PENDING_VERIFICATION → [review] → UNDER_REVIEW
 *   UNDER_REVIEW → [approve] → APPROVED
 *   UNDER_REVIEW → [reject]  → REJECTED
 *   APPROVED     → [activate] → ACTIVE
 *   ACTIVE       → [suspend]  → SUSPENDED
 *   SUSPENDED    → [reactivate] → ACTIVE
 *   ACTIVE       → [deactivate] → DEACTIVATED
 */
export const HOSPITAL_TRANSITIONS = Object.freeze({
  submit: {
    from: ['DRAFT'],
    to: 'PENDING_VERIFICATION',
  },
  review: {
    from: ['PENDING_VERIFICATION'],
    to: 'UNDER_REVIEW',
  },
  approve: {
    from: ['UNDER_REVIEW'],
    to: 'APPROVED',
  },
  reject: {
    from: ['PENDING_VERIFICATION', 'UNDER_REVIEW'],
    to: 'REJECTED',
  },
  activate: {
    from: ['APPROVED'],
    to: 'ACTIVE',
  },
  suspend: {
    from: ['ACTIVE'],
    to: 'SUSPENDED',
  },
  reactivate: {
    from: ['SUSPENDED'],
    to: 'ACTIVE',
  },
  deactivate: {
    from: ['ACTIVE', 'SUSPENDED'],
    to: 'DEACTIVATED',
  },
});

/**
 * Pre-built state machine instance for Hospital entities.
 * Import this directly in the hospital service — do not import the raw map.
 */
export const hospitalMachine = createStateMachine(HOSPITAL_TRANSITIONS);
