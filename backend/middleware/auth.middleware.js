// backend/middleware/auth.middleware.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel } = require('../utils/transformers');

/**
 * Authentication middleware that validates JWT tokens with Supabase.
 *
 * Validates the Bearer token from Authorization header using Supabase Auth,
 * fetches user profile, and attaches user object to req.user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @throws {AppError} 401 UNAUTHORIZED - Missing/invalid/expired token
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      throw new AppError('Authorization header required', 401, 'UNAUTHORIZED');
    }

    // Check if header has correct Bearer format (case-insensitive per RFC 7235)
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      throw new AppError('Invalid authorization format', 401, 'UNAUTHORIZED');
    }

    // Extract the token (handle any case of "Bearer")
    const token = authHeader.slice(7);

    // Check if token is not empty
    if (!token || token.trim() === '') {
      throw new AppError('Invalid token format', 401, 'UNAUTHORIZED');
    }

    // Set the access token on request for logout endpoint
    req.accessToken = token;

    // Validate token with Supabase Auth
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // Fetch user profile from profiles table for role and additional info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, weekly_hours_target')
      .eq('id', user.id)
      .single();

    // Log profile fetch errors (auth succeeded, continue with minimal user data)
    if (profileError) {
      console.warn('[AUTH] Profile fetch failed for user:', user.id, profileError.message);
    }

    // Attach user object to request
    // Transform snake_case profile fields to camelCase
    req.user = {
      id: user.id,
      email: user.email,
      ...snakeToCamel(profile || {})
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
