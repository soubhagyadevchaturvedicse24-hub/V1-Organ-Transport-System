import { createStateMachine } from '../index.js';

/**
 * Matching Workflow Transition Map
 */
export const MATCHING_TRANSITIONS = Object.freeze({
  startMatching: {
    from: ['PENDING_START'], // Virtual initial state, or we just create it in MATCHING_STARTED
    to: 'MATCHING_STARTED',
  },
  checkCompatibility: {
    from: ['MATCHING_STARTED'],
    to: 'COMPATIBILITY_CHECK',
  },
  score: {
    from: ['COMPATIBILITY_CHECK'],
    to: 'SCORING',
  },
  rank: {
    from: ['SCORING'],
    to: 'RANKED',
  },
  recommend: {
    from: ['RANKED'],
    to: 'RECOMMENDED',
  },
  accept: {
    from: ['RECOMMENDED'],
    to: 'ACCEPTED',
  },
  expire: {
    from: ['MATCHING_STARTED', 'COMPATIBILITY_CHECK', 'SCORING', 'RANKED', 'RECOMMENDED'],
    to: 'CANCELLED',
  },
  cancel: {
    from: ['MATCHING_STARTED', 'COMPATIBILITY_CHECK', 'SCORING', 'RANKED', 'RECOMMENDED'],
    to: 'CANCELLED',
  },
});

export const matchingMachine = createStateMachine(MATCHING_TRANSITIONS);
