// frontend/src/services/templatesService.js
// Story 4.10: Implement Template Mode UI - Templates API Service

import api from '../lib/api';

/**
 * Service for managing templates
 * Story 4.10: Template Mode UI
 */
export const templatesService = {
  /**
   * Get all templates with optional pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Object>} Response with data and pagination meta
   */
  async getAll({ page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    const response = await api.get(`/templates?${params}`);
    return response;
  },

  /**
   * Get a single template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template data with entries
   */
  async getById(id) {
    const response = await api.get(`/templates/${id}`);
    return response;
  },

  /**
   * Create a new template
   * @param {Object} data - Template data
   * @param {string} data.name - Template name (required)
   * @param {string} [data.description] - Template description
   * @param {Array} data.entries - Template entries array (required)
   * @returns {Promise<Object>} Created template data
   */
  async create(data) {
    const response = await api.post('/templates', data);
    return response;
  },

  /**
   * Update a template
   * @param {string} id - Template ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated template data
   */
  async update(id, data) {
    const response = await api.patch(`/templates/${id}`, data);
    return response;
  },

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Response data
   */
  async delete(id) {
    const response = await api.delete(`/templates/${id}`);
    return response;
  },

  /**
   * Apply a template to create a day
   * @param {string} id - Template ID
   * @param {Object} data - Application data
   * @param {string} data.date - Target date (YYYY-MM-DD)
   * @returns {Promise<Object>} Created day with blocks and meta
   */
  async apply(id, data) {
    const response = await api.post(`/templates/${id}/apply`, data);
    return response;
  },

  /**
   * Create a template from an existing day entry
   * @param {string} dayId - Day entry ID
   * @param {Object} data - Template data
   * @param {string} data.name - Template name (required)
   * @param {string} [data.description] - Template description
   * @returns {Promise<Object>} Created template data
   */
  async createFromDay(dayId, data) {
    const response = await api.post(`/templates/from-day/${dayId}`, data);
    return response;
  }
};

export default templatesService;
