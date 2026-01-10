// backend/middleware/auth.middleware.js

const AppError = require('../utils/AppError');

/**
 * Authentication middleware placeholder
 * TODO: Implement full token validation in Story 2.3 - Implement Authentication Middleware
 *
 * This middleware will:
 * - Extract JWT from Authorization header
 * - Validate token with Supabase Auth (Story 2.3)
 * - Attach user object to req.user
 * - Return 401 if invalid/missing token
 *
 * IMPORTANT for Story 2.3:
 * - Must validate token with Supabase Auth (supabase.auth.getUser(token))
 * - Must set req.user = { id: <user_uuid>, email: <user_email>, ... }
 * - The logout endpoint depends on req.accessToken being set
 */

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and has correct format
  // Note: RFC 7235 specifies that the auth scheme is case-insensitive
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  // Extract the token (handle any case of "Bearer")
  const token = authHeader.slice(7);

  if (!token || token.trim() === '') {
    throw new AppError('Invalid token format', 401, 'UNAUTHORIZED');
  }

  // Set the access token on request for logout endpoint
  req.accessToken = token;

  // PLACEHOLDER: Set mock user for testing
  // Story 2.3 MUST replace this with real token validation via Supabase Auth
  // TODO: const { data: { user }, error } = await supabase.auth.getUser(token);
  req.user = {
    id: 'placeholder-user-id',
    email: 'placeholder@example.com'
  };

  next();
};

module.exports = { authenticate };
