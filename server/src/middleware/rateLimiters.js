import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

const envelope = (message) => ({ success: false, message, errors: [] });

/**
 * Only failed login attempts count against the limit, so a normal working
 * session never consumes the quota. Protects against credential stuffing.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooManyRequests('Too many login attempts. Please try again in 15 minutes.')),
  message: envelope('Too many login attempts. Please try again in 15 minutes.'),
});

export const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooManyRequests('Too many submissions in a short time. Please wait a moment.')),
  message: envelope('Too many submissions in a short time. Please wait a moment.'),
});
