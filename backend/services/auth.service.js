// backend/services/auth.service.js

const { supabase } = require('../utils/supabase');
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

module.exports = { login };
