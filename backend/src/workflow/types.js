/**
 * @typedef {Object} TransitionRule
 * @property {string[]} from - Array of statuses from which this action is permitted.
 * @property {string} to - The resulting status if the action is applied.
 */

/**
 * @typedef {Object.<string, TransitionRule>} TransitionMap
 * A dictionary where the key is the action name (e.g., 'submit', 'approve')
 * and the value is the TransitionRule governing that action.
 */

/**
 * @typedef {Object} WorkflowMachine
 * @property {function(string, string): string} transition - Attempts a transition, returns new state or throws.
 * @property {function(string, string): boolean} canTransition - Checks if a transition is valid without throwing.
 * @property {function(string): string[]} getAllowedActions - Returns an array of allowed actions for a given status.
 */

export {};
