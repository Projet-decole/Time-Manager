// backend/services/users.service.js

const crypto = require('crypto');
const { supabase, supabaseAdmin } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Get user profile by ID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User profile data in camelCase
 * @throws {AppError} If profile not found
 */
const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('Profile not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(data);
};

/**
 * Update user profile
 * Only allows updating: firstName, lastName, weeklyHoursTarget
 * NEVER allows updating: email, role
 * @param {string} userId - User UUID
 * @param {Object} updateData - Data to update (camelCase)
 * @returns {Promise<Object>} Updated profile data in camelCase
 * @throws {AppError} If update fails
 */
const updateProfile = async (userId, updateData) => {
  // Whitelist allowed fields - NEVER allow email or role changes
  const allowedFields = ['firstName', 'lastName', 'weeklyHoursTarget'];
  const filtered = Object.fromEntries(
    Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
  );

  // If no valid fields to update, return current profile
  if (Object.keys(filtered).length === 0) {
    return getProfile(userId);
  }

  // Convert to snake_case for database and add updated_at timestamp
  const dbData = {
    ...camelToSnake(filtered),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(dbData)
    .eq('id', userId)
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at, updated_at')
    .single();

  if (error) {
    console.error('[USERS] Update profile failed:', { userId, error: error.message });
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  return snakeToCamel(data);
};

/**
 * Get all users with pagination and filtering
 * @param {Object} filters - Filter options { role?: string }
 * @param {Object} pagination - Pagination options { page?: number, limit?: number }
 * @returns {Promise<Object>} { data: User[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
  const { page, limit, offset } = parsePaginationParams(pagination);

  let query = supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at, updated_at', { count: 'exact' });

  // Apply role filter if provided and valid
  const validRoles = ['employee', 'manager'];
  if (filters.role && validRoles.includes(filters.role)) {
    query = query.eq('role', filters.role);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[USERS] Get all users failed:', { error: error.message });
    throw new AppError('Failed to retrieve users', 500, 'DATABASE_ERROR');
  }

  return {
    data: (data || []).map(snakeToCamel),
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Create a new user (manager only)
 * Story 2.14: Manager User Management
 * 1. Creates user in Supabase Auth
 * 2. Creates profile in profiles table
 * 3. Sends password reset email for user to set their password
 *
 * @param {Object} userData - User data in camelCase
 * @param {string} userData.email - User email (required)
 * @param {string} userData.firstName - User first name (required)
 * @param {string} userData.lastName - User last name (required)
 * @param {string} userData.role - User role: 'employee' or 'manager' (default: 'employee')
 * @param {number} userData.weeklyHoursTarget - Weekly hours target (default: 35)
 * @returns {Promise<Object>} Created user profile in camelCase
 * @throws {AppError} EMAIL_EXISTS if email already registered
 * @throws {AppError} CREATE_FAILED if creation fails
 */
const createUser = async (userData) => {
  const { email, firstName, lastName, role = 'employee', weeklyHoursTarget = 35 } = userData;

  // Generate a secure temporary password (user will reset via recovery link)
  const temporaryPassword = crypto.randomBytes(32).toString('base64');

  // Step 1: Create user in Supabase Auth with temporary password
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: temporaryPassword, // Required by Supabase Admin API
    email_confirm: true, // Auto-confirm email since manager is creating
    user_metadata: { firstName, lastName, role }
  });

  if (authError) {
    // Check for duplicate email
    if (authError.message.includes('already') || authError.message.includes('registered')) {
      throw new AppError('Un utilisateur avec cet email existe deja', 409, 'EMAIL_EXISTS');
    }
    console.error('[USERS] Auth user creation failed:', { email, error: authError.message });
    throw new AppError('Failed to create user', 500, 'CREATE_FAILED');
  }

  const userId = authData.user.id;

  // Step 2: Create profile in profiles table
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      weekly_hours_target: weeklyHoursTarget
    })
    .select('id, email, first_name, last_name, role, weekly_hours_target')
    .single();

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    console.error('[USERS] Profile creation failed, rolling back auth user:', { userId, error: profileError.message });
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new AppError('Failed to create user profile', 500, 'CREATE_FAILED');
  }

  // Step 3: Send password reset email so user can set their password
  try {
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email
    });
  } catch (linkError) {
    // Log but don't fail - user was created successfully
    console.warn('[USERS] Password reset email failed:', { email, error: linkError.message });
  }

  return snakeToCamel(profileData);
};

/**
 * Update a user (manager only)
 * Story 2.14: Manager User Management
 * Allows updating: firstName, lastName, weeklyHoursTarget
 *
 * @param {string} userId - User UUID to update
 * @param {Object} updateData - Data to update in camelCase
 * @param {string} updateData.firstName - User first name (optional)
 * @param {string} updateData.lastName - User last name (optional)
 * @param {number} updateData.weeklyHoursTarget - Weekly hours target (optional)
 * @returns {Promise<Object>} Updated user profile in camelCase
 * @throws {AppError} NOT_FOUND if user doesn't exist
 * @throws {AppError} UPDATE_FAILED if update fails
 */
const updateUser = async (userId, updateData) => {
  // Whitelist allowed fields
  const allowedFields = ['firstName', 'lastName', 'weeklyHoursTarget'];
  const filtered = Object.fromEntries(
    Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
  );

  // Convert to snake_case for database
  const dbData = {
    ...camelToSnake(filtered),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(dbData)
    .eq('id', userId)
    .select('id, email, first_name, last_name, role, weekly_hours_target')
    .single();

  if (error) {
    // Check for not found error (PostgREST returns error when no rows match)
    if (error.code === 'PGRST116' || !data) {
      throw new AppError('Utilisateur non trouve', 404, 'NOT_FOUND');
    }
    console.error('[USERS] Update user failed:', { userId, error: error.message });
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  if (!data) {
    throw new AppError('Utilisateur non trouve', 404, 'NOT_FOUND');
  }

  return snakeToCamel(data);
};

module.exports = { getProfile, updateProfile, getAllUsers, createUser, updateUser };
