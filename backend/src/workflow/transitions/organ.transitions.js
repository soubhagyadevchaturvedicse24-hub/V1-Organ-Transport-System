import { createStateMachine } from '../index.js';

/**
 * Organ Workflow Transition Map
 *
 * Lifecycle:
 *   RECOVERED → [beginAssessment] → IN_ASSESSMENT
 *   IN_ASSESSMENT → [approveViability] → AWAITING_ALLOCATION
 *   AWAITING_ALLOCATION → [allocate] → ALLOCATED
 *   ALLOCATED → [dispatch] → IN_TRANSIT
 *   IN_TRANSIT → [receive] → TRANSPLANTED
 *
 * Any non-terminal state → [discard] → DISCARDED
 */
export const ORGAN_TRANSITIONS = Object.freeze({
  beginAssessment: {
    from: ['RECOVERED'],
    to: 'IN_ASSESSMENT',
  },
  approveViability: {
    from: ['IN_ASSESSMENT'],
    to: 'AWAITING_ALLOCATION',
  },
  allocate: {
    from: ['AWAITING_ALLOCATION'],
    to: 'ALLOCATED',
  },
  dispatch: {
    from: ['ALLOCATED'],
    to: 'IN_TRANSIT',
  },
  receive: {
    from: ['IN_TRANSIT'],
    to: 'TRANSPLANTED',
  },
  discard: {
    from: ['RECOVERED', 'IN_ASSESSMENT', 'AWAITING_ALLOCATION', 'ALLOCATED', 'IN_TRANSIT'],
    to: 'DISCARDED',
  },
});

export const organMachine = createStateMachine(ORGAN_TRANSITIONS);
