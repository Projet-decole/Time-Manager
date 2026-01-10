// backend/middleware/rbac.middleware.js

/**
 * Role-Based Access Control middleware placeholder
 * TODO: Implement in Story 2.6 - Implement RBAC Middleware
 *
 * This middleware will:
 * - Check req.user.role against allowed roles
 * - Return 403 if role is not permitted
 * - Support role hierarchy (admin > manager > employee)
 */

/**
 * Creates a middleware that checks if user has required role(s)
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // TODO: Implement role checking logic
    // if (!req.user) return next(new AppError('Not authenticated', 401));
    // if (!allowedRoles.includes(req.user.role)) {
    //   return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    // }
    next();
  };
};

module.exports = { requireRole };
