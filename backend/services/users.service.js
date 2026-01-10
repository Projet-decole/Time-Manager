// backend/services/users.service.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');

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

module.exports = { getProfile, updateProfile };
