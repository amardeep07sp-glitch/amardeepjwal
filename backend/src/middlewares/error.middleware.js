import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};


export const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errors } = err instanceof ApiError
    ? err
    : new ApiError(err.statusCode || 500, err.message || 'Internal Server Error');

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  if (statusCode >= 500) {
    logger.error({ err }, message);
  } else {
    logger.warn({ err: { message: err.message } }, message);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors || [],
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
