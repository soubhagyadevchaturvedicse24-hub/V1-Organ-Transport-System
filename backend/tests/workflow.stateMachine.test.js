/**
 * Workflow State Machine — Unit Tests
 *
 * Tests the generic engine against a controlled transition map.
 * Also tests the Hospital-specific machine against real HOSPITAL_TRANSITIONS.
 *
 * Because createStateMachine has zero domain knowledge, testing it once
 * here covers all future modules (Donor, Organ, Transport) that reuse it.
 */

import { describe, it, expect } from 'vitest';
import { createStateMachine, WORKFLOW_ERRORS } from '../src/workflow/index.js';
import { hospitalMachine, HOSPITAL_TRANSITIONS } from '../src/workflow/transitions/hospital.transitions.js';
import { donorMachine, DONOR_TRANSITIONS } from '../src/workflow/transitions/donor.transitions.js';

// ─── Controlled test transition map ──────────────────────────────────────────
const TEST_TRANSITIONS = Object.freeze({
  activate: { from: ['DRAFT'], to: 'ACTIVE' },
  suspend:  { from: ['ACTIVE'], to: 'SUSPENDED' },
  close:    { from: ['ACTIVE', 'SUSPENDED'], to: 'CLOSED' },
});

// ─── createStateMachine: guard tests ─────────────────────────────────────────
describe('createStateMachine — guard conditions', () => {
  it('throws WORKFLOW_003 when called with null', () => {
    expect(() => createStateMachine(null)).toThrow(
      expect.objectContaining({ code: WORKFLOW_ERRORS.MISSING_TRANSITION_MAP.code })
    );
  });

  it('throws WORKFLOW_003 when called with an empty object', () => {
    expect(() => createStateMachine({})).toThrow(
      expect.objectContaining({ code: WORKFLOW_ERRORS.MISSING_TRANSITION_MAP.code })
    );
  });

  it('returns a frozen object with the three expected methods', () => {
    const machine = createStateMachine(TEST_TRANSITIONS);
    expect(machine).toHaveProperty('transition');
    expect(machine).toHaveProperty('canTransition');
    expect(machine).toHaveProperty('getAllowedActions');
    expect(Object.isFrozen(machine)).toBe(true);
  });
});

// ─── transition() ─────────────────────────────────────────────────────────────
describe('transition()', () => {
  const machine = createStateMachine(TEST_TRANSITIONS);

  it('returns the correct next status for a valid transition', () => {
    expect(machine.transition('DRAFT', 'activate')).toBe('ACTIVE');
  });

  it('returns the correct next status when from has multiple values', () => {
    expect(machine.transition('ACTIVE', 'close')).toBe('CLOSED');
    expect(machine.transition('SUSPENDED', 'close')).toBe('CLOSED');
  });

  it('throws WORKFLOW_001 for an unknown action', () => {
    expect(() => machine.transition('DRAFT', 'nonexistent')).toThrow(
      expect.objectContaining({ code: WORKFLOW_ERRORS.UNKNOWN_ACTION.code })
    );
  });

  it('throws WORKFLOW_002 when action is known but status is wrong', () => {
    expect(() => machine.transition('DRAFT', 'suspend')).toThrow(
      expect.objectContaining({ code: WORKFLOW_ERRORS.INVALID_TRANSITION.code })
    );
  });

  it('throws WORKFLOW_002 for a terminal-like state with no outgoing transitions', () => {
    expect(() => machine.transition('CLOSED', 'activate')).toThrow(
      expect.objectContaining({ code: WORKFLOW_ERRORS.INVALID_TRANSITION.code })
    );
  });
});

// ─── canTransition() ──────────────────────────────────────────────────────────
describe('canTransition()', () => {
  const machine = createStateMachine(TEST_TRANSITIONS);

  it('returns true for a valid transition', () => {
    expect(machine.canTransition('DRAFT', 'activate')).toBe(true);
  });

  it('returns false for an invalid transition (wrong status)', () => {
    expect(machine.canTransition('DRAFT', 'suspend')).toBe(false);
  });

  it('returns false for an unknown action', () => {
    expect(machine.canTransition('DRAFT', 'nonexistent')).toBe(false);
  });

  it('returns false from a terminal state', () => {
    expect(machine.canTransition('CLOSED', 'activate')).toBe(false);
  });
});

// ─── getAllowedActions() ───────────────────────────────────────────────────────
describe('getAllowedActions()', () => {
  const machine = createStateMachine(TEST_TRANSITIONS);

  it('returns correct allowed actions for DRAFT', () => {
    expect(machine.getAllowedActions('DRAFT')).toEqual(['activate']);
  });

  it('returns multiple actions for a state with multiple valid transitions', () => {
    const actions = machine.getAllowedActions('ACTIVE');
    expect(actions).toContain('suspend');
    expect(actions).toContain('close');
    expect(actions).toHaveLength(2);
  });

  it('returns an empty array for a terminal state', () => {
    expect(machine.getAllowedActions('CLOSED')).toEqual([]);
  });

  it('returns an empty array for an unknown status', () => {
    expect(machine.getAllowedActions('NONEXISTENT')).toEqual([]);
  });
});

// ─── Hospital Machine: real transition map ─────────────────────────────────────
describe('hospitalMachine — real transition map', () => {
  it('DRAFT → submit → PENDING_VERIFICATION', () => {
    expect(hospitalMachine.transition('DRAFT', 'submit')).toBe('PENDING_VERIFICATION');
  });

  it('PENDING_VERIFICATION → review → UNDER_REVIEW', () => {
    expect(hospitalMachine.transition('PENDING_VERIFICATION', 'review')).toBe('UNDER_REVIEW');
  });

  it('UNDER_REVIEW → approve → APPROVED', () => {
    expect(hospitalMachine.transition('UNDER_REVIEW', 'approve')).toBe('APPROVED');
  });

  it('UNDER_REVIEW → reject → REJECTED', () => {
    expect(hospitalMachine.transition('UNDER_REVIEW', 'reject')).toBe('REJECTED');
  });

  it('PENDING_VERIFICATION → reject → REJECTED (early rejection)', () => {
    expect(hospitalMachine.transition('PENDING_VERIFICATION', 'reject')).toBe('REJECTED');
  });

  it('APPROVED → activate → ACTIVE', () => {
    expect(hospitalMachine.transition('APPROVED', 'activate')).toBe('ACTIVE');
  });

  it('ACTIVE → suspend → SUSPENDED', () => {
    expect(hospitalMachine.transition('ACTIVE', 'suspend')).toBe('SUSPENDED');
  });

  it('SUSPENDED → reactivate → ACTIVE', () => {
    expect(hospitalMachine.transition('SUSPENDED', 'reactivate')).toBe('ACTIVE');
  });

  it('ACTIVE → deactivate → DEACTIVATED', () => {
    expect(hospitalMachine.transition('ACTIVE', 'deactivate')).toBe('DEACTIVATED');
  });

  it('SUSPENDED → deactivate → DEACTIVATED', () => {
    expect(hospitalMachine.transition('SUSPENDED', 'deactivate')).toBe('DEACTIVATED');
  });

  it('DEACTIVATED → (anything) → throws WORKFLOW_002', () => {
    const actions = Object.keys(HOSPITAL_TRANSITIONS);
    actions.forEach((action) => {
      expect(() => hospitalMachine.transition('DEACTIVATED', action)).toThrow(
        expect.objectContaining({ code: WORKFLOW_ERRORS.INVALID_TRANSITION.code })
      );
    });
  });

  it('REJECTED → (anything) → throws WORKFLOW_002', () => {
    const actions = Object.keys(HOSPITAL_TRANSITIONS);
    actions.forEach((action) => {
      expect(() => hospitalMachine.transition('REJECTED', action)).toThrow(
        expect.objectContaining({ code: WORKFLOW_ERRORS.INVALID_TRANSITION.code })
      );
    });
  });

  it('ACTIVE → approve → throws WORKFLOW_002 (wrong direction)', () => {
    expect(() => hospitalMachine.transition('ACTIVE', 'approve')).toThrow(
      expect.objectContaining({ code: WORKFLOW_ERRORS.INVALID_TRANSITION.code })
    );
  });

  it('getAllowedActions returns correct set for UNDER_REVIEW', () => {
    const actions = hospitalMachine.getAllowedActions('UNDER_REVIEW');
    expect(actions).toContain('approve');
    expect(actions).toContain('reject');
    expect(actions).toHaveLength(2);
  });

  it('getAllowedActions returns empty for terminal DEACTIVATED', () => {
    expect(hospitalMachine.getAllowedActions('DEACTIVATED')).toEqual([]);
  });

  it('canTransition returns false for any action from DEACTIVATED', () => {
    expect(hospitalMachine.canTransition('DEACTIVATED', 'activate')).toBe(false);
    expect(hospitalMachine.canTransition('DEACTIVATED', 'reactivate')).toBe(false);
  });
});

// ─── Donor Machine: real transition map ────────────────────────────────────────
describe('donorMachine — real transition map', () => {
  it('DRAFT → submit → PENDING_MEDICAL_REVIEW', () => {
    expect(donorMachine.transition('DRAFT', 'submit')).toBe('PENDING_MEDICAL_REVIEW');
  });

  it('PENDING_MEDICAL_REVIEW → medicalReview → MEDICALLY_ELIGIBLE', () => {
    expect(donorMachine.transition('PENDING_MEDICAL_REVIEW', 'medicalReview')).toBe('MEDICALLY_ELIGIBLE');
  });

  it('MEDICALLY_ELIGIBLE → verifyConsent → CONSENT_VERIFIED', () => {
    expect(donorMachine.transition('MEDICALLY_ELIGIBLE', 'verifyConsent')).toBe('CONSENT_VERIFIED');
  });

  it('CONSENT_VERIFIED → activate → AVAILABLE', () => {
    expect(donorMachine.transition('CONSENT_VERIFIED', 'activate')).toBe('AVAILABLE');
  });

  it('AVAILABLE → complete → COMPLETED', () => {
    expect(donorMachine.transition('AVAILABLE', 'complete')).toBe('COMPLETED');
  });

  it('AVAILABLE → archive → ARCHIVED', () => {
    expect(donorMachine.transition('AVAILABLE', 'archive')).toBe('ARCHIVED');
  });

  it('CONSENT_VERIFIED → withdraw → WITHDRAWN', () => {
    expect(donorMachine.transition('CONSENT_VERIFIED', 'withdraw')).toBe('WITHDRAWN');
  });

  it('PENDING_MEDICAL_REVIEW → reject → REJECTED', () => {
    expect(donorMachine.transition('PENDING_MEDICAL_REVIEW', 'reject')).toBe('REJECTED');
  });

  it('MEDICALLY_ELIGIBLE → reject → REJECTED', () => {
    expect(donorMachine.transition('MEDICALLY_ELIGIBLE', 'reject')).toBe('REJECTED');
  });

  it('COMPLETED → (anything) → throws WORKFLOW_002', () => {
    const actions = Object.keys(DONOR_TRANSITIONS);
    actions.forEach((action) => {
      expect(() => donorMachine.transition('COMPLETED', action)).toThrow(
        expect.objectContaining({ code: WORKFLOW_ERRORS.INVALID_TRANSITION.code })
      );
    });
  });

  it('getAllowedActions returns correct set for PENDING_MEDICAL_REVIEW', () => {
    const actions = donorMachine.getAllowedActions('PENDING_MEDICAL_REVIEW');
    expect(actions).toContain('medicalReview');
    expect(actions).toContain('reject');
    expect(actions).toHaveLength(2);
  });
});

