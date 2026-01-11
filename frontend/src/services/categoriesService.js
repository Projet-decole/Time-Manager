// frontend/src/services/categoriesService.js
// Story 3.8: Admin Management UI - Categories

import api from '../lib/api';

/**
 * Service for managing categories (manager-only operations)
 * Story 3.8: Admin Management UI - Categories
 */
export const categoriesService = {
  /**
   * Get all categories with optional filter for inactive
   * @param {Object} options - Query options
   * @param {boolean} [options.includeInactive=false] - Include inactive categories
   * @returns {Promise<Object>} Response with categories data
   */
  async getAll({ includeInactive = false } = {}) {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    const queryString = params.toString();
    const url = queryString ? `/categories?${queryString}` : '/categories';
    const response = await api.get(url);
    return response;
  },

  /**
   * Get a single category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Category data
   */
  async getById(id) {
    const response = await api.get(`/categories/${id}`);
    return response;
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name (required)
   * @param {string} [categoryData.description] - Category description
   * @param {string} categoryData.color - Category color hex value (required)
   * @returns {Promise<Object>} Created category data
   */
  async create({ name, description, color }) {
    const response = await api.post('/categories', {
      name,
      description: description || null,
      color
    });
    return response;
  },

  /**
   * Update an existing category
   * @param {string} id - Category ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - Category name
   * @param {string} [updateData.description] - Category description
   * @param {string} [updateData.color] - Category color hex value
   * @returns {Promise<Object>} Updated category data
   */
  async update(id, { name, description, color }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;

    const response = await api.patch(`/categories/${id}`, data);
    return response;
  },

  /**
   * Deactivate a category (soft delete)
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Response data
   */
  async deactivate(id) {
    const response = await api.delete(`/categories/${id}`);
    return response;
  },

  /**
   * Activate a previously deactivated category
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Response data
   */
  async activate(id) {
    const response = await api.post(`/categories/${id}/activate`, {});
    return response;
  }
};

export default categoriesService;
