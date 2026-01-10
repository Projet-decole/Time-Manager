// backend/utils/asyncHandler.js

/**
 * Wraps async route handlers to catch errors and pass to error middleware.
 * Prevents unhandled promise rejections from crashing the application.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }))
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler that catches errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
