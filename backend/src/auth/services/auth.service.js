import User from '../../models/User.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/token.util.js';
import logger from '../../logger/index.js';

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    logger.warn(`LOGIN_FAILED: User not found - ${email}`);
    throw { code: 'AUTH_001', message: 'Invalid credentials', status: 401 };
  }

  if (user.status !== 'ACTIVE') {
    logger.warn(`LOGIN_FAILED: Account not active - ${email} [Status: ${user.status}]`);
    throw { code: 'AUTH_008', message: 'Account is not active', status: 403 };
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    logger.warn(`LOGIN_FAILED: Account locked - ${email}`);
    throw { code: 'AUTH_004', message: 'Account is temporarily locked', status: 423 };
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      user.status = 'LOCKED';
      logger.warn(`ACCOUNT_LOCKED: Too many failed attempts - ${email}`);
    }
    await user.save();
    logger.warn(`LOGIN_FAILED: Invalid password - ${email}`);
    throw { code: 'AUTH_001', message: 'Invalid credentials', status: 401 };
  }

  // Successful login, reset attempts
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  
  if (user.status === 'LOCKED') {
    user.status = 'ACTIVE';
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  logger.info(`LOGIN_SUCCESS: User logged in - ${email}`);

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      status: user.status
    },
    accessToken,
    refreshToken
  };
};

export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw { code: 'AUTH_006', message: 'Refresh token required', status: 401 };
  }

  const tokenHash = hashToken(refreshToken);
  const user = await User.findOne({ refreshTokenHash: tokenHash });

  if (!user) {
    logger.warn(`TOKEN_REFRESH_FAILED: Invalid refresh token`);
    throw { code: 'AUTH_001', message: 'Invalid or expired refresh token', status: 401 };
  }

  if (user.status !== 'ACTIVE') {
    throw { code: 'AUTH_008', message: 'Account is not active', status: 403 };
  }

  // Generate new tokens (Rotation)
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  logger.info(`TOKEN_REFRESHED: Token rotated - ${user.email}`);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
    logger.info(`LOGOUT: User logged out - ${user.email}`);
  }
};
