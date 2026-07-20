/**
 * Backend Error Code Catalogue
 * These codes are permanent. Never reuse a code for a different error.
 * Every module must import from here — no inline error objects allowed.
 */
export const AUTH_ERRORS = Object.freeze({
  INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Invalid credentials',
    status: 401,
  },
  TOKEN_EXPIRED: {
    code: 'AUTH_002',
    message: 'Token is invalid or has expired',
    status: 401,
  },
  ACCESS_DENIED: {
    code: 'AUTH_003',
    message: 'Access denied. Insufficient permissions.',
    status: 403,
  },
  ACCOUNT_LOCKED: {
    code: 'AUTH_004',
    message: 'Account is temporarily locked',
    status: 423,
  },
  INVALID_TOKEN_SIGNATURE: {
    code: 'AUTH_005',
    message: 'Invalid token signature',
    status: 401,
  },
  MISSING_TOKEN: {
    code: 'AUTH_006',
    message: 'Missing or invalid authorization header',
    status: 401,
  },
  WEAK_PASSWORD: {
    code: 'AUTH_007',
    message: 'Password does not meet complexity requirements',
    status: 400,
  },
  ACCOUNT_NOT_ACTIVE: {
    code: 'AUTH_008',
    message: 'Account is not active',
    status: 403,
  },
});

/**
 * Workflow Error Codes
 */
export const WORKFLOW_ERRORS = Object.freeze({
  UNKNOWN_ACTION: {
    code: 'WORKFLOW_001',
    message: 'Unknown workflow action',
    status: 400,
  },
  INVALID_TRANSITION: {
    code: 'WORKFLOW_002',
    message: 'This action is not allowed in the current state',
    status: 409,
  },
  MISSING_TRANSITION_MAP: {
    code: 'WORKFLOW_003',
    message: 'No transition map provided to the workflow engine',
    status: 500,
  },
});

/**
 * Hospital Domain Error Codes
 */
export const HOSPITAL_ERRORS = Object.freeze({
  NOT_FOUND: {
    code: 'HOSPITAL_001',
    message: 'Hospital not found',
    status: 404,
  },
  IMMUTABLE_STATUS: {
    code: 'HOSPITAL_002',
    message: 'Hospital can only be updated while in DRAFT status',
    status: 409,
  },
  REJECTION_REASON_REQUIRED: {
    code: 'HOSPITAL_003',
    message: 'Rejection reason is required',
    status: 400,
  },
});

/**
 * Donor Domain Error Codes
 */
export const DONOR_ERRORS = Object.freeze({
  NOT_FOUND: {
    code: 'DONOR_001',
    message: 'Donor not found',
    status: 404,
  },
  IMMUTABLE_STATUS: {
    code: 'DONOR_002',
    message: 'Donor identity can only be updated while in DRAFT status',
    status: 409,
  },
  REJECTION_REASON_REQUIRED: {
    code: 'DONOR_003',
    message: 'Rejection reason is required',
    status: 400,
  },
  INVALID_STATUS_FOR_ORGAN: {
    code: 'DONOR_004',
    message: 'Cannot create organ from donor in current status. Must be AVAILABLE or COMPLETED.',
    status: 409,
  },
});

/**
 * Organ Domain Error Codes
 */
export const ORGAN_ERRORS = Object.freeze({
  NOT_FOUND: {
    code: 'ORGAN_001',
    message: 'Organ not found',
    status: 404,
  },
  IMMUTABLE_STATUS: {
    code: 'ORGAN_002',
    message: 'Organ identity cannot be updated outside of assessment window',
    status: 409,
  },
  DISCARD_REASON_REQUIRED: {
    code: 'ORGAN_003',
    message: 'Discard reason is required',
    status: 400,
  },
  TRANSPORT_BOX_REQUIRED: {
    code: 'ORGAN_004',
    message: 'Transport Box ID is required to dispatch',
    status: 400,
  },
  ALLOCATION_REQUIRED: {
    code: 'ORGAN_005',
    message: 'Target hospital is required for allocation',
    status: 400,
  },
});

/**
 * Matching Domain Error Codes
 */
export const MATCHING_ERRORS = Object.freeze({
  NOT_FOUND: {
    code: 'MATCH_001',
    message: 'Match record not found',
    status: 404,
  },
  INVALID_ORGAN_STATE: {
    code: 'MATCH_002',
    message: 'Organ is not in a valid state to start matching (must be AWAITING_ALLOCATION)',
    status: 409,
  },
  RECIPIENT_NOT_FOUND_IN_MATCH: {
    code: 'MATCH_003',
    message: 'Recipient is not part of this match recommendation',
    status: 400,
  },
});
