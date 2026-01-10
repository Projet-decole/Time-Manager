// backend/middleware/auth.middleware.js

/**
 * Authentication middleware placeholder
 * TODO: Implement in Story 2.3 - Implement Authentication Middleware
 *
 * This middleware will:
 * - Extract JWT from Authorization header
 * - Validate token with Supabase Auth
 * - Attach user object to req.user
 * - Return 401 if invalid/missing token
 */

const authenticate = (req, res, next) => {
  // TODO: Implement authentication logic
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // const { data: { user }, error } = await supabase.auth.getUser(token);
  next();
};

module.exports = { authenticate };
