import { WORKFLOW_ERRORS } from '../constants/errorCodes.js';

/**
 * Generic Workflow State Machine
 *
 * Usage:
 *   const machine = createStateMachine(HOSPITAL_TRANSITIONS);
 *   machine.transition(currentStatus, 'approve');    // → 'APPROVED'
 *   machine.canTransition(currentStatus, 'approve'); // → true | false
 *   machine.getAllowedActions(currentStatus);          // → ['approve', 'reject']
 *
 * Transition map format:
 *   {
 *     [action]: { from: ['STATUS_A', 'STATUS_B'], to: 'STATUS_C' },
 *     ...
 *   }
 *
 * This module has zero domain knowledge — it is a pure data-driven engine.
 * All domain logic (hospital, donor, organ, transport) lives in the
 * corresponding transitions file.
 */
export const createStateMachine = (transitionMap) => {
  if (!transitionMap || typeof transitionMap !== 'object' || Object.keys(transitionMap).length === 0) {
    throw WORKFLOW_ERRORS.MISSING_TRANSITION_MAP;
  }

  /**
   * Attempt a state transition.
   * @param {string} currentStatus - The entity's current status.
   * @param {string} action - The action being attempted.
   * @returns {string} The new status if the transition is valid.
   * @throws {Object} Structured error (from WORKFLOW_ERRORS) if invalid.
   */
  const transition = (currentStatus, action) => {
    const rule = transitionMap[action];

    if (!rule) {
      throw {
        ...WORKFLOW_ERRORS.UNKNOWN_ACTION,
        message: `${WORKFLOW_ERRORS.UNKNOWN_ACTION.message}: '${action}'`,
      };
    }

    if (!rule.from.includes(currentStatus)) {
      throw {
        ...WORKFLOW_ERRORS.INVALID_TRANSITION,
        message: `Action '${action}' is not allowed when status is '${currentStatus}'. Allowed from: [${rule.from.join(', ')}]`,
      };
    }

    return rule.to;
  };

  /**
   * Check whether a transition is valid without throwing.
   * @param {string} currentStatus
   * @param {string} action
   * @returns {boolean}
   */
  const canTransition = (currentStatus, action) => {
    const rule = transitionMap[action];
    return Boolean(rule && rule.from.includes(currentStatus));
  };

  /**
   * Return all actions currently valid for a given status.
   * @param {string} currentStatus
   * @returns {string[]}
   */
  const getAllowedActions = (currentStatus) => {
    return Object.entries(transitionMap)
      .filter(([, rule]) => rule.from.includes(currentStatus))
      .map(([action]) => action);
  };

  return Object.freeze({ transition, canTransition, getAllowedActions });
};
