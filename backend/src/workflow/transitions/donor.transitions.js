import { createStateMachine } from '../index.js';

/**
 * Donor Workflow Transition Map
 *
 * Lifecycle:
 *   DRAFT → [submit] → PENDING_MEDICAL_REVIEW
 *   PENDING_MEDICAL_REVIEW → [medicalReview] → MEDICALLY_ELIGIBLE
 *   PENDING_MEDICAL_REVIEW → [reject] → REJECTED
 *   MEDICALLY_ELIGIBLE → [verifyConsent] → CONSENT_VERIFIED
 *   MEDICALLY_ELIGIBLE → [reject] → REJECTED
 *   CONSENT_VERIFIED → [activate] → AVAILABLE
 *   CONSENT_VERIFIED → [withdraw] → WITHDRAWN
 *   AVAILABLE → [complete] → COMPLETED
 *   AVAILABLE → [archive] → ARCHIVED
 */
export const DONOR_TRANSITIONS = Object.freeze({
  submit: {
    from: ['DRAFT'],
    to: 'PENDING_MEDICAL_REVIEW',
  },
  medicalReview: {
    from: ['PENDING_MEDICAL_REVIEW'],
    to: 'MEDICALLY_ELIGIBLE',
  },
  verifyConsent: {
    from: ['MEDICALLY_ELIGIBLE'],
    to: 'CONSENT_VERIFIED',
  },
  activate: {
    from: ['CONSENT_VERIFIED'],
    to: 'AVAILABLE',
  },
  complete: {
    from: ['AVAILABLE'],
    to: 'COMPLETED',
  },
  archive: {
    from: ['AVAILABLE'],
    to: 'ARCHIVED',
  },
  withdraw: {
    from: ['CONSENT_VERIFIED'],
    to: 'WITHDRAWN',
  },
  reject: {
    from: ['PENDING_MEDICAL_REVIEW', 'MEDICALLY_ELIGIBLE'],
    to: 'REJECTED',
  },
});

export const donorMachine = createStateMachine(DONOR_TRANSITIONS);
