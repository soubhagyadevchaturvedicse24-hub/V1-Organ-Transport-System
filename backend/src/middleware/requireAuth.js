import { verifyAccessToken } from '../auth/utils/token.util.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next({ code: 'AUTH_006', message: 'Missing or invalid authorization header', status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return next({ code: 'AUTH_002', message: 'Token is invalid or has expired', status: 401 });
  }

  if (decoded.status !== 'ACTIVE') {
    return next({ code: 'AUTH_008', message: 'Account is not active', status: 403 });
  }

  req.user = decoded;
  next();
};
