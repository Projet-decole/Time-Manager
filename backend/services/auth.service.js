// backend/services/auth.service.js

const { supabase, supabaseAdmin } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel } = require('../utils/transformers');

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with session and profile
 * @throws {AppError} If authentication fails
 */
const login = async (email, password) => {
  // Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const { user, session } = authData;

  // Fetch profile data from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, weekly_hours_target')
    .eq('id', user.id)
    .single();

  if (profileError) {
    // Profile fetch failed but auth succeeded - log warning but continue
    console.warn('[AUTH] Profile fetch failed for user:', user.id, profileError.message);
  }

  // Transform profile to camelCase
  const transformedProfile = profile ? snakeToCamel(profile) : null;

  // Build user object combining auth user and profile
  const userData = {
    id: user.id,
    email: user.email,
    firstName: transformedProfile?.firstName || null,
    lastName: transformedProfile?.lastName || null,
    role: transformedProfile?.role || 'employee',
    weeklyHoursTarget: transformedProfile?.weeklyHoursTarget || 35
  };

  // Build session object with camelCase keys
  const sessionData = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at
  };

  return {
    user: userData,
    session: sessionData
  };
};

/**
 * Sign out user and invalidate all sessions
 * Uses admin API to ensure server-side session invalidation in stateless REST API
 * @param {string} accessToken - The user's JWT access token
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If logout fails or accessToken is missing
 */
const logout = async (accessToken) => {
  if (!accessToken || (typeof accessToken === 'string' && !accessToken.trim())) {
    throw new AppError('Access token is required for logout', 400, 'INVALID_REQUEST');
  }

  // Use admin API to invalidate all sessions for this user (global scope)
  // This is required for stateless REST APIs where the server doesn't hold session state
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, 'global');

  if (error) {
    throw new AppError('Logout failed', 500, 'LOGOUT_FAILED');
  }

  return { message: 'Logged out successfully' };
};

/**
 * Request password reset email
 * Always returns success to prevent email enumeration
 * @param {string} email - User email
 * @returns {Promise<Object>} Success message
 */
const forgotPassword = async (email) => {
  // Always attempt reset - Supabase handles non-existent emails gracefully
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
  });

  // Log error for debugging but don't expose to user
  if (error) {
    console.error('[AUTH] Password reset error:', error.message);
  }

  // Always return success to prevent email enumeration
  return { message: 'If an account exists, a reset email has been sent' };
};

module.exports = { login, logout, forgotPassword };
