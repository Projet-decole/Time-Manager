// backend/services/users.service.js

const { supabase } = require('../utils/supabase');
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

module.exports = { getProfile, updateProfile, getAllUsers };
