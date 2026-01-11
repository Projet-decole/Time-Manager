// frontend/src/services/usersService.js

import api from '../lib/api';

/**
 * Service for managing users (manager-only operations)
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
  }
};

export default usersService;
