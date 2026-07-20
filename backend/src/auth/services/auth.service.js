import User from '../../models/User.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/token.util.js';
import { AUTH_ERRORS } from '../../constants/errorCodes.js';
import logger from '../../logger/index.js';

/**
 * Lockout configuration.
 * Duration and max attempts are read from env so they are configurable
 * without touching code.
 */
const MAX_FAILED_ATTEMPTS = parseInt(process.env.LOCKOUT_MAX_ATTEMPTS || '5', 10);
const LOCKOUT_DURATION_MS = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10) * 60 * 1000;

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    logger.warn(`LOGIN_FAILED: No user with email - ${email}`);
    throw AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  // Check account status before password comparison
  if (user.status === 'LOCKED' && user.lockUntil && user.lockUntil > Date.now()) {
    logger.warn(`LOGIN_FAILED: Account locked - ${email}`);
    throw AUTH_ERRORS.ACCOUNT_LOCKED;
  }

  // If lock has expired, automatically unlock
  if (user.status === 'LOCKED' && user.lockUntil && user.lockUntil <= Date.now()) {
    user.status = 'ACTIVE';
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    logger.info(`ACCOUNT_UNLOCKED: Lock expired, account restored - ${email}`);
  }

  if (!['ACTIVE'].includes(user.status)) {
    logger.warn(`LOGIN_FAILED: Account not active - ${email} [Status: ${user.status}]`);
    throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      user.status = 'LOCKED';
      logger.warn(`ACCOUNT_LOCKED: Too many failed attempts - ${email}`);
    }

    await user.save();
    logger.warn(`LOGIN_FAILED: Invalid password attempt ${user.failedLoginAttempts} - ${email}`);
    throw AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  // Reset failed attempts on success
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Store only the hash — never the raw refresh token
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  logger.info(`LOGIN_SUCCESS: ${email}`);

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw AUTH_ERRORS.MISSING_TOKEN;
  }

  // Hash the incoming token and look it up — raw token is never stored
  const tokenHash = hashToken(refreshToken);
  const user = await User.findOne({ refreshTokenHash: tokenHash });

  if (!user) {
    logger.warn(`TOKEN_REFRESH_FAILED: Token hash not found — possible reuse attack`);
    throw AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  if (user.status !== 'ACTIVE') {
    throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
  }

  // Rotation: generate new pair and immediately invalidate the old hash
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  logger.info(`TOKEN_REFRESHED: Rotated token for ${user.email}`);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
    logger.info(`LOGOUT: ${user.email}`);
  }
};
