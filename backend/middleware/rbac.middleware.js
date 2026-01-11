// backend/middleware/rbac.middleware.js
//
// API Change (Story 2.6): Replaced placeholder `requireRole` with production `rbac` middleware.
// Old: module.exports = { requireRole }  (placeholder, never used)
// New: module.exports = { rbac, ROLE_HIERARCHY }
//
// NOTE: MVP implements only 'employee' and 'manager' roles.
// Architecture supports adding 'admin' role in future (see PRD section 3ème Rôle Admin RH).

const AppError = require('../utils/AppError');

/**
 * Role hierarchy defines which roles inherit permissions from other roles.
 * Manager inherits all employee permissions (FR7).
 *
 * @type {Object.<string, string[]>}
 * @property {string[]} employee - Employee can only access employee routes
 * @property {string[]} manager - Manager can access both manager AND employee routes
 *
 * @example
 * // Future extension for admin role:
 * // admin: ['admin', 'manager', 'employee']
 */
const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']
};

/**
 * Creates a middleware that checks if user has required role(s).
 * Must be used after authenticate middleware which populates req.user.
 *
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware function
 *
 * @example
 * // Manager only route
 * router.post('/teams', authenticate, rbac('manager'), controller.create);
 *
 * @example
 * // Employee route (manager can also access due to inheritance)
 * router.get('/my-entries', authenticate, rbac('employee'), controller.getMyEntries);
 */
const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if authentication middleware ran (req.user must be populated)
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // Get effective roles for the user (including inherited roles)
    const userRole = req.user.role;
    const userRoles = ROLE_HIERARCHY[userRole];

    // Warn in development if role is not in hierarchy (could indicate misconfiguration)
    if (!userRoles && process.env.NODE_ENV === 'development') {
      console.warn(`[RBAC] Unknown role "${userRole}" not in ROLE_HIERARCHY, treating as standalone role`);
    }

    const effectiveRoles = userRoles || [userRole];

    // Check if user has at least one of the allowed roles
    const hasPermission = allowedRoles.some(role => effectiveRoles.includes(role));

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};

module.exports = { rbac, ROLE_HIERARCHY };
