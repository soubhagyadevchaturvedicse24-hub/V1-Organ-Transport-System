import { verifyAccessToken } from '../auth/utils/token.util.js';
import { AUTH_ERRORS } from '../constants/errorCodes.js';
import logger from '../logger/index.js';

/**
 * JWT verification middleware.
 * Populates req.user with { sub, role, status } from the decoded payload.
 * Must be placed before requirePermission in any route chain.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AUTH_ERRORS.MISSING_TOKEN);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    logger.warn(`TOKEN_EXPIRED: Invalid or expired JWT on ${req.method} ${req.path}`);
    return next(AUTH_ERRORS.TOKEN_EXPIRED);
  }

  if (decoded.status !== 'ACTIVE') {
    return next(AUTH_ERRORS.ACCOUNT_NOT_ACTIVE);
  }

  req.user = decoded; // { sub, role, status, iat, exp }
  next();
};
