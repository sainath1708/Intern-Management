import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs after a validation chain. Converts express-validator errors into the
 * standard error envelope handled by the central error middleware.
 */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(ApiError.badRequest(errors[0]?.message || 'Validation failed', errors));
};
