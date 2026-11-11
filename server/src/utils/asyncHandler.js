/**
 * Wraps async route handlers so rejected promises reach the central
 * error handling middleware instead of crashing the process.
 */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
