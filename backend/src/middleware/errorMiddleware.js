const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const payload = {
    message: err.message || 'Internal Server Error',
    ...(err.details && { details: err.details }),
  };

  if (status >= 500) {
    logger.error('Unhandled error', { err: err.stack, url: req.originalUrl });
  } else {
    logger.warn('Client error', { message: err.message, url: req.originalUrl });
  }

  res.status(status).json(payload);
};
