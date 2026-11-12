import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const duplicateFieldMessage = (error) => {
  const field = Object.keys(error.keyPattern || {})[0];
  if (field === 'email') return 'An account with this email address already exists';
  return `A record with this ${field || 'value'} already exists`;
};

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors = Array.isArray(error.errors) ? error.errors : [];

  if (error.name === 'ValidationError' && error.errors) {
    statusCode = 400;
    errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    message = errors[0]?.message || 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
    errors = [{ field: error.path, message }];
  } else if (error.code === 11000) {
    statusCode = 409;
    message = duplicateFieldMessage(error);
    errors = [{ field: Object.keys(error.keyPattern || {})[0] || 'unknown', message }];
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
    if (env.isProduction) {
      message = 'An unexpected error occurred. Please try again later.';
      errors = [];
    }
  }

  const payload = { success: false, message };
  if (errors.length > 0) payload.errors = errors;
  if (!env.isProduction && statusCode >= 500 && error.stack) payload.stack = error.stack;

  res.status(statusCode).json(payload);
};
