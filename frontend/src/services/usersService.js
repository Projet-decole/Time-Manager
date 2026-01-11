// frontend/src/services/usersService.js

import api from '../lib/api';

/**
 * Service for managing users (manager-only operations)
 * Story 2.14: Manager User Management
 */
export const usersService = {
  /**
   * Get all users with pagination and optional role filter
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string} [options.role] - Filter by role ('employee' or 'manager')
   * @returns {Promise<Object>} Response with data and pagination meta
   */
  async getAll({ page = 1, limit = 20, role } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (role) {
      params.append('role', role);
    }

    const response = await api.get(`/users?${params}`);
    return response;
  },

  /**
   * Create a new user (manager only)
   * Story 2.14: Manager User Management
   * @param {Object} userData - User data
   * @param {string} userData.email - User email (required)
   * @param {string} userData.firstName - User first name (required)
   * @param {string} userData.lastName - User last name (required)
   * @param {string} [userData.role='employee'] - User role
   * @param {number} [userData.weeklyHoursTarget=35] - Weekly hours target
   * @returns {Promise<Object>} Created user data
   */
  async create({ email, firstName, lastName, role = 'employee', weeklyHoursTarget = 35 }) {
    const response = await api.post('/users', {
      email,
      firstName,
      lastName,
      role,
      weeklyHoursTarget
    });
    return response;
  },

  /**
   * Update a user (manager only)
   * Story 2.14: Manager User Management
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.firstName] - User first name
   * @param {string} [updateData.lastName] - User last name
   * @param {number} [updateData.weeklyHoursTarget] - Weekly hours target
   * @returns {Promise<Object>} Updated user data
   */
  async update(id, { firstName, lastName, weeklyHoursTarget }) {
    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (weeklyHoursTarget !== undefined) data.weeklyHoursTarget = weeklyHoursTarget;

    const response = await api.patch(`/users/${id}`, data);
    return response;
  }
};

export default usersService;
