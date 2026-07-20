import logger from '../logger/index.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  if (status === 500) {
    logger.error(`[${code}] ${message} - ${err.stack}`);
  } else {
    logger.warn(`[${code}] ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    error: {
      code,
      details: err.details || null
    }
  });
};
