import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Use separate secrets for access and refresh tokens.
 * Never share one secret across both token types.
 * JWT_REFRESH_SECRET is reserved for future JWT-signed refresh tokens.
 */
const accessSecret = () => process.env.JWT_ACCESS_SECRET || 'access_secret_dev';

/**
 * Generate a short-lived access token.
 * Payload is minimal: sub (userId), role.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      status: user.status,
    },
    accessSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate a cryptographically random opaque refresh token.
 * The raw token is returned to the client — only its hash is stored.
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash a token with SHA-256 before storage or comparison.
 * Never store the raw refresh token.
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify and decode an access token.
 * Returns null if invalid or expired (do not throw — let caller handle).
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, accessSecret());
  } catch {
    return null;
  }
};
