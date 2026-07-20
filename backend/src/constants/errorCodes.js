/**
 * Authentication Error Codes
 * These codes are permanent. Never reuse a code for a different error.
 * Every module that needs to throw an auth error should import from here.
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
